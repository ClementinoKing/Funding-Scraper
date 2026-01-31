import { 
  normalizeText, 
  extractUrl, 
  generateSlug, 
  hashContent,
  delay,
  fetchPageText,
  fetchPageTextWithBrowser,
  looksLikeLoaderPage
} from './utils.mjs'
import { enhanceWithAI } from './ai.mjs'

const DEFAULT_TIMEOUT = 20000
const DEFAULT_CONCURRENCY = 6
const DEFAULT_MAX_LINKS = 20

/**
 * Main scraping function - scrapes a single source
 */
export async function scrapeSource(browser, source) {
  const config = source.config || {}
  const baseUrl = source.base_url

  const result = {
    itemsFound: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    metadata: {}
  }

  // Create a new page for this source
  const page = await browser.newPage()
  
  try {
    // Configure page
    await configurePage(page, config)
    
    // Navigate to base URL
    await navigateToPage(page, baseUrl)

    // Discover links to scrape
    const links = await discoverLinks(page, baseUrl, config)
    result.metadata.linksDiscovered = links.length

    // Extract from main page
    const mainItem = await extractFromPage(page, baseUrl, source, config)
    const items = mainItem ? [mainItem] : []

    // Extract from discovered links
    if (links.length > 0) {
      const linkedItems = await extractFromLinks(
        browser, 
        links, 
        source, 
        config
      )
      items.push(...linkedItems)
    }

    result.itemsFound = items.length

    // AI Enhancement (if enabled in config)
    if (config.aiEnhancement && items.length > 0) {
      const enhancedItems = await enhanceItemsWithAI(items, source, config)
      result.metadata.itemsEnhanced = enhancedItems.length
      
      // Use enhanced items instead of original
      const { inserted, updated } = await saveItems(enhancedItems, source.id)
      result.itemsInserted = inserted
      result.itemsUpdated = updated
    } else {
      // Save items to database without AI enhancement
      const { inserted, updated } = await saveItems(items, source.id)
      result.itemsInserted = inserted
      result.itemsUpdated = updated
    }

    return result
  } finally {
    await page.close()
  }
}

/**
 * Configure page for optimal scraping
 */
async function configurePage(page, config) {
  page.setDefaultNavigationTimeout(config.timeout || DEFAULT_TIMEOUT)
  
  // Block unnecessary resources
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType()
    const blockedTypes = config.blockResources || ['image', 'stylesheet', 'font', 'media']
    
    if (blockedTypes.includes(resourceType)) {
      route.abort()
    } else {
      route.continue()
    }
  })
}

/**
 * Navigate to a page with retries
 */
async function navigateToPage(page, url, retries = 2) {
  const waitOptions = ['domcontentloaded', 'load', 'commit']
  
  for (let i = 0; i < waitOptions.length; i++) {
    try {
      await page.goto(url, { 
        waitUntil: waitOptions[i],
        timeout: DEFAULT_TIMEOUT 
      })
      return
    } catch (error) {
      if (i === waitOptions.length - 1) {
        throw error
      }
    }
  }
}

/**
 * Discover links on the page to scrape
 */
async function discoverLinks(page, baseUrl, config) {
  const keywordPattern = config.keywordPattern || 
    '(funding|programme|program|apply|grant|loan|opportunity|finance|support|product)'
  
  const maxLinks = config.maxLinks || DEFAULT_MAX_LINKS
  
  const links = await page.$$eval('a[href]', (anchors, pattern) => {
    const regex = new RegExp(pattern, 'i')
    return anchors
      .map(a => ({
        href: a.href,
        text: a.textContent?.trim() || ''
      }))
      .filter(link => {
        // Basic filtering
        if (!link.href) return false
        if (link.href.startsWith('#')) return false
        if (link.href.startsWith('mailto:')) return false
        if (link.href.startsWith('tel:')) return false
        
        // Keyword matching
        return regex.test(link.href) || regex.test(link.text)
      })
  }, keywordPattern)

  // Normalize and deduplicate URLs
  const baseUrlObj = new URL(baseUrl)
  const uniqueUrls = new Set()
  const discovered = []

  for (const link of links) {
    try {
      const url = new URL(link.href, baseUrl)
      
      // Only same origin
      if (url.origin !== baseUrlObj.origin) continue
      
      const urlString = url.toString()
      if (!uniqueUrls.has(urlString)) {
        uniqueUrls.add(urlString)
        discovered.push(urlString)
      }
    } catch (error) {
      // Invalid URL, skip
    }
  }

  return discovered.slice(0, maxLinks)
}

/**
 * Extract data from a single page
 */
async function extractFromPage(page, url, source, config) {
  await page.waitForTimeout(100) // Small delay for content to load

  const data = await page.evaluate((cfg) => {
    // Find main content area
    const mainSelectors = [
      'main', 
      'article', 
      '[role="main"]', 
      '.content', 
      '.main-content',
      '.page-content'
    ]
    
    let mainContent = null
    for (const selector of mainSelectors) {
      mainContent = document.querySelector(selector)
      if (mainContent) break
    }
    
    if (!mainContent) {
      mainContent = document.body
    }

    // Remove noise
    const noiseSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.nav', '.navigation', '.menu', '.sidebar',
      '.cookie', '.popup', '.advertisement'
    ]
    
    const mainClone = mainContent.cloneNode(true)
    noiseSelectors.forEach(selector => {
      mainClone.querySelectorAll(selector).forEach(el => el.remove())
    })

    // Extract title
    const titleSelectors = cfg.titleSelector || 'h1, h2'
    const titleEl = mainClone.querySelector(titleSelectors)
    const title = titleEl?.textContent?.trim() || document.title

    // Extract content
    const contentText = mainClone.innerText || mainClone.textContent || ''
    
    // Extract structured data based on patterns
    const structuredData = {}

    // Email pattern
    const emailMatch = contentText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
    if (emailMatch) {
      structuredData.email = emailMatch[0]
    }

    // Phone pattern (South African format)
    const phoneMatch = contentText.match(/\b(?:\+27|0)(?:\d{2})\s?\d{3}\s?\d{4}\b/)
    if (phoneMatch) {
      structuredData.phone = phoneMatch[0]
    }

    // Amount pattern
    const amountMatches = contentText.match(/\b(?:R|ZAR)\s?\d[\d\s,]*(?:\.\d+)?\s?(?:million|bn|billion|k)?/gi)
    if (amountMatches) {
      structuredData.amounts = amountMatches.slice(0, 5)
    }

    // Date pattern
    const dateMatches = contentText.match(/\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}\b/gi)
    if (dateMatches) {
      structuredData.dates = dateMatches.slice(0, 3)
    }

    // Get all paragraphs for summary
    const paragraphs = Array.from(mainClone.querySelectorAll('p'))
      .map(p => p.textContent?.trim())
      .filter(text => text && text.length > 20 && text.length < 500)
      .slice(0, 3)

    return {
      title,
      contentText: contentText.slice(0, 10000), // Limit content size
      paragraphs,
      structuredData,
      htmlSnapshot: mainContent.innerHTML.slice(0, 50000) // Limited HTML
    }
  }, config)

  if (!data.title || data.title.length < 3) {
    return null // Invalid item
  }

  // Build the item
  const item = {
    source_id: source.id,
    url: url,
    slug: generateSlug(data.title, url),
    title: normalizeText(data.title),
    summary: data.paragraphs[0] || '',
    content_text: normalizeText(data.contentText),
    content_html: data.htmlSnapshot,
    structured_data: data.structuredData,
    category: inferCategory(data.title, data.contentText),
    tags: extractTags(data.contentText),
    content_hash: hashContent(data.contentText)
  }

  return item
}

/**
 * Extract from multiple links in parallel
 */
async function extractFromLinks(browser, links, source, config) {
  const concurrency = config.concurrency || DEFAULT_CONCURRENCY
  const items = []

  for (let i = 0; i < links.length; i += concurrency) {
    const batch = links.slice(i, i + concurrency)
    
    const results = await Promise.allSettled(
      batch.map(async (link) => {
        const page = await browser.newPage()
        try {
          await configurePage(page, config)
          await navigateToPage(page, link)
          return await extractFromPage(page, link, source, config)
        } catch (error) {
          return null
        } finally {
          await page.close()
        }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        items.push(result.value)
      }
    }

    // Small delay between batches
    if (i + concurrency < links.length) {
      await delay(config.delayMs || 50)
    }
  }

  return items
}

/**
 * Infer category from title and content
 */
function inferCategory(title, content) {
  const text = `${title} ${content}`.toLowerCase()

  if (/\b(grant|donation|award)\b/.test(text)) return 'grant'
  if (/\b(loan|credit|finance)\b/.test(text)) return 'loan'
  if (/\b(equity|investment|venture)\b/.test(text)) return 'equity'
  if (/\b(tender|contract|procurement)\b/.test(text)) return 'tender'
  if (/\b(training|course|workshop|education)\b/.test(text)) return 'training'
  if (/\b(mentorship|advisory|support|incubat)\b/.test(text)) return 'support'

  return 'other'
}

/**
 * Extract relevant tags from content
 */
function extractTags(content) {
  const tags = new Set()
  const text = content.toLowerCase()

  // Sector tags
  const sectors = [
    'agriculture', 'manufacturing', 'technology', 'retail', 'tourism',
    'construction', 'healthcare', 'education', 'finance', 'energy',
    'transport', 'mining', 'media', 'telecommunications'
  ]

  for (const sector of sectors) {
    if (text.includes(sector)) {
      tags.add(sector)
    }
  }

  // Target audience tags
  const audiences = [
    'women', 'youth', 'startup', 'sme', 'smme', 'entrepreneur',
    'cooperative', 'township', 'rural', 'black-owned'
  ]

  for (const audience of audiences) {
    if (text.includes(audience)) {
      tags.add(audience)
    }
  }

  return Array.from(tags)
}

/**
 * Enhance items with AI processing
 */
async function enhanceItemsWithAI(items, source, config) {
  const enhanced = []
  
  for (const item of items) {
    try {
      // Fetch full page content for AI enhancement
      let pageText = item.content_text
      
      if (config.fetchPageForAI) {
        try {
          pageText = await fetchPageText(item.url)
          
          // If it looks like a loader page, use browser
          if (looksLikeLoaderPage(pageText)) {
            pageText = await fetchPageTextWithBrowser(item.url)
          }
        } catch (error) {
          // Fall back to scraped content
          pageText = item.content_text
        }
      }
      
      // Enhance with AI
      const aiResult = await enhanceWithAI(item, pageText, config)
      
      // AI might return array if it splits program into multiple opportunities
      if (Array.isArray(aiResult)) {
        for (const enhancedItem of aiResult) {
          enhanced.push({
            ...item,
            ...enhancedItem,
            source_id: source.id,
            ai_enhanced: true,
            ai_confidence: enhancedItem.confidence || null
          })
        }
      } else {
        enhanced.push({
          ...item,
          ...aiResult,
          ai_enhanced: true,
          ai_confidence: aiResult.confidence || null
        })
      }
    } catch (error) {
      console.error(`AI enhancement failed for ${item.url}:`, error.message)
      // Include original item if AI fails
      enhanced.push(item)
    }
  }
  
  return enhanced
}

/**
 * Save items to database
 * This will be imported from database.mjs
 */
async function saveItems(items, sourceId) {
  // Placeholder - will be implemented in database.mjs
  const { insertOrUpdateItems } = await import('./database.mjs')
  return await insertOrUpdateItems(items, sourceId)
}

/**
 * Discover new sources from search engines
 */
export async function discoverSourcesFromSearch(browser, searchQuery) {
  // This would use a search API or scrape search results
  // Placeholder for now
  return []
}
