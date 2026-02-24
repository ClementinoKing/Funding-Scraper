import crypto from 'node:crypto'

/**
 * Logger utility
 */
export const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => {
    if (process.env.DEBUG) {
      console.log('[DEBUG]', ...args)
    }
  }
}

/**
 * Normalize text - clean whitespace and special characters
 */
export function normalizeText(text) {
  if (!text) return ''
  
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .trim()
}

/**
 * Generate URL-friendly slug from title and URL
 */
export function generateSlug(title, url) {
  const base = `${title} ${extractDomain(url)}`.toLowerCase()
  
  return base
    .normalize('NFKD') // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .slice(0, 120) // Limit length
    || 'item'
}

/**
 * Extract domain from URL
 */
export function extractDomain(url) {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch (error) {
    return ''
  }
}

/**
 * Extract URL from text (if it's a full URL)
 */
export function extractUrl(text) {
  if (!text) return null
  
  try {
    const url = new URL(text)
    return url.toString()
  } catch (error) {
    return null
  }
}

/**
 * Hash content for change detection
 */
export function hashContent(content) {
  if (!content) return ''
  
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
}

/**
 * Delay helper
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry helper with exponential backoff
 */
export async function retry(fn, options = {}) {
  const { 
    retries = 3, 
    delayMs = 1000, 
    backoff = 2,
    onRetry = null 
  } = options

  let lastError
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i < retries - 1) {
        const waitTime = delayMs * Math.pow(backoff, i)
        
        if (onRetry) {
          onRetry(i + 1, retries, waitTime, error)
        }
        
        await delay(waitTime)
      }
    }
  }
  
  throw lastError
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9_\-\.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200)
}

/**
 * Parse date string to ISO format
 */
export function parseDate(dateStr) {
  if (!dateStr) return null
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
  } catch (error) {
    return null
  }
}

/**
 * Extract structured data from text
 */
export function extractStructuredData(text) {
  const data = {}

  // Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    data.email = emailMatch[0]
  }

  // Phone (international and local formats)
  const phoneMatch = text.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/)
  if (phoneMatch) {
    data.phone = phoneMatch[0]
  }

  // Currency amounts
  const amountMatches = text.match(/\b(?:R|ZAR|USD|\$|€|£)\s?\d[\d\s,]*(?:\.\d{2})?\s?(?:million|m|billion|bn|k)?\b/gi)
  if (amountMatches && amountMatches.length > 0) {
    data.amounts = amountMatches.slice(0, 5)
  }

  // Dates
  const dateMatches = text.match(/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b|\b\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}\b/gi)
  if (dateMatches && dateMatches.length > 0) {
    data.dates = dateMatches.slice(0, 3)
  }

  // URLs
  const urlMatches = text.match(/https?:\/\/[^\s<>"]+/gi)
  if (urlMatches && urlMatches.length > 0) {
    data.urls = urlMatches.slice(0, 5)
  }

  return data
}

/**
 * Check if URL is valid
 */
export function isValidUrl(urlString) {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (error) {
    return false
  }
}

/**
 * Check if URLs are same origin
 */
export function isSameOrigin(url1, url2) {
  try {
    const u1 = new URL(url1)
    const u2 = new URL(url2)
    return u1.origin === u2.origin
  } catch (error) {
    return false
  }
}

/**
 * Truncate text to specified length
 */
export function truncate(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Extract keywords from text using simple TF-IDF-like approach
 */
export function extractKeywords(text, maxKeywords = 10) {
  if (!text) return []

  // Common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
    'those', 'it', 'its', 'they', 'their', 'them'
  ])

  // Extract words
  const words = text.toLowerCase()
    .match(/\b[a-z]{3,}\b/g) || []

  // Count frequencies
  const frequencies = new Map()
  for (const word of words) {
    if (!stopWords.has(word)) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1)
    }
  }

  // Sort by frequency and return top keywords
  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Calculate similarity between two texts (simple cosine similarity)
 */
export function textSimilarity(text1, text2) {
  if (!text1 || !text2) return 0

  const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || [])
  const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || [])

  const intersection = new Set([...words1].filter(w => words2.has(w)))
  
  if (words1.size === 0 || words2.size === 0) return 0

  return intersection.size / Math.sqrt(words1.size * words2.size)
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Batch process items with concurrency control
 */
export async function batchProcess(items, processor, options = {}) {
  const { 
    concurrency = 5, 
    onProgress = null,
    stopOnError = false 
  } = options

  const results = []
  const errors = []
  let processed = 0

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    )

    for (const result of batchResults) {
      processed++
      
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        errors.push(result.reason)
        
        if (stopOnError) {
          throw result.reason
        }
      }

      if (onProgress) {
        onProgress(processed, items.length)
      }
    }
  }

  return { results, errors }
}

/**
 * Deep merge objects
 */
export function deepMerge(target, source) {
  const result = { ...target }

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }

  return result
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    return defaultValue
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    return defaultValue
  }
}

/**
 * Fetch page text content (for AI enhancement)
 */
export async function fetchPageText(url) {
  const fetch = (await import('node-fetch')).default
  const { JSDOM } = await import('jsdom')
  
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const res = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DataBot/1.0)',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`)
  }

  const html = await res.text()
  const dom = new JSDOM(html, {
    pretendToBeVisual: false,
    resources: 'usable',
    runScripts: 'outside-only'
  })
  const document = dom.window.document

  // Remove non-content elements
  document
    .querySelectorAll(
      'script, style, nav, footer, header, aside, form, button, svg, img, link'
    )
    .forEach((e) => e.remove())

  // Remove inline styles and classes
  document.querySelectorAll('*').forEach((el) => {
    el.removeAttribute('style')
    el.removeAttribute('class')
    el.removeAttribute('id')
    el.removeAttribute('onclick')
  })

  let text = document.body.textContent || ''

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()

  // Remove common boilerplate phrases
  text = text.replace(
    /(cookie policy|privacy policy|terms of service|accept cookies|all rights reserved)/gi,
    ''
  )

  // Remove navigation-like fragments
  text = text.replace(
    /\b(home|about|contact|login|sign up|menu|search|subscribe)\b/gi,
    ''
  )

  // Remove markdown-like artifacts
  text = text
    .replace(/[#*_>`~\-]{2,}/g, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')

  // Collapse again after removals
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Check if page looks like a loader/placeholder
 */
export function looksLikeLoaderPage(text) {
  if (!text) return true

  const indicators = [
    'loading',
    'please wait',
    'spinner',
    'enable javascript',
    'app-root',
    'root',
  ]

  if (text.length < 500) return true

  return indicators.some(word =>
    text.toLowerCase().includes(word)
  )
}

/**
 * Fetch page text with browser (for JavaScript-heavy sites)
 */
export async function fetchPageTextWithBrowser(url) {
  const { chromium } = await import('playwright')
  
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (compatible; DataBot/1.0)'
  })

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000
  })

  // Wait for meaningful content
  await page.waitForTimeout(3000)

  const text = await page.evaluate(() => {
    document
      .querySelectorAll(
        'script, style, nav, footer, header, aside, form, button, svg, img, link'
      )
      .forEach(e => e.remove())

    return document.body?.innerText || ''
  })

  await browser.close()

  return text
    .replace(/\s+/g, ' ')
    .trim()
}
