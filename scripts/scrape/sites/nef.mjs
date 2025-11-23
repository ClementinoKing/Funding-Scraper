import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.nefcorp.co.za/'

export async function scrapeNef(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 12,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(fund|product|apply|programme|program|loan|grant)/i,
    nameSelector: 'h1, header h1, .page-title',
    summarySelector: 'main p, article p, .content p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


