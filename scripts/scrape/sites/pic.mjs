import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.pic.gov.za/'

export async function scrapePic(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 10,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(fund|investment|apply|programme|program|opportunit)/i,
    nameSelector: 'h1, .page-title, header h1',
    summarySelector: 'main p, article p, .content p, p',
    eligibilityRegex: /(eligibil|who can apply|requirements|qualif|criteria)/i,
  })
}


