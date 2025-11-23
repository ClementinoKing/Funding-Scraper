import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.nyda.gov.za/'

export async function scrapeNyda(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 10,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(funding|grant|loan|program|programme|apply|finance|opportunit)/i,
    nameSelector: 'h1, .page-title, header h1',
    summarySelector: 'main p, article p, .content p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


