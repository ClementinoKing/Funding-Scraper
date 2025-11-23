import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://landbank.co.za/Pages/Home.aspx'

export async function scrapeLandBank(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 12,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(loan|finance|fund|apply|product|programme|program)/i,
    nameSelector: 'h1, .ms-rtestate-field h1, header h1',
    summarySelector: 'main p, article p, .ms-rtestate-field p, p',
    eligibilityRegex: /(eligibil|who can apply|requirements|qualif|criteria)/i,
  })
}


