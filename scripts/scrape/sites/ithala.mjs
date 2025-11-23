import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.ithala.co.za/'

export async function scrapeIthala(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 10,
    delayMs: 50,
    concurrency: 6,
    keywordRegex: /(fund|loan|finance|apply|programme|program|support)/i,
    nameSelector: 'h1, header h1, .elementor-heading-title',
    summarySelector: 'main p, article p, .elementor-widget-container p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
  })
}


