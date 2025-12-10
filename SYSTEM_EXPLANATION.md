# Funding Scraper System - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Scraping System](#scraping-system)
4. [AI Integration](#ai-integration)
5. [Database Layer](#database-layer)
6. [Frontend Application](#frontend-application)
7. [User Features](#user-features)
8. [Data Flow](#data-flow)
9. [Key Components](#key-components)
10. [Configuration](#configuration)

---

## System Overview

The **Funding Scraper** is a full-stack web application that automatically scrapes funding opportunities from multiple South African government and development finance institutions, processes the data using AI, stores it in a database, and presents it to users through a modern React interface with intelligent matching capabilities.

### Core Functionality
- **Web Scraping**: Automatically extracts funding program information from 16+ websites
- **AI Enhancement**: Uses OpenAI/Groq to clean, categorize, and improve scraped content
- **Database Storage**: Stores structured data in Supabase (PostgreSQL)
- **User Interface**: React-based dashboard with search, filtering, and profile matching
- **Profile Matching**: Intelligent matching of funding opportunities to user profiles

---

## Architecture

### Technology Stack

**Backend/Scraping:**
- Node.js (ES Modules)
- Playwright (browser automation)
- OpenAI/Groq API (AI processing)
- Supabase (PostgreSQL database)

**Frontend:**
- React 19
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- Radix UI (component library)
- Supabase Client (database access)

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React App)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dashboard│  │  Profile │  │  Search  │  │  Saved   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Supabase (PostgreSQL Database)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Programs │  │Subprogram│  │  Users   │  │  Logs    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                        ▲
                        │
                        │ Data Insertion
                        │
┌───────────────────────┴─────────────────────────────────────┐
│              Scraping System (Node.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Crawler  │  │   AI    │  │  Utils   │  │  Sites   │   │
│  │  Engine  │  │Processor │  │          │  │ Scrapers │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        │
┌───────────────────────▼─────────────────────────────────────┐
│         External Websites (16+ Funding Sources)            │
│  SEFA, TIA, PIC, Land Bank, IDC, NYDA, DTIC, etc.          │
└─────────────────────────────────────────────────────────────┘
```

---

## Scraping System

### Overview

The scraping system (`scripts/scrape/`) is responsible for:
1. Visiting funding organization websites
2. Discovering relevant program pages
3. Extracting structured data from each page
4. Processing and cleaning the data
5. Storing it in the database

### Entry Point: `index.mjs`

**Main Responsibilities:**
- Launches a headless Chromium browser using Playwright
- Runs all site scrapers in parallel for maximum speed
- Aggregates results from all scrapers
- Filters expired programs based on deadlines
- Organizes subprograms under parent programs
- Writes data to JSON file (`public/data/funding.json`)
- Inserts data into Supabase database
- Logs scrape runs for monitoring

**Key Features:**
- **Parallel Processing**: All 16 sites scraped simultaneously
- **Error Handling**: Individual site failures don't stop the entire process
- **Deadline Filtering**: Automatically removes expired programs
- **Subprogram Organization**: Links subprograms to parent programs
- **Dual Storage**: Saves to both JSON (fallback) and database

### Crawler Engine: `crawl.mjs`

**Core Functions:**

1. **`crawlAndExtract(browser, startUrl, siteConfig)`**
   - Discovers links on the start page matching funding keywords
   - Extracts data from the main page and linked pages
   - Processes subprograms if configured
   - Returns deduplicated program list

2. **`extractFromDetail(page, url, siteConfig)`**
   - Navigates to a program detail page
   - Extracts structured data:
     - Name, summary, eligibility
     - Funding amounts, deadlines
     - Contact information
     - Application process
     - Sectors
   - Optionally enhances with AI
   - Returns structured program object

**Extraction Strategy:**
- Uses semantic HTML selectors (`main`, `article`)
- Removes navigation, footer, and marketing content
- Extracts text between headings for structured sections
- Filters out marketing keywords and testimonials
- Uses regex patterns for dates, amounts, contact info

**Performance Optimizations:**
- Blocks images, stylesheets, fonts (faster loading)
- Parallel processing with concurrency limits
- Minimal delays between requests
- Fast failure with reduced timeouts

### Site-Specific Scrapers: `sites/*.mjs`

Each funding organization has a dedicated scraper file (e.g., `sefa.mjs`, `tia.mjs`).

**Structure:**
```javascript
export async function scrapeSefa(browser) {
  return await crawlAndExtract(browser, SOURCE_URL, {
    maxLinks: 15,              // Max pages to scrape
    delayMs: 50,               // Delay between requests
    concurrency: 6,            // Parallel page processing
    keywordRegex: /.../,       // Links to follow
    nameSelector: 'h1',        // Program name selector
    summarySelector: 'p',      // Summary selector
    eligibilityRegex: /.../,  // Eligibility section pattern
    subprogramSelector: '...', // Subprogram link selector
    extractSubprograms: true,  // Enable subprogram extraction
    maxSubprograms: 10,        // Max subprograms per program
    useAI: true,               // Enable AI enhancement
    aiMode: 'enhance'          // 'enhance' or 'extract'
  })
}
```

**Supported Sites (16 total):**
- SEFA (Small Enterprise Finance Agency)
- TIA (Technology Innovation Agency)
- PIC (Public Investment Corporation)
- Land Bank
- IDC (Industrial Development Corporation)
- NYDA (National Youth Development Agency)
- DTIC (Department of Trade, Industry and Competition)
- NEF (National Empowerment Fund)
- DSBD (Department of Small Business Development)
- DBSA (Development Bank of Southern Africa)
- GEP (Gauteng Enterprise Propeller)
- Ithala
- LEDA (Local Economic Development Agency)
- MEGA (Mpumalanga Economic Growth Agency)
- NWDC (North West Development Corporation)
- NCEDA (Northern Cape Economic Development Agency)

### Utilities: `utils.mjs`

**Text Processing:**
- `normalizeText()`: Cleans HTML entities and whitespace
- `cleanText()`: Removes HTML tags, scripts, styles, CDATA
- `filterMarketingContent()`: Removes testimonials, promotional text
- `extractCleanSummary()`: Creates clean summaries excluding eligibility

**Data Extraction:**
- `extractContactInfo()`: Finds emails and phone numbers
- `extractAmounts()`: Extracts funding amounts (R, ZAR, million, etc.)
- `extractDeadlines()`: Finds application deadlines and dates
- `extractApplicationProcess()`: Extracts step-by-step application info
- `extractSectors()`: Identifies relevant industries/sectors

**Validation:**
- `isValidProgram()`: Checks if program has minimum required data
- `isDeadlineExpired()`: Determines if program deadline has passed

**Other:**
- `retry()`: Retries failed operations with exponential backoff
- `writeJson()`: Writes data to JSON file
- `logSiteResult()`: Logs scraping results

---

## AI Integration

### Overview: `ai.mjs`

The AI system enhances scraped data using OpenAI or Groq APIs. It can:
- Improve and clean summaries
- Extract structured data from raw HTML
- Categorize programs (sectors, type, target audience)
- Clean eligibility criteria

### AI Modes

**1. Enhancement Mode (`aiMode: 'enhance'`)**
- Improves existing rule-based extractions
- Cleans summaries and eligibility text
- Categorizes programs
- Used by default for most sites

**2. Extraction Mode (`aiMode: 'extract'`)**
- Full AI-powered extraction from raw HTML
- More accurate but slower and more expensive
- Used for complex sites with poor HTML structure

### AI Functions

**`improveSummaryWithAI(summary, eligibility, rawText)`**
- Takes a scraped summary and improves it
- Removes marketing fluff and navigation text
- Makes it concise (2-3 sentences)
- Uses GPT-4o-mini or Llama 3.1 8B Instant

**`extractStructuredDataWithAI(htmlContent, url, programName)`**
- Extracts all program fields from raw HTML
- Returns structured JSON with:
  - Overview, eligibility, funding amounts
  - Deadlines, application process
  - Sectors, contact info, program type
- More accurate than rule-based extraction

**`categorizeWithAI(program)`**
- Categorizes program by:
  - Sectors (array of industries)
  - Program type (grant, loan, equity, hybrid, other)
  - Target audience (startups, SMEs, enterprises, individuals, all)

**`improveEligibilityWithAI(eligibility, rawText)`**
- Cleans eligibility criteria
- Removes footer text, copyright notices
- Removes navigation and marketing content
- Keeps only actual requirements

### Provider Support

**OpenAI** (default):
- Model: `gpt-4o-mini` (cost-effective)
- Requires: `OPENAI_API_KEY`

**Groq** (alternative):
- Model: `llama-3.1-8b-instant` (fast, free tier)
- Requires: `GROQ_API_KEY`
- Set `AI_PROVIDER=groq` in `.env`

**Quota Handling:**
- Automatically disables AI if quota exceeded
- Falls back gracefully to rule-based extraction
- Logs warnings for quota issues

---

## Database Layer

### Database: `db.mjs`

**Database: Supabase (PostgreSQL)**

### Tables

**1. `programs`**
Stores main funding programs.

**Schema:**
- `id` (UUID, primary key)
- `name` (text)
- `summary` (text)
- `source` (text, URL)
- `eligibility` (text)
- `funding_amount` (text)
- `deadlines` (text)
- `contact_email` (text)
- `contact_phone` (text)
- `application_process` (text)
- `sectors` (text)
- `slug` (text, unique)
- `source_domain` (text)
- `is_active` (boolean)
- `last_scraped_at` (timestamp)
- `created_at` (timestamp)

**2. `subprograms`**
Stores subprograms linked to parent programs.

**Schema:**
- `id` (UUID, primary key)
- `parent_program_id` (UUID, foreign key → programs.id)
- `name`, `summary`, `source`, `eligibility`, etc. (same as programs)
- `slug` (text, unique)

**3. `scrape_logs`**
Logs each scraping run for monitoring.

**Schema:**
- `id` (UUID, primary key)
- `source_url` (text)
- `source_name` (text)
- `programs_found` (integer)
- `subprograms_found` (integer)
- `status` (text: 'success', 'error', 'partial')
- `error_message` (text)
- `duration_seconds` (integer)
- `started_at` (timestamp)
- `completed_at` (timestamp)

**4. `user_profiles`**
User business profiles for matching.

**Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → auth.users)
- `business_name` (text)
- `business_type` (text)
- `industry` (text)
- `sectors` (text array)
- `funding_types` (text array)
- `funding_amount_needed` (text)
- `bee_level` (text)
- `created_at`, `updated_at` (timestamps)

**5. `saved_programs`**
User-saved programs.

**Schema:**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → auth.users)
- `program_id` (UUID, foreign key → programs.id)
- `created_at` (timestamp)

### Database Functions

**`insertScrapedData(organizedPrograms, subprogramsList)`**
- Main function to insert scraped data
- Upserts programs (updates if slug exists)
- Links subprograms to parents
- Returns summary with counts and errors

**`insertPrograms(programs)`**
- Inserts/updates programs in batches
- Returns map of slug → program_id

**`insertSubprograms(subprograms, programMap)`**
- Inserts subprograms linked to parent programs
- Deletes existing subprograms before inserting (simplifies updates)
- Handles orphaned subprograms (parent not found)

**`logScrapeRun(options)`**
- Logs scrape run to `scrape_logs` table
- Tracks success/failure, duration, counts

**`generateSlug(name, source)`**
- Creates URL-friendly slug from name and source
- Used for unique identification

---

## Frontend Application

### Overview

React-based single-page application with:
- Modern UI using Tailwind CSS and Radix UI
- Client-side routing with React Router
- Authentication via Supabase Auth
- Real-time data fetching from Supabase
- Profile-based program matching

### Entry Point: `src/main.jsx`

**Setup:**
- Wraps app in `ErrorBoundary` for error handling
- Provides `BrowserRouter` for routing
- Provides `ProgramsProvider` for global state
- Includes `Toaster` for notifications

### App Structure: `src/App.jsx`

**Routing:**
- `/login` - User login
- `/register` - User registration
- `/account-creation` - Create business profile
- `/dashboard` - Main programs listing (protected)
- `/funding/:slug` - Program detail page (protected)
- `/funding/:parentSlug/subprogram/:subprogramSlug` - Subprogram detail (protected)
- `/saved` - Saved programs (protected)
- `/profile` - User profile (protected)
- `/settings` - Settings (protected)
- `/search` - Search results (protected)

**Auth State Management:**
- Listens to Supabase auth state changes
- Updates local storage with tokens
- Handles sign-in, sign-out, token refresh

### Context: `ProgramsContext.jsx`

**Global State:**
- `programs` - Array of all programs
- `loading` - Loading state
- `error` - Error state
- `lastFetch` - Timestamp of last fetch
- `refreshPrograms()` - Force refresh programs

**Features:**
- Fetches programs on mount
- Caches data in localStorage (5-minute cache)
- Background refresh for stale cache
- Error handling with fallback to cache

### Data Fetching: `src/lib/programs.js`

**`fetchPrograms(options)`**
- Fetches programs from Supabase
- Includes nested subprograms
- Uses localStorage cache (5 minutes)
- Transforms database fields to frontend format
- Handles errors gracefully

**`fetchProgramBySlug(slug)`**
- Fetches single program with subprograms
- Used for detail pages

**`fetchSubprogramBySlugs(parentSlug, subprogramSlug)`**
- Fetches subprogram with parent context
- Used for subprogram detail pages

**Caching Strategy:**
- 5-minute cache duration
- Returns cached data immediately if available
- Refreshes in background
- Falls back to stale cache on errors

### Dashboard: `src/pages/Dashboard.jsx`

**Features:**
- Displays all funding programs
- Search functionality
- Sorting (name, date)
- View modes (grid/list)
- Pagination (12 per page)
- Statistics cards
- Profile-based filtering (qualified programs only)

**Program Filtering:**
- Filters out invalid/poorly scraped programs
- Excludes subprograms (shown nested in parents)
- Search across name, summary, eligibility
- Profile matching when user has profile

**Statistics:**
- Total programs (or qualified if profile exists)
- Average match score (if profile exists)
- Programs with funding info
- Programs with deadlines
- Unique organizations

### Profile Matching: `src/lib/profileMatching.js`

**`checkProgramQualification(program, userProfile)`**
Scores programs based on user profile (0-100 points):

1. **Sector Matching (30 points)**
   - Matches program sectors to user sectors
   - Partial credit if program doesn't specify sectors

2. **Funding Type Matching (25 points)**
   - Matches grants, loans, equity, etc.
   - Uses keyword matching in summary/eligibility

3. **Business Type Matching (15 points)**
   - Matches sole proprietor, partnership, PTY Ltd, etc.
   - Checks eligibility text for business type keywords

4. **Industry Matching (15 points)**
   - Matches user industry to program eligibility

5. **Funding Amount Range (10 points)**
   - Matches user's funding needs to program amounts

6. **BEE Level (5 points)**
   - Bonus if program mentions BEE and user is certified

**Qualification Threshold:** 40 points minimum

**`scoreAllPrograms(programs, userProfile)`**
- Scores all programs (doesn't filter)
- Adds `matchScore` and `qualification` to each program

**`filterQualifiedPrograms(programs, userProfile)`**
- Filters to only qualified programs (score ≥ 40)
- Sorts by match score descending

### Components

**Layout:**
- `Header.jsx` - Top navigation with search
- `Sidebar.jsx` - Side navigation menu
- `MobileNav.jsx` - Mobile bottom navigation

**Program Display:**
- `ProgramCard.jsx` - Program card (grid/list variants)
- `ProgramTabs.jsx` - Tabbed program details
- `RelatedPrograms.jsx` - Related programs section

**UI Components:**
- `FilterPanel.jsx` - Filtering controls
- `SortDropdown.jsx` - Sort options
- `ViewToggle.jsx` - Grid/list toggle
- `Pagination.jsx` - Page navigation
- `LoadingSpinner.jsx` - Loading states
- `EmptyState.jsx` - Empty state messages

**Other:**
- `Breadcrumbs.jsx` - Navigation breadcrumbs
- `ShareModal.jsx` - Share program modal
- `Timeline.jsx` - Application process timeline

---

## User Features

### Authentication
- Email/password registration
- Email/password login
- Session management via Supabase Auth
- Protected routes (require authentication)

### Profile Creation
- Business information form
- Sectors selection
- Funding type preferences
- Funding amount needed
- Business type selection
- Industry selection
- BEE level (optional)

### Program Discovery
- Browse all programs
- Search by keywords
- Sort by name, date
- Filter by qualified programs (if profile exists)
- View modes (grid/list)
- Pagination

### Program Details
- Full program information
- Eligibility criteria
- Application process
- Contact information
- Related subprograms
- Save program functionality
- Share program

### Saved Programs
- View saved programs
- Remove saved programs
- Quick access to favorites

### Profile Matching
- Automatic scoring of programs
- Shows only qualified programs (optional)
- Match score percentage
- Qualification reasons

---

## Data Flow

### Scraping Flow

```
1. Run: npm run scrape
   ↓
2. index.mjs launches browser
   ↓
3. Parallel execution of all site scrapers
   ↓
4. Each scraper (e.g., sefa.mjs):
   a. Calls crawlAndExtract() with site config
   b. Discovers links on start page
   c. Extracts data from each page
   d. Optionally enhances with AI
   e. Returns program array
   ↓
5. index.mjs aggregates all results
   ↓
6. Filters expired programs
   ↓
7. Organizes subprograms under parents
   ↓
8. Writes to public/data/funding.json
   ↓
9. Inserts into Supabase database
   ↓
10. Logs scrape run
```

### Frontend Data Flow

```
1. User opens dashboard
   ↓
2. ProgramsContext loads programs
   ↓
3. Checks localStorage cache
   ↓
4. If cache valid: return cached data
   If cache expired/missing: fetch from Supabase
   ↓
5. Fetches programs + subprograms from database
   ↓
6. Transforms database fields to frontend format
   ↓
7. Caches in localStorage
   ↓
8. Updates ProgramsContext state
   ↓
9. Dashboard filters/sorts programs
   ↓
10. If user has profile: scores programs
   ↓
11. Renders program cards
```

### Profile Matching Flow

```
1. User completes profile (AccountCreation page)
   ↓
2. Profile saved to user_profiles table
   ↓
3. Dashboard loads user profile
   ↓
4. scoreAllPrograms() called with programs + profile
   ↓
5. For each program:
   a. Check sector match (30 pts)
   b. Check funding type match (25 pts)
   c. Check business type match (15 pts)
   d. Check industry match (15 pts)
   e. Check amount range match (10 pts)
   f. Check BEE level (5 pts)
   g. Calculate total score
   ↓
6. If "qualified only" filter enabled:
   - Filter programs with score ≥ 40
   - Sort by score descending
   ↓
7. Display programs with match scores
```

---

## Key Components

### Scraping System Files

**`scripts/scrape/index.mjs`**
- Main entry point for scraping
- Orchestrates all site scrapers
- Handles aggregation and database insertion

**`scripts/scrape/crawl.mjs`**
- Core crawling and extraction logic
- Link discovery
- Page extraction
- Subprogram handling

**`scripts/scrape/utils.mjs`**
- Text processing utilities
- Data extraction functions
- Validation functions
- File I/O utilities

**`scripts/scrape/ai.mjs`**
- AI integration (OpenAI/Groq)
- Summary improvement
- Data extraction
- Categorization

**`scripts/scrape/db.mjs`**
- Database operations
- Program/subprogram insertion
- Scrape logging

**`scripts/scrape/sites/*.mjs`**
- Site-specific scrapers (16 files)
- Each defines scraping configuration

### Frontend Files

**`src/main.jsx`**
- Application entry point
- Provider setup

**`src/App.jsx`**
- Routing configuration
- Auth state management

**`src/contexts/ProgramsContext.jsx`**
- Global programs state
- Data fetching and caching

**`src/pages/Dashboard.jsx`**
- Main programs listing
- Search, filter, sort
- Profile matching integration

**`src/lib/programs.js`**
- Database fetching functions
- Cache management

**`src/lib/profileMatching.js`**
- Program qualification logic
- Scoring algorithms

**`src/lib/supabase.js`**
- Supabase client initialization

**`src/lib/auth.js`**
- Authentication utilities
- User profile creation

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url  # For Node.js scripts
SUPABASE_ANON_KEY=your_supabase_anon_key  # For Node.js scripts

# AI Configuration (Optional)
AI_PROVIDER=openai  # or 'groq'
OPENAI_API_KEY=your_openai_key  # If using OpenAI
GROQ_API_KEY=your_groq_key  # If using Groq
```

### Database Setup

1. Create Supabase project
2. Run SQL migrations:
   - `supabase-migration.sql` - Full database schema
   - `supabase-quick-fix.sql` - Quick fix for auth issues
3. Set up Row Level Security (RLS) policies
4. Configure environment variables

### Running the System

**Development:**
```bash
npm install
npm run dev  # Start frontend dev server
```

**Scraping:**
```bash
npm run scrape  # Run scraping script
```

**Build:**
```bash
npm run build  # Build for production
```

### Scraping Configuration

Each site scraper can be configured with:

- `maxLinks`: Maximum pages to scrape (default: 12)
- `delayMs`: Delay between requests (default: 50ms)
- `concurrency`: Parallel page processing (default: 6)
- `keywordRegex`: Pattern to match relevant links
- `nameSelector`: CSS selector for program name
- `summarySelector`: CSS selector for summary
- `eligibilityRegex`: Pattern to find eligibility section
- `subprogramSelector`: CSS selector for subprogram links
- `extractSubprograms`: Enable subprogram extraction
- `maxSubprograms`: Maximum subprograms per program
- `useAI`: Enable AI enhancement
- `aiMode`: 'enhance' or 'extract'

---

## Summary

The Funding Scraper system is a comprehensive solution for aggregating funding opportunities from multiple sources. It combines:

- **Robust Web Scraping**: Parallel processing, error handling, deadline filtering
- **AI Enhancement**: Content cleaning, categorization, structured extraction
- **Modern Frontend**: React-based UI with search, filtering, and matching
- **Intelligent Matching**: Profile-based program qualification
- **Reliable Storage**: Supabase database with caching and fallback JSON

The system is designed for scalability, maintainability, and user experience, making it easy to discover and match funding opportunities.
