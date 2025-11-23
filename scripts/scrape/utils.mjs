import fs from 'node:fs/promises'
import path from 'node:path'

export function normalizeText(value) {
  if (!value) return ''
  return String(value)
    .replace(/<![CDATA\[[\s\S]*?\]\]>/g, '') // Remove CDATA blocks
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// Enhanced text cleaning to remove HTML artifacts and common noise
export function cleanText(text) {
  if (!text) return ''
  let cleaned = String(text)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/<![CDATA\[[\s\S]*?\]\]>/g, '') // Remove CDATA blocks
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
  
  // Remove common navigation/footer patterns
  const noisePatterns = [
    /Apply for funding.*?Our mandate.*?Vision & mission.*?Our values/gi,
    /Who we are.*?Our mandate.*?Vision & mission.*?Our values/gi,
    /Copyright.*?All rights reserved/gi,
    /Site Map.*?Contact Us.*?Useful Links/gi,
    /Subscribe to our newsletter.*?stay informed/gi,
    /Whistle Blower.*?Hotline/gi,
    /Privacy Policy.*?Terms of Service/gi,
    /Cookie.*?Policy/gi,
    /Requirements set in the Protection of Personal Information Act/gi,
    /POPIA.*?personal information/gi,
    /Developed by.*?Paulimonic/gi,
    /Process Risk and Compliance.*?Environmental.*?Social.*?Governance/gi,
    /Application to list on Director Database.*?Supplier Database/gi,
    /Pension Claims.*?BEE.*?Isibaya.*?Whistle Blowers/gi,
    /Client Links.*?Useful Links.*?Contact Us.*?Site Map/gi,
    /Criteria.*?Pension Claims.*?BEE.*?Isibaya/gi,
  ]
  
  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, ' ')
  }
  
  return cleaned
    .replace(/\s+/g, ' ')
    .trim()
}

// Filter out marketing content, testimonials, and promotional text
export function filterMarketingContent(text) {
  if (!text) return ''
  
  const marketingPatterns = [
    /we want to pay homage.*?/gi,
    /pay homage to these entrepreneurs.*?/gi,
    /these entrepreneurs.*?courage.*?journey.*?/gi,
    /helped to shape our economy.*?/gi,
    /made a difference in their communities.*?/gi,
    /success stories.*?/gi,
    /our supplier stories.*?/gi,
    /our stories.*?/gi,
    /testimonials.*?/gi,
    /case studies.*?/gi,
    /click here.*?/gi,
    /learn more.*?/gi,
    /read more.*?/gi,
    /find out more.*?/gi,
    /discover more.*?/gi,
    /explore.*?/gi,
    /visit.*?website.*?/gi,
    /subscribe.*?newsletter.*?/gi,
    /follow us.*?/gi,
    /share.*?social.*?/gi,
  ]
  
  let filtered = String(text)
  for (const pattern of marketingPatterns) {
    filtered = filtered.replace(pattern, '')
  }
  
  return filtered.trim()
}

// Extract clean summary that excludes eligibility content
export function extractCleanSummary(text, eligibilityText) {
  if (!text) return ''
  
  // Remove eligibility content from summary if it's duplicated
  if (eligibilityText && eligibilityText.length > 20) {
    const eligibilityStart = text.toLowerCase().indexOf(eligibilityText.toLowerCase().slice(0, 50))
    if (eligibilityStart > 0 && eligibilityStart < text.length * 0.5) {
      // Eligibility appears early in summary, remove it
      text = text.slice(0, eligibilityStart).trim()
    }
  }
  
  // Remove marketing content
  text = filterMarketingContent(text)
  
  // Limit length and ensure complete sentences
  if (text.length > 300) {
    const lastPeriod = text.lastIndexOf('.', 300)
    if (lastPeriod > 200) {
      text = text.slice(0, lastPeriod + 1)
    } else {
      text = text.slice(0, 300).trim()
      // Try to end at a word boundary
      const lastSpace = text.lastIndexOf(' ')
      if (lastSpace > 250) {
        text = text.slice(0, lastSpace) + '...'
      }
    }
  }
  
  return text.trim()
}

// Extract contact information
export function extractContactInfo(text) {
  const email = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []
  const phone = text.match(/(?:\+27|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}/g) || []
  return {
    email: email[0] || '',
    phone: phone[0] || '',
  }
}

// Extract application process/steps - improved to avoid navigation menus and marketing content
export function extractApplicationProcess(text) {
  if (!text) return ''
  
  // Filter out common navigation patterns first
  let filteredText = text
    .replace(/Apply for funding.*?Our mandate/gi, '')
    .replace(/Application to list on.*?Database/gi, '')
    .replace(/Process Risk and Compliance.*?Research/gi, '')
  
  // Filter marketing content
  filteredText = filterMarketingContent(filteredText)
  
  // Look for actual application process patterns
  const processPatterns = [
    /(?:step\s*\d+|1\.|2\.|3\.|4\.|5\.|first|second|third|fourth|fifth)[^.]{0,200}/gi,
    /(?:to apply|application process|how to apply|apply now|application steps)[^.]{0,200}/gi,
    /(?:submit.*?application|complete.*?form|provide.*?document|download.*?form|fill.*?application)[^.]{0,200}/gi,
  ]
  
  const steps = []
  for (const pattern of processPatterns) {
    const matches = filteredText.match(pattern) || []
    // Filter out marketing content from matches
    const cleanMatches = matches.filter(match => {
      const matchLower = match.toLowerCase()
      return !/(success stories|testimonials|we want to|pay homage|click here|learn more|read more)/i.test(matchLower)
    })
    steps.push(...cleanMatches)
  }
  
  // Remove duplicates and limit
  const uniqueSteps = Array.from(new Set(steps.map(s => s.trim()))).slice(0, 5)
  return uniqueSteps.join('; ')
}

// Extract sectors/industries
export function extractSectors(text) {
  const sectors = text.match(/\b(?:agriculture|manufacturing|technology|tourism|mining|energy|healthcare|education|retail|services|construction|transport|finance|agricultural|tech|innovation|startup|sme|small business|enterprise)\b/gi) || []
  return Array.from(new Set(sectors.map(s => s.toLowerCase()))).join(', ')
}

// Parse dates from deadline strings and check if expired
export function isDeadlineExpired(deadlineText) {
  if (!deadlineText || deadlineText.trim().length === 0) {
    // No deadline specified - consider it active (ongoing program)
    return false
  }
  
  const text = deadlineText.toLowerCase().trim()
  
  // Check for explicit expired/closed keywords
  const expiredKeywords = [
    /closed/i,
    /expired/i,
    /ended/i,
    /past deadline/i,
    /deadline passed/i,
    /no longer accepting/i,
    /applications closed/i,
    /no longer available/i,
    /deadline has passed/i,
    /closed for applications/i,
  ]
  
  for (const keyword of expiredKeywords) {
    if (keyword.test(text)) {
      return true
    }
  }
  
  // Check for "ongoing", "rolling", "open" keywords - these are active
  const activeKeywords = [
    /ongoing/i,
    /rolling/i,
    /open/i,
    /continuous/i,
    /always open/i,
    /no deadline/i,
    /open ended/i,
    /until further notice/i,
  ]
  
  for (const keyword of activeKeywords) {
    if (keyword.test(text)) {
      return false
    }
  }
  
  // Try to parse dates
  const now = new Date()
  now.setHours(0, 0, 0, 0) // Set to start of day for comparison
  
  // Parse various date formats
  const monthNames = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  }
  
  // Pattern 1: DD MMM YYYY or DD MMMM YYYY (e.g., "15 Jan 2024", "15 January 2024")
  const datePattern1 = /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\b/i
  const match1 = text.match(datePattern1)
  if (match1) {
    const day = parseInt(match1[1], 10)
    const monthName = match1[2].toLowerCase()
    const year = parseInt(match1[3], 10)
    const month = monthNames[monthName]
    
    if (month !== undefined) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      if (!isNaN(date.getTime()) && date < now) {
        return true
      }
      if (!isNaN(date.getTime()) && date >= now) {
        return false
      }
    }
  }
  
  // Pattern 2: YYYY-MM-DD or YYYY/MM/DD
  const datePattern2 = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/
  const match2 = text.match(datePattern2)
  if (match2) {
    const year = parseInt(match2[1], 10)
    const month = parseInt(match2[2], 10) - 1 // JS months are 0-indexed
    const day = parseInt(match2[3], 10)
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    if (!isNaN(date.getTime()) && date < now) {
      return true
    }
    if (!isNaN(date.getTime()) && date >= now) {
      return false
    }
  }
  
  // Pattern 3: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const datePattern3 = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/
  const match3 = text.match(datePattern3)
  if (match3) {
    const day = parseInt(match3[1], 10)
    const month = parseInt(match3[2], 10) - 1 // JS months are 0-indexed
    const year = parseInt(match3[3], 10)
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    if (!isNaN(date.getTime()) && date < now) {
      return true
    }
    if (!isNaN(date.getTime()) && date >= now) {
      return false
    }
  }
  
  // If we can't parse a date and no explicit keywords found, 
  // assume it's active (to avoid false positives)
  return false
}

// Validate if program has meaningful content - improved filtering
export function isValidProgram(program) {
  const name = (program.name || '').trim()
  const summary = (program.summary || '').trim()
  const eligibility = (program.eligibility || '').trim()
  
  // Filter out HTML/JS code in name
  if (name.includes('<![CDATA[') || name.includes('_spBodyOnLoadFunctionNames') || name.includes('// <!')) {
    return false
  }
  
  // Must have meaningful name
  if (!name || name === 'Untitled program' || name.length < 5) {
    return false
  }
  
  // Filter out non-funding pages (common patterns)
  const nonFundingPatterns = [
    /^(who we are|our mandate|vision|mission|our values|our board|executive committee|strategic role|investment philosophy|investment process|risk and compliance|research|insights|contact|about|news|careers|privacy|terms|cookie)/i,
    /\/\/(who-we-are|about|contact|news|careers|privacy|terms)/i,
    /(privacy policy|terms of service|cookie policy|site map|contact us|useful links)/i,
  ]
  
  const nameLower = name.toLowerCase()
  for (const pattern of nonFundingPatterns) {
    if (pattern.test(nameLower) || pattern.test(program.source || '')) {
      return false
    }
  }
  
  // Filter out programs that are just navigation menus or footers
  const isNavigationMenu = /^(apply for funding|who we are|our mandate|vision|mission|our values|our board|executive committee|strategic role|process risk|environmental social|research insights|economic research|sectoral research|isibaya|early-stage|application to list|director database|supplier database|corporate procurement|investment procurement|properties procurement|media releases|interviews|speeches)/i.test(nameLower)
  
  if (isNavigationMenu) {
    return false
  }
  
  // Check if eligibility is just footer/legal text
  const isFooterText = /(copyright|all rights reserved|privacy|personal information act|popia|developed by|site map|contact us|useful links|whistle blower|pension claims|bee|isibaya)/i.test(eligibility)
  
  if (isFooterText && eligibility.length < 100) {
    // Likely just footer text, not real eligibility
    return false
  }
  
  // Check if deadline is expired - filter out expired programs
  if (program.deadlines && program.deadlines.trim().length > 0) {
    if (isDeadlineExpired(program.deadlines)) {
      return false // Skip expired programs
    }
  }
  
  // Must have meaningful content
  const hasContent = summary.length >= 30 || 
    (program.fundingAmount && program.fundingAmount.length > 5) || 
    (program.deadlines && program.deadlines.length > 5) || 
    (eligibility && eligibility.length > 50 && !isFooterText)
  
  return hasContent
}

export async function retry(fn, { retries = 2, delayMs = 500 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }
  throw lastError
}

export function withTimeout(promise, ms, message = 'Operation timed out') {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ])
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function writeJson(outputFile, data) {
  const dir = path.dirname(outputFile)
  await ensureDir(dir)
  const json = JSON.stringify(data, null, 2)
  await fs.writeFile(outputFile, json, 'utf-8')
}

export function logSiteResult(siteName, items, error = null) {
  if (error) {
    console.error(`[scrape] ${siteName} - ERROR:`, error.message)
    return
  }
  console.log(`[scrape] ${siteName} - ${items.length} programs`)
}

// Extract a block of text following a heading that matches regex
export async function extractByHeading(page, headingRegex) {
  const args = { regexSource: headingRegex.source, flags: headingRegex.flags }
  const text = await page.evaluate((args) => {
    const { regexSource, flags } = args
    const re = new RegExp(regexSource, flags)
    function collectText(el) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let s = ''
      while (walker.nextNode()) s += walker.currentNode.nodeValue + ' '
      return s
    }
    const all = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, p, li, div'))
    for (let i = 0; i < all.length; i++) {
      const node = all[i]
      const label = (node.textContent || '').trim()
      if (re.test(label)) {
        // concatenate this node and next few siblings as a section
        const sectionNodes = [node]
        let sibling = node.nextElementSibling
        let count = 0
        while (sibling && count < 6) {
          sectionNodes.push(sibling)
          sibling = sibling.nextElementSibling
          count++
        }
        const combined = sectionNodes.map(collectText).join(' ')
        return combined.replace(/\s+/g, ' ').trim().slice(0, 1000)
      }
    }
    return ''
  }, args)
  return normalizeText(text)
}

export function extractAmounts(text) {
  const rands = text.match(/\b(?:R|ZAR)\s?\d[\d\s,]*(?:\.\d+)?\s?(?:million|bn|billion|k)?/gi) || []
  const plain = text.match(/\b\d[\d\s,]*(?:\.\d+)?\s?(?:million|bn|billion|k)\b/gi) || []
  const merged = Array.from(new Set([...rands, ...plain])).slice(0, 5)
  return merged.join('; ')
}

export function extractDeadlines(text) {
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


