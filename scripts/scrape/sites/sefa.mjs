import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.sefa.org.za/products/direct-lending-products'

export async function scrapeSefa(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 15,
    delayMs: 50, // Minimal delay for speed
    concurrency: 6, // Increased concurrency for parallel processing
    keywordRegex: /(product|loan|fund|apply|programme|program|sefa)/i,
    nameSelector: 'h1, .elementor-heading-title, header h1',
    summarySelector: 'main p, article p, .elementor-widget-container p, p',
    eligibilityRegex: /(eligibil|requirements|qualif|who can apply|criteria)/i,
    subprogramSelector: '.elementor-widget-container ul li a, .product-list a, .program-item a',
    extractSubprograms: true,
    maxSubprograms: 10,
  })
}


