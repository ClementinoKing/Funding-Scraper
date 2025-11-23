import { crawlAndExtract } from '../crawl.mjs'

const SOURCE = 'https://www.tia.org.za/funding-instruments/'

export async function scrapeTia(browser) {
  return await crawlAndExtract(browser, SOURCE, {
    maxLinks: 15,
    delayMs: 50, // Minimal delay for speed
    concurrency: 6, // Increased concurrency for parallel processing
    keywordRegex: /(funding|instrument|apply|grant|loan|opportunit|programme|program)/i,
    nameSelector: 'h1, .page-title, header h1, .entry-title',
    summarySelector: 'main p, article p, .content p, .entry-content p',
    eligibilityRegex: /(eligibil|who can apply|requirements|qualif|criteria|applicant)/i,
    subprogramSelector: 'ul li a, .program-list a, .funding-options a, .program-item a',
    extractSubprograms: true,
    maxSubprograms: 10,
  })
}


