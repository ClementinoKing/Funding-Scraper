import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeJson, logSiteResult, retry, isDeadlineExpired } from './utils.mjs'
import { insertScrapedData, logScrapeRun } from './db.mjs'
import { scrapeSefa } from './sites/sefa.mjs'
import { scrapeTia } from './sites/tia.mjs'
import { scrapePic } from './sites/pic.mjs'
import { scrapeLandBank } from './sites/landbank.mjs'
import { scrapeIdc } from './sites/idc.mjs'
import { scrapeNyda } from './sites/nyda.mjs'
import { scrapeDtic } from './sites/dtic.mjs'
import { scrapeNef } from './sites/nef.mjs'
import { scrapeDsbd } from './sites/dsbd.mjs'
import { scrapeDbsa } from './sites/dbsa.mjs'
import { scrapeGep } from './sites/gep.mjs'
import { scrapeIthala } from './sites/ithala.mjs'
import { scrapeLeda } from './sites/leda.mjs'
import { scrapeMega } from './sites/mega.mjs'
import { scrapeNwdc } from './sites/nwdc.mjs'
import { scrapeNceda } from './sites/nceda.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--disable-images',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  })
  try {
    // Scrape all sites in parallel for maximum speed
    const siteScrapers = [
      { name: 'SEFA', scraper: () => scrapeSefa(browser) },
      { name: 'TIA', scraper: () => scrapeTia(browser) },
      { name: 'PIC', scraper: () => scrapePic(browser) },
      { name: 'Land Bank', scraper: () => scrapeLandBank(browser) },
      { name: 'IDC', scraper: () => scrapeIdc(browser) },
      { name: 'NYDA', scraper: () => scrapeNyda(browser) },
      { name: 'DTIC', scraper: () => scrapeDtic(browser) },
      { name: 'NEF', scraper: () => scrapeNef(browser) },
      { name: 'DSBD', scraper: () => scrapeDsbd(browser) },
      { name: 'DBSA', scraper: () => scrapeDbsa(browser) },
      { name: 'GEP', scraper: () => scrapeGep(browser) },
      { name: 'ITHALA', scraper: () => scrapeIthala(browser) },
      { name: 'LEDA', scraper: () => scrapeLeda(browser) },
      { name: 'MEGA', scraper: () => scrapeMega(browser) },
      { name: 'NWDC', scraper: () => scrapeNwdc(browser) },
      { name: 'NCEDA', scraper: () => scrapeNceda(browser) },
    ]

    console.log(`[scrape] Starting parallel scraping of ${siteScrapers.length} sites...`)
    const startTime = Date.now()

    // Process all sites in parallel for maximum speed
    const results = []
    const siteResults = [] // Track individual site results for logging
    
    // Run all scrapers in parallel
    const allResults = await Promise.allSettled(
      siteScrapers.map(async ({ name, scraper }) => {
        const siteStartTime = Date.now()
        try {
          const items = await retry(scraper, { retries: 1, delayMs: 500 })
            const duration = (Date.now() - siteStartTime) / 1000
            logSiteResult(name, items)
            
            // Log individual site scrape
            siteResults.push({ name, items, duration, error: null })
            
            // Log to database (non-blocking)
            logScrapeRun({
              sourceUrl: null,
              sourceName: name,
              programsFound: items.length,
              subprogramsFound: 0, // Will be calculated later
              status: 'success',
              durationSeconds: duration,
              startedAt: new Date(siteStartTime).toISOString(),
              completedAt: new Date().toISOString(),
            }).catch(err => console.warn(`[scrape] Failed to log ${name} scrape:`, err.message))
            
            return items
          } catch (e) {
            const duration = (Date.now() - siteStartTime) / 1000
            logSiteResult(name, [], e)
            
            siteResults.push({ name, items: [], duration, error: e })
            
            // Log error to database (non-blocking)
            logScrapeRun({
              sourceUrl: null,
              sourceName: name,
              programsFound: 0,
              subprogramsFound: 0,
              status: 'error',
              errorMessage: e.message,
              durationSeconds: duration,
              startedAt: new Date(siteStartTime).toISOString(),
              completedAt: new Date().toISOString(),
            }).catch(err => console.warn(`[scrape] Failed to log ${name} error:`, err.message))
            
            return []
          }
        })
    )
    
    results.push(...allResults)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[scrape] Completed all sites in ${elapsed}s`)

    const allPrograms = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
    
    // Count and filter expired programs
    const expiredPrograms = allPrograms.filter(p => {
      if (p.deadlines && p.deadlines.trim().length > 0) {
        return isDeadlineExpired(p.deadlines)
      }
      return false
    })
    
    if (expiredPrograms.length > 0) {
      console.log(`[scrape] Filtered out ${expiredPrograms.length} expired program(s)`)
    }
    
    // Filter out expired programs
    const activePrograms = allPrograms.filter(p => {
      if (p.deadlines && p.deadlines.trim().length > 0) {
        return !isDeadlineExpired(p.deadlines)
      }
      return true // Keep programs without deadlines (assumed ongoing)
    })
    
    // Organize subprograms into parent programs
    const organizedPrograms = []
    const subprograms = []
    
    // Separate main programs from subprograms (using active programs only)
    for (const program of activePrograms) {
      if (program.parentProgram && program.parentSource) {
        // This is a subprogram
        subprograms.push(program)
      } else {
        organizedPrograms.push(program)
      }
    }
    
    // Attach subprograms to their parent programs
    const orphanedSubprograms = []
    for (const subprogram of subprograms) {
      const parent = organizedPrograms.find(
        p => p.name === subprogram.parentProgram && 
        p.source === subprogram.parentSource
      )
      if (parent) {
        if (!parent.subprograms) {
          parent.subprograms = []
        }
        // Remove parent references from subprogram
        const { parentProgram, parentSource, ...cleanSubprogram } = subprogram
        parent.subprograms.push(cleanSubprogram)
      } else {
        // Parent not found, keep as orphaned subprogram (don't add to organizedPrograms)
        orphanedSubprograms.push(subprogram)
      }
    }

    // Write to JSON file (for backup/fallback)
    const outputPath = path.resolve(__dirname, '../../public/data/funding.json')
    const payload = {
      lastUpdated: new Date().toISOString(),
      programs: organizedPrograms,
    }
    await writeJson(outputPath, payload)
    console.log(`[scrape] Wrote ${organizedPrograms.length} programs (${subprograms.length} subprograms) to public/data/funding.json`)

    // Insert into Supabase database
    try {
      console.log('[scrape] Inserting data into Supabase database...')
      // Only pass orphaned subprograms (those whose parent wasn't found)
      // Nested subprograms are already in organizedPrograms
      const dbSummary = await insertScrapedData(organizedPrograms, orphanedSubprograms)
      
      if (dbSummary.errors.length > 0) {
        console.warn(`[scrape] Database insertion completed with ${dbSummary.errors.length} errors`)
      } else {
        console.log(`[scrape] Successfully inserted ${dbSummary.programsInserted} programs and ${dbSummary.subprogramsInserted} subprograms into database`)
      }

      // Log overall scrape run
      const totalDuration = (Date.now() - startTime) / 1000
      await logScrapeRun({
        sourceUrl: null,
        sourceName: 'All Sites',
        programsFound: organizedPrograms.length,
        subprogramsFound: subprograms.length,
        status: dbSummary.errors.length > 0 ? 'partial' : 'success',
        errorMessage: dbSummary.errors.length > 0 ? `Errors: ${dbSummary.errors.length}` : null,
        durationSeconds: totalDuration,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error('[scrape] Fatal error inserting into database:', dbError.message)
      // Log the error but don't fail the entire scrape
      await logScrapeRun({
        sourceUrl: null,
        sourceName: 'All Sites',
        programsFound: organizedPrograms.length,
        subprogramsFound: subprograms.length,
        status: 'error',
        errorMessage: dbError.message,
        durationSeconds: (Date.now() - startTime) / 1000,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
      })
    }
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error('[scrape] Fatal error:', err)
  process.exitCode = 1
})


