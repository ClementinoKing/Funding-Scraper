# Universal Web Scraper

A flexible, scalable web scraping system designed to crawl any website and extract structured data. Built with Node.js, Playwright, and PostgreSQL/Supabase.

## Features

- **Universal Scraping**: Works with any website through configurable selectors and patterns
- **Parallel Processing**: Scrapes multiple pages concurrently for maximum speed
- **AI Enhancement**: Optional AI-powered data cleaning and structuring using OpenAI or Groq
- **Change Detection**: Tracks content changes over time using content hashing
- **Flexible Storage**: JSONB fields allow storing any structured data
- **Parent-Child Relationships**: Support for nested items (e.g., programs and subprograms)
- **Source Discovery**: Find new sources automatically via search engines
- **Cron Job Ready**: Designed to run as a scheduled task
- **Error Recovery**: Robust error handling and retry mechanisms

## Architecture

### Database Design

The system uses a simple, flexible schema:

1. **scrape_sources** - Websites to scrape
2. **scrape_runs** - Logs of every scraping attempt
3. **scraped_items** - All content with flexible JSON storage
4. **item_relationships** - Parent-child and related items
5. **item_changes** - Track content changes over time
6. **search_queries** - Queries for discovering new sources
7. **discovered_sources** - URLs pending review

### Key Design Principles

- **Flexibility First**: JSONB fields allow storing any data structure
- **Change Tracking**: Content hashing detects when items are updated
- **Relationships**: Support for hierarchical and related content
- **Separation of Concerns**: Clear boundaries between scraping, storage, and discovery

## Installation

```bash
npm install playwright @supabase/supabase-js dotenv
npx playwright install chromium
```

## Setup

1. **Create Database Tables**

```bash
psql -U your_user -d your_database -f migrations/001_initial_schema.sql
```

Or in Supabase, run the SQL in the SQL editor.

2. **Configure Environment**

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DEBUG=false
```

3. **Add Sources**

Add websites to scrape in the `scrape_sources` table:

```sql
INSERT INTO scrape_sources (name, base_url, domain, config)
VALUES (
  'SEFA',
  'https://www.sefa.org.za/products/direct-lending-products',
  'sefa.org.za',
  '{
    "timeout": 20000,
    "concurrency": 6,
    "maxLinks": 15,
    "keywordPattern": "(product|loan|fund|apply|programme)",
    "titleSelector": "h1, .elementor-heading-title",
    "blockResources": ["image", "stylesheet", "font", "media"]
  }'::jsonb
);
```

## Usage

### Scrape All Active Sources

```bash
node index.mjs
```

### Scrape Specific Sources

```bash
node index.mjs --source 1,2,3
```

### Run in Discovery Mode

```bash
node index.mjs --discover
```

### Sequential Scraping (No Parallelization)

```bash
node index.mjs --sequential
```

### Custom Concurrency

```bash
node index.mjs --concurrency 10
```

## Configuration

### Source Configuration

Each source can have custom configuration in the `config` JSONB field:

```json
{
  "timeout": 20000,              // Page load timeout in ms
  "concurrency": 6,              // Number of parallel pages
  "maxLinks": 20,                // Maximum links to discover
  "keywordPattern": "(funding)", // Regex pattern for link discovery
  "titleSelector": "h1, h2",     // CSS selector for title
  "delayMs": 50,                 // Delay between requests
  "blockResources": [            // Resources to block for speed
    "image", 
    "stylesheet", 
    "font", 
    "media"
  ],
  
  // AI Enhancement (Optional)
  "aiEnhancement": true,         // Enable AI processing
  "fetchPageForAI": true,        // Fetch full page content for AI
  "aiProvider": "openai",        // "openai" or "groq"
  "aiModel": "gpt-4o-mini",      // Model to use
  "openaiKey": "sk-...",         // Override env var (optional)
  "groqKey": "gsk-..."           // Override env var (optional)
}
```

## AI Enhancement

The scraper can use AI (OpenAI or Groq) to enhance scraped data:

### What AI Enhancement Does

1. **Cleans and normalizes** raw scraped text into human-readable content
2. **Extracts structured fields**: eligibility, funding amount, deadlines, contacts
3. **Categorizes programs**: Determines program type (grant, loan, etc.) and funding category
4. **Splits multi-opportunity programs**: Detects and separates multiple funding opportunities in a single page
5. **Enriches demographics**: Extracts age, gender, ethnicity requirements when stated
6. **Improves quality**: Rewrites summaries for clarity and readability

### Available Funding Categories

The AI can categorize into these types:
1. Seed / Startup Capital
2. Product Development
3. Inventory & Working Capital
4. Marketing & Customer Acquisition
5. Equipment & Machinery
6. Commercial Real Estate
7. Business Expansion / Growth Capital
8. Debt Refinancing / Restructuring
9. Acquisitions
10. Bridge / Emergency Funding
11. R&D / Innovation
12. Franchise Financing
13. Green / Sustainable Projects

### Setup AI Enhancement

1. **Set API Keys**
```bash
# In .env file
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
# OR for Groq
GROQ_API_KEY=gsk-your-key-here
```

2. **Enable in Source Config**
```sql
UPDATE scrape_sources 
SET config = config || '{"aiEnhancement": true, "fetchPageForAI": true}'::jsonb
WHERE id = 1;
```

3. **Run Scraper**
```bash
node index.mjs
```

### AI-Enhanced Fields

When AI enhancement is enabled, these additional fields are populated:

- `ai_enhanced` - Boolean indicating AI processing
- `ai_confidence` - Confidence score (0-1)
- `program_type` - grant, loan, equity, tender, training, support
- `funding_category` - One of 13 predefined categories
- `age` - Age eligibility (e.g., "18-25")
- `gender` - Gender requirements
- `ethnicity` - Demographic restrictions
- `desired_location` - Geographic requirements
- `eligibility` - Detailed eligibility criteria
- `funding_amount` - Human-readable amount
- `deadlines` - Clear deadline or "Open"
- `application_process` - How to apply

### Query AI-Enhanced Data

```sql
-- Get all AI-enhanced programs
SELECT * FROM ai_enhanced_programs;

-- Get high-confidence results
SELECT title, summary, ai_confidence 
FROM scraped_items 
WHERE ai_enhanced = true 
  AND ai_confidence > 0.8
ORDER BY ai_confidence DESC;

-- Filter by funding category
SELECT * FROM scraped_items 
WHERE funding_category = 'Seed / Startup Capital'
  AND is_active = true;

-- Filter by demographics
SELECT * FROM scraped_items 
WHERE age LIKE '%18-25%' 
  OR gender = 'Women';
```

### Cost Considerations

To minimize costs:
- Use `fetchPageForAI: false` to only process already-scraped content
- Set `aiEnhancement: false` for sources that don't need AI
- Use Groq for free/cheaper processing
- Use smaller batches for testing

## Cron Job Setup

### Using crontab (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Run daily at 2 AM
0 2 * * * cd /path/to/scraper && node index.mjs >> logs/scraper.log 2>&1

# Run every 6 hours
0 */6 * * * cd /path/to/scraper && node index.mjs >> logs/scraper.log 2>&1
```


## Data Access

### Query Scraped Items

```sql
-- Get all active funding items
SELECT * FROM scraped_items 
WHERE category = 'grant' 
  AND is_active = true
ORDER BY last_scraped_at DESC;

-- Get items with their children
SELECT 
  p.title as parent_title,
  c.title as child_title,
  r.relationship_type
FROM item_relationships r
JOIN scraped_items p ON r.parent_item_id = p.id
JOIN scraped_items c ON r.child_item_id = c.id;

-- Track changes to an item
SELECT * FROM item_changes
WHERE item_id = 123
ORDER BY changed_at DESC;
```

### JavaScript API

```javascript
import { 
  getItemsBySource, 
  searchItems,
  getItemWithChildren 
} from './database.mjs'

// Get items from a source
const { items, total } = await getItemsBySource(sourceId, {
  limit: 50,
  category: 'grant'
})

// Search across all items
const results = await searchItems('small business', {
  category: 'loan'
})

// Get item with nested children
const item = await getItemWithChildren(itemId)
console.log(item.children)
```

## Integrating with Your Business Schema

The scraper uses a generic `scraped_items` table. To integrate with your existing business schema, create database views or application-layer mappings:

```sql
-- Example: Map to funding_programs
CREATE VIEW funding_programs AS
SELECT 
  id as program_id,
  title as program_name,
  url as source_url,
  structured_data->>'fundingAmount' as funding_amount,
  structured_data->>'eligibility' as eligibility,
  structured_data->>'deadlines' as deadlines,
  structured_data->>'applicationProcess' as application_process,
  structured_data->>'contactEmail' as contact_email,
  tags as sectors,
  is_active,
  last_scraped_at
FROM scraped_items
WHERE category IN ('grant', 'loan', 'equity')
  AND is_active = true;
```

## Monitoring

### Check Recent Runs

```sql
SELECT * FROM v_recent_runs LIMIT 10;
```

### Source Performance

```sql
SELECT 
  name,
  COUNT(*) as total_runs,
  AVG(duration_seconds) as avg_duration,
  SUM(items_inserted) as total_items
FROM scrape_runs r
JOIN scrape_sources s ON r.source_id = s.id
WHERE r.started_at > NOW() - INTERVAL '30 days'
GROUP BY name;
```

### Active Items by Source

```sql
SELECT * FROM v_items_by_source;
```

## Extending the Scraper

### Add Custom Extraction Logic

Edit `scraper.mjs` and add custom extraction in the `extractFromPage` function:

```javascript
// Extract custom field
const customField = await page.evaluate(() => {
  const element = document.querySelector('.custom-selector')
  return element?.textContent || ''
})

item.structured_data.customField = customField
```

### Add AI Enhancement

Install and configure AI libraries, then enhance extraction:

```javascript
import { OpenAI } from 'openai'

async function enhanceWithAI(item) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `Extract structured data from: ${item.content_text}`
    }]
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

## Best Practices

1. **Respect robots.txt**: Check website policies before scraping
2. **Rate Limiting**: Use delays and concurrency limits appropriately
3. **Error Handling**: Always wrap scraping logic in try-catch
4. **Content Hashing**: Use content hashes to detect changes efficiently
5. **Incremental Updates**: Only update items when content actually changes
6. **Monitoring**: Set up alerts for scraping failures
7. **Backups**: Regularly backup your database

## Troubleshooting

### Scraper Times Out

- Increase `timeout` in source config
- Reduce `concurrency` to lower parallel load
- Check if website is blocking automated access

### Missing Data

- Verify CSS selectors in source config
- Check if website uses JavaScript rendering
- Use browser DevTools to inspect page structure

### Memory Issues

- Reduce `concurrency` and `maxLinks`
- Process sources sequentially with `--sequential`
- Add `--max-old-space-size=4096` to node command

## License

MIT
