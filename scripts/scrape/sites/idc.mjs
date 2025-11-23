import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.idc.co.za/'

export async function scrapeIdc(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 12,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(funding|finance|apply|programme|program|loans|sectors)/i,
    nameSelector: 'h1, header h1, .page-title',
    summarySelector: 'main p, article p, .content p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


