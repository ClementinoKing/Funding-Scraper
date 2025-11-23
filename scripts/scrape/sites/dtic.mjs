import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.thedtic.gov.za/'

export async function scrapeDtic(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 12,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(fund|incentive|financial|support|grant|loan|apply|scheme|programme|program)/i,
    nameSelector: 'h1, .entry-title, header h1',
    summarySelector: 'main p, article p, .entry-content p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


