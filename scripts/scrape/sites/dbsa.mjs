import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.dbsa.org'

export async function scrapeDbsa(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 10,
    delayMs: 50,
    concurrency: 6,
    useAI: true, // Enable AI enhancement
    aiMode: 'full', // Use full extraction mode for comprehensive data extraction
    keywordRegex: /(fund|finance|apply|programme|program|infrastructure|support)/i,
    nameSelector: 'h1, header h1, .page-title',
    summarySelector: 'main p, article p, .content p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


