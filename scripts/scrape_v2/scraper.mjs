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

// ══════════════════════════════════════════════════════════════════════════════
// FUNDING PROGRAM RELEVANCE DETECTION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Determine if a page is actually a funding program (vs. About, Contact, etc.)
 * Returns { isRelevant: boolean, reason: string, confidence: number }
 */
function isRelevantFundingPage(url, title, content) {
  const urlLower = url.toLowerCase()
  const titleLower = (title || '').toLowerCase()
  const contentLower = content.toLowerCase()
  
  // ── Blacklist patterns (auto-reject) ──────────────────────────────────────
  const blacklistPatterns = [
    // Navigation / utility pages
    /\b(about|contact|privacy|terms|cookie|legal|disclaimer|sitemap|search)\b/,
    // Corporate pages
    /\b(careers|jobs|news|media|press|events|team|leadership|board|history)\b/,
    // Generic info pages
    /\b(faq|help|support|login|register|signup|signin|logout)\b/,
    // Social / external
    /\b(facebook|twitter|linkedin|instagram|youtube)\b/,
    // File extensions (not HTML pages)
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|jpg|png|gif)$/i
  ]
  
  for (const pattern of blacklistPatterns) {
    if (pattern.test(urlLower) || pattern.test(titleLower)) {
      return { 
        isRelevant: false, 
        reason: 'Blacklisted page type (About/Contact/etc.)', 
        confidence: 0.95 
      }
    }
  }
  
  // ── Positive signals (funding program indicators) ─────────────────────────
  const fundingKeywords = [
    'fund', 'funding', 'grant', 'loan', 'finance', 'credit',
    'programme', 'program', 'opportunity', 'apply', 'application',
    'eligibility', 'eligible', 'criteria', 'requirement',
    'sme', 'smme', 'startup', 'entrepreneur', 'business',
    'investment', 'equity', 'venture', 'capital', 'solution',
    'tender', 'procurement', 'bid', 'subsidy', 'voucher'
  ]
  
  let keywordCount = 0
  for (const keyword of fundingKeywords) {
    const regex = new RegExp(`\\b${keyword}`, 'i')
    if (regex.test(contentLower)) keywordCount++
    if (regex.test(titleLower)) keywordCount += 2 // Title matches are stronger
    if (regex.test(urlLower)) keywordCount += 1.5 // URL matches also strong
  }
  
  // ── Negative signals (generic content) ────────────────────────────────────
  const genericPhrases = [
    'all rights reserved', 'copyright', '© 20',
    'we are committed', 'our mission', 'our vision',
    'contact us', 'get in touch', 'follow us',
    'terms and conditions', 'privacy policy'
  ]
  
  let genericCount = 0
  for (const phrase of genericPhrases) {
    if (contentLower.includes(phrase)) genericCount++
  }
  
  // ── Content length heuristic ──────────────────────────────────────────────
  // Real funding pages typically have substantial content
  const contentLength = content.length
  const hasSubstantialContent = contentLength > 500
  
  // ── Calculate confidence ──────────────────────────────────────────────────
  let confidence = 0
  
  // Strong positive: 3+ funding keywords
  if (keywordCount >= 5) confidence += 0.4
  else if (keywordCount >= 3) confidence += 0.3
  else if (keywordCount >= 1) confidence += 0.1
  
  // Moderate positive: substantial content
  if (hasSubstantialContent) confidence += 0.2
  
  // Negative: too generic
  if (genericCount > 3) confidence -= 0.3
  
  // Boost if URL or title explicitly mentions funding
  if (/\b(funding|grant|loan|programme|program|apply)\b/.test(urlLower)) confidence += 0.2
  if (/\b(funding|grant|loan|programme|program)\b/.test(titleLower)) confidence += 0.15
  
  const isRelevant = confidence >= 0.3 && keywordCount > 0
  
  return {
    isRelevant,
    reason: isRelevant 
      ? `Detected ${keywordCount} funding keywords (confidence: ${confidence.toFixed(2)})` 
      : `Insufficient funding signals (keywords: ${keywordCount}, confidence: ${confidence.toFixed(2)})`,
    confidence: Math.max(0, Math.min(1, confidence)),
    signals: { keywordCount, genericCount, contentLength }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATION DISCOVERY (for dropdown menus, mega-menus, etc.)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Discover links from navigation menus, including hidden dropdowns
 * Returns array of { url, text, menuLevel } where menuLevel indicates nesting depth
 */
async function discoverNavigationLinks(page, baseUrl, config) {
  const navLinks = await page.evaluate(() => {
    const links = []
    
    // Find all nav elements (header, nav, menu, dropdown, etc.)
    const navSelectors = [
      'nav', 'header', '.navigation', '.menu', '.navbar',
      '[role="navigation"]', '.main-menu', '.primary-menu',
      '.dropdown', '.mega-menu', '.submenu'
    ]
    
    const navElements = new Set()
    navSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => navElements.add(el))
    })
    
    // Extract all links from nav elements
    navElements.forEach(navEl => {
      const anchors = navEl.querySelectorAll('a[href]')
      anchors.forEach(a => {
        const href = a.href
        const text = a.textContent?.trim() || ''
        
        // Determine nesting level (how deep in the menu)
        let menuLevel = 0
        let parent = a.parentElement
        while (parent && parent !== navEl) {
          if (parent.matches('ul, ol, .dropdown, .submenu, .menu-item')) menuLevel++
          parent = parent.parentElement
        }
        
        links.push({ href, text, menuLevel })
      })
    })
    
    return links
  })
  
  // Filter and normalize
  const keywordPattern = config.navKeywordPattern || config.keywordPattern ||
    '(funding|programme|program|apply|grant|loan|opportunity|finance|support|product|solution)'
  const regex = new RegExp(keywordPattern, 'i')
  
  const baseUrlObj = new URL(baseUrl)
  const discovered = []
  const seen = new Set()
  
  for (const link of navLinks) {
    try {
      const url = new URL(link.href, baseUrl)
      
      // Only same origin
      if (url.origin !== baseUrlObj.origin) continue
      
      // Skip anchors, mailto, tel
      if (url.hash && url.pathname === new URL(baseUrl).pathname) continue
      if (url.protocol === 'mailto:' || url.protocol === 'tel:') continue
      
      // Must match keyword pattern
      if (!regex.test(link.href) && !regex.test(link.text)) continue
      
      const urlString = url.toString()
      if (!seen.has(urlString)) {
        seen.add(urlString)
        discovered.push({
          url: urlString,
          text: link.text,
          menuLevel: link.menuLevel,
          source: 'navigation'
        })
      }
    } catch (error) {
      // Invalid URL, skip
    }
  }
  
  return discovered
}

// ══════════════════════════════════════════════════════════════════════════════
// MULTI-PAGE PROGRAM CORRELATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Correlate pages that belong to the same funding program
 * (e.g., /program-x/overview, /program-x/apply, /program-x/eligibility)
 * Returns groups: [ [item1a, item1b], [item2a, item2b, item2c], ... ]
 */
function correlateProgramPages(items) {
  const groups = []
  const assigned = new Set()
  
  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue
    
    const group = [items[i]]
    assigned.add(i)
    
    const urlA = new URL(items[i].url)
    const pathA = urlA.pathname
    
    // Extract base path (everything before the last segment)
    // E.g., /programs/youth-fund/overview → /programs/youth-fund
    const basePathA = pathA.substring(0, pathA.lastIndexOf('/'))
    
    for (let j = i + 1; j < items.length; j++) {
      if (assigned.has(j)) continue
      
      const urlB = new URL(items[j].url)
      const pathB = urlB.pathname
      const basePathB = pathB.substring(0, pathB.lastIndexOf('/'))
      
      // Same base path = likely the same program
      if (basePathA && basePathB && basePathA === basePathB) {
        group.push(items[j])
        assigned.add(j)
        continue
      }
      
      // Check if one URL is a prefix of the other
      if (pathA.startsWith(pathB) || pathB.startsWith(pathA)) {
        group.push(items[j])
        assigned.add(j)
        continue
      }
      
      // Check title similarity (same program name in both titles)
      const titleA = items[i].title.toLowerCase().replace(/\b(overview|apply|application|eligibility|how to|about|details)\b/gi, '').trim()
      const titleB = items[j].title.toLowerCase().replace(/\b(overview|apply|application|eligibility|how to|about|details)\b/gi, '').trim()
      
      if (titleA.length > 10 && titleB.length > 10 && titleA === titleB) {
        group.push(items[j])
        assigned.add(j)
      }
    }
    
    groups.push(group)
  }
  
  return groups
}

/**
 * Consolidate multiple pages into a single comprehensive item
 */
function consolidateGroup(group) {
  if (group.length === 1) return group[0]
  
  // Sort by URL path length (prefer the "main" page, usually shortest)
  group.sort((a, b) => a.url.length - b.url.length)
  
  const base = { ...group[0] }
  
  // Aggregate content from all pages
  const allContent = group.map(item => item.content_text).join('\n\n')
  const allSummaries = group.map(item => item.summary).filter(Boolean).join(' ')
  const allStructuredData = {}
  
  // Merge structured data (prefer non-empty values)
  for (const item of group) {
    for (const [key, value] of Object.entries(item.structured_data || {})) {
      if (value && (!allStructuredData[key] || Array.isArray(value) && value.length > (allStructuredData[key]?.length || 0))) {
        allStructuredData[key] = value
      }
    }
  }
  
  // Merge tags
  const allTags = new Set()
  group.forEach(item => (item.tags || []).forEach(tag => allTags.add(tag)))
  
  // Build consolidated item
  return {
    ...base,
    summary: allSummaries.slice(0, 500), // Keep reasonably short
    content_text: allContent.slice(0, 15000), // Larger limit for merged content
    structured_data: allStructuredData,
    tags: Array.from(allTags),
    content_hash: hashContent(allContent),
    consolidated: true,
    source_pages: group.map(item => item.url)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCRAPING FUNCTION (UPDATED)
// ══════════════════════════════════════════════════════════════════════════════

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

    // ── Phase 1: Discover links ────────────────────────────────────────────
    // Standard link discovery
    const standardLinks = await discoverLinks(page, baseUrl, config)
    
    // Navigation discovery (for dropdown menus)
    const navLinks = await discoverNavigationLinks(page, baseUrl, config)
    
    // Combine and deduplicate
    const allLinks = [...standardLinks, ...navLinks.map(l => l.url)]
    const uniqueLinks = [...new Set(allLinks)]
    
    result.metadata.linksDiscovered = uniqueLinks.length
    result.metadata.navLinksDiscovered = navLinks.length

    // ── Phase 2: Extract from pages ────────────────────────────────────────
    // Extract from main page
    const mainItem = await extractFromPage(page, baseUrl, source, config)
    const items = []
    
    if (mainItem && mainItem.isRelevant) {
      items.push(mainItem)
    } else if (mainItem) {
      result.metadata.mainPageRejected = mainItem.relevanceCheck?.reason || 'Not relevant'
    }

    // Extract from discovered links
    if (uniqueLinks.length > 0) {
      const linkedItems = await extractFromLinks(
        browser, 
        uniqueLinks, 
        source, 
        config
      )
      items.push(...linkedItems.filter(item => item.isRelevant))
      result.metadata.irrelevantPagesFiltered = linkedItems.filter(item => !item.isRelevant).length
    }

    // ── Phase 3: Correlate and consolidate ─────────────────────────────────
    let finalItems = items
    
    if (config.consolidateRelatedPages !== false && items.length > 1) {
      const groups = correlateProgramPages(items)
      finalItems = groups.map(group => consolidateGroup(group))
      result.metadata.pagesConsolidated = items.length - finalItems.length
    }

    result.itemsFound = finalItems.length

    // ── Phase 4: AI Enhancement (if enabled) ───────────────────────────────
    if (config.aiEnhancement && finalItems.length > 0) {
      const enhancedItems = await enhanceItemsWithAI(finalItems, source, config)
      result.metadata.itemsEnhanced = enhancedItems.length
      
      // Use enhanced items instead of original
      const { inserted, updated } = await saveItems(enhancedItems, source.id)
      result.itemsInserted = inserted
      result.itemsUpdated = updated
    } else {
      // Save items to database without AI enhancement
      const { inserted, updated } = await saveItems(finalItems, source.id)
      result.itemsInserted = inserted
      result.itemsUpdated = updated
    }

    return result
  } finally {
    await page.close()
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXISTING FUNCTIONS (UPDATED)
// ══════════════════════════════════════════════════════════════════════════════

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
 * Discover links on the page to scrape (body content links)
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
 * Extract data from a single page (UPDATED with relevance check)
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

  // ── NEW: Check relevance ─────────────────────────────────────────────────
  const relevanceCheck = isRelevantFundingPage(url, data.title, data.contentText)
  
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
    content_hash: hashContent(data.contentText),
    // Attach relevance metadata
    isRelevant: relevanceCheck.isRelevant,
    relevanceCheck
  }

  return item
}

/**
 * Extract from multiple links in parallel (UPDATED to skip irrelevant)
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
