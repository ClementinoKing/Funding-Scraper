import { normalizeText, cleanText, extractContactInfo, extractApplicationProcess, extractSectors, isValidProgram, filterMarketingContent, extractCleanSummary } from './utils.mjs'

const DEFAULT_LINK_KEYWORDS = /(funding|programme|program|apply|instrument|grant|loan|tender|opportunit|finance|support)/i
const DEFAULT_MAX_LINKS = 12
const DEFAULT_DELAY_MS = 50 // Minimal delay for speed
const DEFAULT_CONCURRENCY = 6 // Increased concurrency for parallel processing

function sameOrigin(a, b) {
  try {
    const ua = new URL(a)
    const ub = new URL(b)
    return ua.origin === ub.origin
  } catch {
    return false
  }
}

export async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Process items in parallel batches with concurrency limit
async function processInParallel(items, concurrency, processor) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    )
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value)
      }
    }
  }
  return results
}

export async function discoverLinks(page, { keywordRegex = DEFAULT_LINK_KEYWORDS, baseUrl }) {
  const links = await page.$$eval('a[href]', (anchors) =>
    anchors.map((a) => ({ href: a.getAttribute('href'), text: a.textContent || '' })),
  )
  const absolute = []
  for (const { href } of links) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    let url
    try {
      url = new URL(href, baseUrl).toString()
    } catch {
      continue
    }
    if (!keywordRegex.test(href)) continue
    if (!sameOrigin(url, baseUrl)) continue
    absolute.push(url)
  }
  // de-dupe while preserving order
  return Array.from(new Set(absolute))
}

function firstNonEmpty(...candidates) {
  for (const c of candidates) {
    const t = normalizeText(c)
    if (t) return t
  }
  return ''
}

function extractByHeadingFromHtml(htmlText, headingRegex) {
  const text = htmlText.replace(/\s+/g, ' ')
  const headingMatch = text.match(headingRegex)
  if (!headingMatch) return ''
  
  // Start after the heading text
  const start = (headingMatch.index ?? 0) + headingMatch[0].length
  let extracted = text.slice(start).trim()
  
  // Stop at next section heading
  const nextHeadingMatch = extracted.match(/\b(overview|summary|funding|application|process|how to apply|contact|success|stories|testimonials|related|see also|next steps|more information|benefits|features|about|background)\b/i)
  if (nextHeadingMatch && nextHeadingMatch.index < 500) {
    extracted = extracted.slice(0, nextHeadingMatch.index)
  }
  
  // Stop at marketing content markers
  const marketingMarkers = [
    /(we want to|pay homage|entrepreneurs.*?courage|journey|shape our economy|made a difference|partner with|success stories|our stories|our supplier stories|testimonials|case studies)/i,
    /(click here|learn more|read more|find out more|discover|explore|visit|subscribe|newsletter|follow us|share)/i,
  ]
  
  for (const marker of marketingMarkers) {
    const markerMatch = extracted.match(marker)
    if (markerMatch && markerMatch.index < 500) {
      extracted = extracted.slice(0, markerMatch.index)
      break
    }
  }
  
  // Limit length
  extracted = extracted.slice(0, 500).trim()
  
  // Remove trailing incomplete sentences (try to end at a period)
  const lastPeriod = extracted.lastIndexOf('.')
  if (lastPeriod > 300) {
    extracted = extracted.slice(0, lastPeriod + 1)
  }
  
  // Apply marketing filter
  extracted = filterMarketingContent(extracted)
  
  return normalizeText(extracted)
}

function extractAmounts(text) {
  const rands = text.match(/\b(?:R|ZAR)\s?\d[\d\s,]*(?:\.\d+)?\s?(?:million|bn|billion|k)?/gi) || []
  const plain = text.match(/\b\d[\d\s,]*(?:\.\d+)?\s?(?:million|bn|billion|k)\b/gi) || []
  const merged = Array.from(new Set([...rands, ...plain])).slice(0, 5)
  return merged.join('; ')
}

function extractDeadlines(text) {
  if (!text) return ''
  
  // Extract deadline phrases with more context
  const phrases = text.match(/\b(deadline|closing|apply by|closing date|applications close|application deadline)\b[^.]{0,100}/gi) || []
  
  // Extract dates in various formats
  const dates = text.match(/\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}\b/gi) || []
  const isoish = text.match(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g) || []
  const ddmmyyyy = text.match(/\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/g) || []
  
  // Extract active keywords (ongoing, rolling, etc.)
  const activeKeywords = text.match(/\b(ongoing|rolling|open|continuous|always open|no deadline|open ended|until further notice)\b/gi) || []
  
  const merged = Array.from(new Set([...phrases, ...dates, ...isoish, ...ddmmyyyy, ...activeKeywords])).slice(0, 5)
  return merged.join('; ')
}

async function extractFromDetail(page, url, siteConfig = {}) {
  const { 
    nameSelector = 'h1, h2', 
    summarySelector = 'main p, article p, p', 
    eligibilityRegex,
    subprogramSelector,
    keywords = {} 
  } = siteConfig
  
  page.setDefaultNavigationTimeout(20000) // Reduced timeout for speed
  // Block images and other resources for faster loading
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType()
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      route.abort()
    } else {
      route.continue()
    }
  })
  try {
    await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' })
  } catch {
    // try a slower load state
    try {
      await page.goto(url, { timeout: 20000, waitUntil: 'load' })
    } catch {
      // Final fallback - just try to get any content quickly
      await page.goto(url, { timeout: 15000, waitUntil: 'commit' })
    }
  }
  // Minimal wait - most content should be loaded by domcontentloaded
  await page.waitForTimeout(100)

  const { title, firstParagraph, html, eligibilitySection, overviewSection, subprogramLinks } = await page.evaluate((args) => {
    const { nameSelector, summarySelector, subprogramSelector, eligibilityRegex } = args
    
    // Find main content area - prioritize semantic HTML
    let mainContent = document.querySelector('main, article, [role="main"], .content, .entry-content, .post-content, .page-content, .main-content')
    
    // Fallback to body if no main content found
    if (!mainContent) {
      mainContent = document.body
    }
    
    // Clone to avoid modifying original
    const contentClone = mainContent.cloneNode(true)
    
    // Remove navigation, footer, header, sidebar, and other non-content elements
    const elementsToRemove = contentClone.querySelectorAll(
      'nav, header, footer, aside, .nav, .navigation, .menu, .navbar, .header, .footer, .sidebar, .widget, .cookie, .disclaimer, .legal, [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], .success-stories, .testimonials, .related-posts, .social-share, .social-media'
    )
    elementsToRemove.forEach(el => el.remove())
    
    // Get clean text from main content only
    const cleanText = contentClone.innerText || contentClone.textContent || ''
    
    const nameEl = document.querySelector(nameSelector)
    
    // Helper to extract text between headings (for eligibility section)
    function extractSectionByHeading(headingRegex, maxLength = 500) {
      const headings = Array.from(contentClone.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      const regex = new RegExp(headingRegex.source || '(eligibil|requirements|qualif|who can apply|criteria)', headingRegex.flags || 'i')
      
      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i]
        const headingText = heading.textContent?.trim() || ''
        
        if (regex.test(headingText)) {
          // Found matching heading - extract content until next heading or marketing content
          let content = ''
          let current = heading.nextElementSibling
          let elementCount = 0
          
          while (current && content.length < maxLength && elementCount < 10) {
            // Stop if we hit another heading
            if (current.tagName && current.tagName.match(/^H[1-6]$/)) {
              break
            }
            
            const text = current.textContent?.trim() || ''
            
            // Stop at marketing content markers
            if (/(success stories|testimonials|we want to|pay homage|related|see also|click here|learn more|read more|case studies)/i.test(text)) {
              break
            }
            
            // Stop at next major section
            if (/(overview|summary|funding|application|process|how to apply|contact|benefits|features|about|background)/i.test(text) && content.length > 50) {
              break
            }
            
            if (text.length > 10) {
              content += ' ' + text
            }
            
            current = current.nextElementSibling
            elementCount++
          }
          
          return content.trim().slice(0, maxLength)
        }
      }
      return ''
    }
    
    // Extract eligibility section using DOM structure
    const eligibilitySection = extractSectionByHeading(eligibilityRegex || /(eligibil|requirements|qualif|who can apply|criteria)/i, 400)
    
    // Extract overview/summary - first substantial paragraph, excluding eligibility
    function extractOverview() {
      const paragraphs = Array.from(contentClone.querySelectorAll('p'))
      for (const p of paragraphs) {
        const text = p.textContent?.trim() || ''
        // Skip if too short, too long, or contains eligibility keywords
        if (text.length < 30 || text.length > 400) continue
        if (/(eligibil|requirements|qualif|who can apply|criteria)/i.test(text)) continue
        if (/(success stories|testimonials|we want to|pay homage|click here|learn more)/i.test(text)) continue
        // Skip if it's mostly navigation
        if (/^(apply|who we are|our mandate|vision|mission|copyright|privacy)/i.test(text)) continue
        return text
      }
      return ''
    }
    
    const overviewSection = extractOverview()
    
    // Get first meaningful paragraph - try multiple selectors (fallback)
    let firstP = document.querySelector(summarySelector)
    if (!firstP || !firstP.textContent || firstP.textContent.trim().length < 20) {
      // Try alternative selectors
      const alternatives = contentClone.querySelectorAll('p, .intro, .summary, .description, .lead')
      for (const alt of alternatives) {
        const text = alt.textContent?.trim() || ''
        if (text.length >= 20 && text.length < 500) {
          firstP = alt
          break
        }
      }
    }
    
    // Extract subprogram links if selector provided - filter to only funding-related links
    let subprograms = []
    if (subprogramSelector) {
      const links = Array.from(document.querySelectorAll(subprogramSelector))
      subprograms = links.map(link => {
        const anchor = link.tagName === 'A' ? link : link.closest('a')
        if (!anchor) return null
        
        const href = anchor.getAttribute('href') || ''
        const text = (link.textContent || anchor.textContent || '').trim()
        
        // Filter out non-funding links
        const fundingKeywords = /(funding|program|programme|grant|loan|apply|instrument|opportunit|support|finance|scheme|initiative)/i
        const excludeKeywords = /(about|contact|news|careers|privacy|terms|cookie|who we are|our mandate|vision|mission|values|board|executive|philosophy|process|compliance|research|insights|media|speech|interview)/i
        
        // Must have funding keyword and not be excluded
        if (fundingKeywords.test(href) || fundingKeywords.test(text)) {
          if (!excludeKeywords.test(text) && !excludeKeywords.test(href)) {
            return { href, text }
          }
        }
        
        return null
      }).filter(item => item && item.href && item.text && item.text.length > 3)
    }
    
    // Clean up title and first paragraph
    let titleText = nameEl?.textContent || document.title || ''
    let summaryText = firstP?.textContent || ''
    
    // Remove common prefixes/suffixes from title
    titleText = titleText.replace(/^\/\/\s*/, '').replace(/\s*\/\/$/, '').trim()
    
    // If summary is too short or looks like navigation, try to get better content
    if (!summaryText || summaryText.length < 20 || /^(apply|who we are|our mandate|vision|mission)/i.test(summaryText)) {
      // Try to get first substantial paragraph from main content
      const paragraphs = contentClone.querySelectorAll('p')
      for (const p of paragraphs) {
        const text = p.textContent?.trim() || ''
        if (text.length >= 30 && text.length < 500 && !/^(apply|who we are|our mandate|vision|mission|copyright|privacy)/i.test(text)) {
          summaryText = text
          break
        }
      }
    }
    
    return {
      title: titleText,
      firstParagraph: summaryText || overviewSection,
      html: cleanText,
      eligibilitySection: eligibilitySection,
      overviewSection: overviewSection,
      subprogramLinks: subprograms,
    }
  }, { nameSelector, summarySelector, subprogramSelector, eligibilityRegex: siteConfig.eligibilityRegex })

  const raw = cleanText(html || '')
  
  // Extract eligibility - prefer DOM-extracted section, fallback to text-based extraction
  let eligibility = eligibilitySection || extractByHeadingFromHtml(raw, eligibilityRegex || /(eligibil|who can apply|requirements|qualif|criteria|applicant)/i) || ''
  
  // Clean up eligibility - remove marketing content and footer/legal text
  if (eligibility) {
    eligibility = filterMarketingContent(eligibility)
    
    const footerPatterns = [
      /copyright.*?all rights reserved.*/gi,
      /privacy policy.*?terms of service.*/gi,
      /requirements set in the protection of personal information act.*/gi,
      /popia.*?personal information.*/gi,
      /developed by.*/gi,
      /site map.*?contact us.*?useful links.*/gi,
      /whistle blower.*?hotline.*/gi,
    ]
    
    for (const pattern of footerPatterns) {
      eligibility = eligibility.replace(pattern, '').trim()
    }
    
    // If eligibility is too short after cleaning, it's probably not real eligibility
    if (eligibility.length < 30) {
      eligibility = ''
    }
  }
  
  // Extract clean summary - use overview section if available, otherwise use first paragraph
  // Exclude eligibility content from summary
  let summary = overviewSection || firstParagraph
  summary = extractCleanSummary(summary, eligibility)
  
  const fundingAmount = extractAmounts(raw)
  const deadlines = extractDeadlines(raw)
  const contact = extractContactInfo(raw)
  const applicationProcess = extractApplicationProcess(raw)
  const sectors = extractSectors(raw)

  // Clean name to remove HTML artifacts
  const cleanName = cleanText(title)

  return {
    name: firstNonEmpty(cleanName),
    summary: firstNonEmpty(summary),
    source: url,
    eligibility,
    fundingAmount,
    deadlines,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    applicationProcess,
    sectors,
    subprogramLinks: subprogramLinks || [],
  }
}

export async function crawlAndExtract(browser, startUrl, siteConfig = {}) {
  const maxLinks = siteConfig.maxLinks ?? DEFAULT_MAX_LINKS
  const delayMs = siteConfig.delayMs ?? DEFAULT_DELAY_MS
  const keywordRegex = siteConfig.keywordRegex ?? DEFAULT_LINK_KEYWORDS
  const extractSubprograms = siteConfig.extractSubprograms ?? false
  const maxSubprograms = siteConfig.maxSubprograms ?? 10
  const concurrency = siteConfig.concurrency ?? DEFAULT_CONCURRENCY

  const entry = await browser.newPage()
  entry.setDefaultNavigationTimeout(30000) // Reduced timeout for faster failure
  // Disable images and other resources for faster loading
  await entry.route('**/*', (route) => {
    const resourceType = route.request().resourceType()
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      route.abort()
    } else {
      route.continue()
    }
  })
  try {
    await entry.goto(startUrl, { timeout: 30000, waitUntil: 'domcontentloaded' })
  } catch {
    try {
      await entry.goto(startUrl, { timeout: 30000, waitUntil: 'load' })
    } catch {
      // Final fallback - just try to get content quickly
      await entry.goto(startUrl, { timeout: 20000, waitUntil: 'commit' })
    }
  }
  const links = (await discoverLinks(entry, { keywordRegex, baseUrl: startUrl })).slice(0, maxLinks)

  const results = []
  const subprograms = []
  
  // Extract main program from start page
  const mainProgram = await extractFromDetail(entry, startUrl, siteConfig)
  
  // If subprogram extraction is enabled and main program has subprogram links
  if (extractSubprograms && mainProgram.subprogramLinks && mainProgram.subprogramLinks.length > 0) {
    const subprogramLinks = mainProgram.subprogramLinks.slice(0, maxSubprograms)
    
    // Process subprograms in parallel batches
    const subprogramResults = await processInParallel(
      subprogramLinks,
      concurrency,
      async (subLink) => {
        try {
          let subUrl = subLink.href
          if (!subUrl.startsWith('http')) {
            subUrl = new URL(subUrl, startUrl).toString()
          }
          
          // Skip if not same origin
          if (!sameOrigin(subUrl, startUrl)) return null
          
          const subPage = await browser.newPage()
          subPage.setDefaultNavigationTimeout(20000)
          try {
            const subProgram = await extractFromDetail(subPage, subUrl, siteConfig)
            if (isValidProgram(subProgram)) {
              const { subprogramLinks: _, ...cleanSubProgram } = subProgram
              return {
                ...cleanSubProgram,
                parentProgram: mainProgram.name,
                parentSource: startUrl,
              }
            }
            return null
          } catch (err) {
            return null
          } finally {
            await subPage.close()
          }
        } catch (err) {
          return null
        }
      }
    )
    
    subprograms.push(...subprogramResults.filter(Boolean))
  }
  
  // Remove subprogramLinks from main program before adding
  const { subprogramLinks: _, ...mainProgramClean } = mainProgram
  if (isValidProgram(mainProgramClean)) {
    results.push(mainProgramClean)
  }
  results.push(...subprograms)

  // Process linked programs in parallel batches
  if (links.length > 0) {
    const linkResults = await processInParallel(
      links,
      concurrency,
      async (link) => {
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(20000)
        try {
          const program = await extractFromDetail(page, link, siteConfig)
          const { subprogramLinks: __, ...programClean } = program
          return isValidProgram(programClean) ? programClean : null
        } catch {
          return null
        } finally {
          await page.close()
        }
      }
    )
    
    results.push(...linkResults.filter(Boolean))
  }
  
  await entry.close()

  // dedupe by name+source
  const seen = new Set()
  const deduped = []
  for (const item of results) {
    const key = `${item.name}::${item.source}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
  }
  return deduped
}


