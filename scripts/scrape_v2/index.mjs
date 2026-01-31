#!/usr/bin/env node
import { chromium } from 'playwright'
import { scrapeSource, discoverSourcesFromSearch } from './scraper.mjs'
import { 
  getSourcesToScrape, 
  logScrapeRun, 
  updateSourceLastScraped,
  getSearchQueries 
} from './database.mjs'
import { logger } from './utils.mjs'

// Browser configuration for optimal performance
const BROWSER_ARGS = [
  '--disable-images',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-extensions',
  '--disable-plugins',
  '--disable-background-networking',
  '--no-sandbox',
  '--disable-setuid-sandbox'
]

/**
 * Main scraping orchestrator
 */
async function runScraper(options = {}) {
  const { 
    mode = 'scrape', // 'scrape' or 'discover'
    sourceIds = null, // Specific source IDs to scrape
    parallel = true,
    concurrency = 3
  } = options

  const browser = await chromium.launch({ 
    headless: true,
    args: BROWSER_ARGS
  })

  try {
    if (mode === 'discover') {
      await runDiscoveryMode(browser)
    } else {
      await runScrapeMode(browser, { sourceIds, parallel, concurrency })
    }
  } finally {
    await browser.close()
  }
}

/**
 * Scrape mode - scrape existing sources
 */
async function runScrapeMode(browser, { sourceIds, parallel, concurrency }) {
  logger.info('Starting scrape mode...')
  
  // Get sources to scrape
  const sources = await getSourcesToScrape(sourceIds)
  
  if (sources.length === 0) {
    logger.warn('No active sources found to scrape')
    return
  }

  logger.info(`Found ${sources.length} source(s) to scrape`)

  if (parallel && sources.length > 1) {
    // Parallel scraping with concurrency control
    await scrapeInParallel(browser, sources, concurrency)
  } else {
    // Sequential scraping
    for (const source of sources) {
      await scrapeSourceWithLogging(browser, source)
    }
  }

  logger.info('Scraping completed')
}

/**
 * Discovery mode - find new sources via search engines
 */
async function runDiscoveryMode(browser) {
  logger.info('Starting discovery mode...')
  
  const queries = await getSearchQueries()
  
  if (queries.length === 0) {
    logger.warn('No search queries configured')
    return
  }

  logger.info(`Running ${queries.length} search queries...`)

  for (const query of queries) {
    try {
      const discovered = await discoverSourcesFromSearch(browser, query)
      logger.info(`Discovered ${discovered.length} potential sources from query: "${query.query}"`)
    } catch (error) {
      logger.error(`Failed to run search query "${query.query}":`, error)
    }
  }

  logger.info('Discovery completed')
}

/**
 * Scrape a single source with full logging
 */
async function scrapeSourceWithLogging(browser, source) {
  const startTime = Date.now()
  const runData = {
    source_id: source.id,
    status: 'running',
    started_at: new Date().toISOString()
  }

  const runId = await logScrapeRun(runData)

  try {
    logger.info(`Scraping ${source.name} (${source.base_url})...`)
    
    const result = await scrapeSource(browser, source)
    
    const duration = (Date.now() - startTime) / 1000

    // Update run log with success
    await logScrapeRun({
      id: runId,
      status: 'success',
      items_found: result.itemsFound,
      items_inserted: result.itemsInserted,
      items_updated: result.itemsUpdated,
      duration_seconds: Math.round(duration),
      completed_at: new Date().toISOString(),
      metadata: result.metadata
    })

    // Update source last scraped timestamp
    await updateSourceLastScraped(source.id)

    logger.info(`✓ ${source.name}: ${result.itemsInserted} inserted, ${result.itemsUpdated} updated (${duration.toFixed(1)}s)`)

    return result
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000

    // Update run log with error
    await logScrapeRun({
      id: runId,
      status: 'failed',
      error_message: error.message,
      duration_seconds: Math.round(duration),
      completed_at: new Date().toISOString()
    })

    logger.error(`✗ ${source.name}: ${error.message}`)
    
    throw error
  }
}

/**
 * Scrape sources in parallel with concurrency control
 */
async function scrapeInParallel(browser, sources, concurrency) {
  const results = []
  
  for (let i = 0; i < sources.length; i += concurrency) {
    const batch = sources.slice(i, i + concurrency)
    
    const batchResults = await Promise.allSettled(
      batch.map(source => scrapeSourceWithLogging(browser, source))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        logger.error('Batch scrape error:', result.reason)
      }
    }
  }

  return results
}

// CLI handling
const args = process.argv.slice(2)
const options = {}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  
  if (arg === '--discover') {
    options.mode = 'discover'
  } else if (arg === '--source' && args[i + 1]) {
    options.sourceIds = args[i + 1].split(',').map(id => parseInt(id.trim()))
    i++
  } else if (arg === '--sequential') {
    options.parallel = false
  } else if (arg === '--concurrency' && args[i + 1]) {
    options.concurrency = parseInt(args[i + 1])
    i++
  }
}

// Run scraper
runScraper(options)
  .then(() => {
    logger.info('Scraper finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    logger.error('Fatal error:', error)
    process.exit(1)
  })
