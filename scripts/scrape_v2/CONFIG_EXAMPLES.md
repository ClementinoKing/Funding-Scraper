# Scraper Configuration Examples

This document provides configuration examples for common website types and patterns.

## Basic Configuration

```json
{
  "timeout": 20000,
  "concurrency": 6,
  "maxLinks": 20,
  "keywordPattern": "(funding|grant|loan|program)",
  "titleSelector": "h1, h2",
  "delayMs": 50,
  "blockResources": ["image", "stylesheet", "font", "media"]
}
```

## Configuration for Different Site Types

### 1. Government Funding Portal

```sql
INSERT INTO scrape_sources (name, base_url, domain, config)
VALUES (
  'SEFA',
  'https://www.sefa.org.za/products/direct-lending-products',
  'sefa.org.za',
  '{
    "timeout": 30000,
    "concurrency": 4,
    "maxLinks": 15,
    "keywordPattern": "(product|loan|fund|apply|programme|program|sefa)",
    "titleSelector": "h1, .elementor-heading-title, header h1",
    "delayMs": 100,
    "blockResources": ["image", "stylesheet", "font", "media"]
  }'::jsonb
);
```

### 2. News/Blog Site

```sql
INSERT INTO scrape_sources (name, base_url, domain, config)
VALUES (
  'Tech News',
  'https://technews.example.com/articles',
  'technews.example.com',
  '{
    "timeout": 15000,
    "concurrency": 8,
    "maxLinks": 30,
    "keywordPattern": "(article|post|news|technology)",
    "titleSelector": "h1.article-title, .post-title",
    "delayMs": 50,
    "blockResources": ["image", "media"]
  }'::jsonb
);
```

### 3. E-commerce Product Catalog

```sql
INSERT INTO scrape_sources (name, base_url, domain, config)
VALUES (
  'Shop Products',
  'https://shop.example.com/catalog',
  'shop.example.com',
  '{
    "timeout": 20000,
    "concurrency": 10,
    "maxLinks": 50,
    "keywordPattern": "(product|item|category)",
    "titleSelector": "h1.product-name, .product-title",
    "delayMs": 30,
    "blockResources": ["stylesheet", "font"]
  }'::jsonb
);
```

### 4. Documentation Site

```sql
INSERT INTO scrape_sources (name, base_url, domain, config)
VALUES (
  'API Docs',
  'https://docs.example.com/api',
  'docs.example.com',
  '{
    "timeout": 15000,
    "concurrency": 12,
    "maxLinks": 100,
    "keywordPattern": "(api|reference|guide|tutorial|endpoint)",
    "titleSelector": "h1, .doc-title",
    "delayMs": 20,
    "blockResources": ["image", "media"]
  }'::jsonb
);
```

### 5. Event/Conference Site

```sql
INSERT INTO scrape_sources (name, base_url, domain, config)
VALUES (
  'Tech Conference',
  'https://conference.example.com/events',
  'conference.example.com',
  '{
    "timeout": 20000,
    "concurrency": 6,
    "maxLinks": 25,
    "keywordPattern": "(event|session|speaker|schedule|workshop)",
    "titleSelector": "h1.event-title, .session-name",
    "delayMs": 100,
    "blockResources": ["image", "stylesheet", "font", "media"]
  }'::jsonb
);
```

## Advanced Patterns

### Keyword Patterns

```javascript
// Broad matching (catch most content)
"keywordPattern": "(.*)"

// Funding/grants specific
"keywordPattern": "(funding|grant|loan|finance|investment|equity|tender|opportunity|apply|eligibility)"

// Technology/products
"keywordPattern": "(product|service|solution|platform|api|sdk|tool)"

// News/content
"keywordPattern": "(article|post|news|blog|story|report|analysis)"

// Events/training
"keywordPattern": "(event|workshop|training|course|webinar|seminar|conference)"
```

### Title Selectors for Common CMS

```javascript
// WordPress
"titleSelector": "h1.entry-title, .post-title, article h1"

// Drupal
"titleSelector": "h1.page-title, .node-title"

// Joomla
"titleSelector": "h1.page-header, .item-title"

// Custom CMS / Generic
"titleSelector": "h1, h2, [class*='title'], [class*='heading']"

// React/Vue SPA
"titleSelector": "[data-testid='title'], .app-title, main h1"
```

### Resource Blocking Strategies

```javascript
// Maximum speed (block everything non-essential)
"blockResources": ["image", "stylesheet", "font", "media", "other"]

// Balanced (keep CSS for selector accuracy)
"blockResources": ["image", "font", "media"]

// Minimal blocking (only large files)
"blockResources": ["media"]

// No blocking (maximum compatibility)
"blockResources": []
```

### Concurrency Settings

```javascript
// Conservative (slow sites, rate limiting)
"concurrency": 2,
"delayMs": 200

// Balanced (most sites)
"concurrency": 6,
"delayMs": 50

// Aggressive (fast sites, no rate limiting)
"concurrency": 12,
"delayMs": 20

// Maximum (internal/test environments)
"concurrency": 20,
"delayMs": 0
```

## Search Query Examples

For discovering new sources:

```sql
-- South African funding opportunities
INSERT INTO search_queries (query, search_engine, max_results)
VALUES 
  ('small business funding south africa', 'google', 20),
  ('sme grants opportunities south africa', 'google', 20),
  ('entrepreneur support programs south africa', 'google', 20),
  ('startup funding johannesburg', 'google', 15),
  ('government grants for businesses sa', 'google', 15);

-- Technology/innovation funding
INSERT INTO search_queries (query, search_engine, max_results)
VALUES 
  ('tech startup funding africa', 'google', 20),
  ('innovation grants african businesses', 'google', 20),
  ('accelerator programs south africa', 'google', 15);

-- Sector-specific
INSERT INTO search_queries (query, search_engine, max_results)
VALUES 
  ('agriculture funding south africa', 'google', 15),
  ('tourism grants south africa', 'google', 15),
  ('manufacturing support programs sa', 'google', 15);
```

## Performance Tuning

### For Large Sites (1000+ pages)

```json
{
  "timeout": 15000,
  "concurrency": 8,
  "maxLinks": 50,
  "delayMs": 30,
  "blockResources": ["image", "stylesheet", "font", "media"]
}
```

### For Slow/Unstable Sites

```json
{
  "timeout": 45000,
  "concurrency": 2,
  "maxLinks": 10,
  "delayMs": 200,
  "blockResources": ["image", "media"]
}
```

### For JavaScript-Heavy SPAs

```json
{
  "timeout": 30000,
  "concurrency": 4,
  "maxLinks": 20,
  "delayMs": 100,
  "blockResources": ["image", "media"],
  "waitForSelector": ".content-loaded",
  "additionalWaitMs": 1000
}
```

## Troubleshooting Common Issues

### Issue: Getting 403/blocked

**Solution:**
```json
{
  "concurrency": 1,
  "delayMs": 500,
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

### Issue: Missing content (JavaScript rendered)

**Solution:**
```json
{
  "timeout": 30000,
  "waitForSelector": "main, article, .content",
  "additionalWaitMs": 2000,
  "blockResources": ["image", "media"]
}
```

### Issue: Timeout errors

**Solution:**
```json
{
  "timeout": 60000,
  "concurrency": 2,
  "maxLinks": 5
}
```

## Template Configurations

Save these as templates for reuse:

```sql
-- Template for government sites
INSERT INTO scrape_templates (name, description, config)
VALUES (
  'government-portal',
  'Configuration for government funding portals',
  '{
    "timeout": 30000,
    "concurrency": 4,
    "maxLinks": 20,
    "keywordPattern": "(funding|grant|programme|apply|eligibility|criteria)",
    "titleSelector": "h1, .page-title",
    "delayMs": 150,
    "blockResources": ["image", "stylesheet", "font", "media"]
  }'::jsonb
);

-- Template for modern SPA sites
INSERT INTO scrape_templates (name, description, config)
VALUES (
  'modern-spa',
  'Configuration for React/Vue/Angular sites',
  '{
    "timeout": 25000,
    "concurrency": 6,
    "maxLinks": 30,
    "keywordPattern": "(.*)",
    "titleSelector": "[data-testid=\"title\"], h1, main h1",
    "waitForSelector": ".app-loaded, main",
    "additionalWaitMs": 1000,
    "delayMs": 75,
    "blockResources": ["image", "media"]
  }'::jsonb
);
```
