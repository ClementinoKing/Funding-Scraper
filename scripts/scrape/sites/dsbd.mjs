import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.dsbd.gov.za/' // Updated to HTTPS

export async function scrapeDsbd(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 12,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(fund|finance|apply|support|programme|program|grant|loan)/i,
    nameSelector: 'h1, header h1, .entry-title',
    summarySelector: 'main p, article p, .entry-content p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


