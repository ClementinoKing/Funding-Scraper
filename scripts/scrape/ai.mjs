// scripts/scrape/ai.mjs
import OpenAI from 'openai'
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
config({ path: envPath })

// Determine provider (groq or openai)
const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase()
const groqApiKey = process.env.GROQ_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

// Get API key based on provider
const apiKey = provider === 'groq' ? groqApiKey : openaiApiKey

if (!apiKey) {
  console.warn(`[AI] Warning: ${provider.toUpperCase()}_API_KEY not found in environment variables`)
  console.warn('[AI] AI features will be disabled')
}

// Initialize AI client based on provider
let aiClient = null
if (apiKey) {
  if (provider === 'groq') {
    // Groq uses OpenAI-compatible API
    aiClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    console.log('[AI] Using Groq provider')
  } else {
    // Default to OpenAI
    aiClient = new OpenAI({ apiKey })
    console.log('[AI] Using OpenAI provider')
  }
}

// Track quota errors to avoid repeated API calls
let quotaExceeded = false

/**
 * Check if AI is available
 */
export function isAIAvailable() {
  return aiClient !== null && !quotaExceeded
}

/**
 * Use AI to improve and clean summaries
 */
export async function improveSummaryWithAI(summary, eligibility = '', rawText = '') {
  if (!aiClient || quotaExceeded) {
    if (quotaExceeded) {
      return summary // Silent fallback if quota exceeded
    }
    console.warn('[AI] AI not configured, skipping AI enhancement')
    return summary
  }

  if (!summary || summary.length < 20) {
    return summary // Too short to improve
  }

  const prompt = `Improve this funding program summary. Make it concise (2-3 sentences), professional, and informative. Remove marketing fluff, navigation text, and irrelevant content.

Current summary: ${summary}
${eligibility ? `Eligibility context: ${eligibility.slice(0, 200)}` : ''}

Return ONLY the improved summary, no explanations or markdown formatting.`

  try {
    // Select model based on provider
    const model = provider === 'groq' 
      ? 'llama-3.1-8b-instant'  // Groq's free fast model
      : 'gpt-4o-mini'  // OpenAI's cost-effective model

    const response = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing clear, concise funding program summaries. Remove all marketing content, navigation menus, and irrelevant information.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
    })

    const improved = response.choices[0].message.content.trim()
    return improved || summary // Fallback to original if empty
  } catch (error) {
    // Check for quota/billing errors
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('billing')) {
      quotaExceeded = true
      console.error(`[AI] Quota exceeded (${provider}) - disabling AI for remainder of scrape.`)
      if (provider === 'openai') {
        console.error('[AI] Please check your OpenAI billing: https://platform.openai.com/account/billing')
      } else if (provider === 'groq') {
        console.error('[AI] Please check your Groq usage: https://console.groq.com/')
      }
      return summary
    }
    console.error('[AI] Error improving summary:', error.message)
    return summary // Fallback to original on error
  }
}

/**
 * Use AI to categorize programs by sector, type, and target audience
 */
export async function categorizeWithAI(program) {
  if (!aiClient || quotaExceeded) {
    return { sectors: [], programType: 'other', targetAudience: 'all' }
  }

  const prompt = `Categorize this funding program. Return JSON with:
- sectors: Array of relevant sectors (e.g., ["agriculture", "technology", "manufacturing"])
- programType: One of: "grant", "loan", "equity", "hybrid", "other"
- targetAudience: One of: "startups", "smes", "enterprises", "individuals", "all"

Program name: ${program.name || 'Unknown'}
Summary: ${program.summary?.slice(0, 300) || 'N/A'}
Eligibility: ${program.eligibility?.slice(0, 300) || 'N/A'}

Return ONLY valid JSON.`

  try {
    // Select model based on provider
    const model = provider === 'groq' 
      ? 'llama-3.1-8b-instant'  // Groq's free fast model
      : 'gpt-4o-mini'  // OpenAI's cost-effective model

    const response = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at categorizing funding programs. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const categorized = JSON.parse(response.choices[0].message.content)
    
    // Ensure proper format
    return {
      sectors: Array.isArray(categorized.sectors) ? categorized.sectors : [],
      programType: categorized.programType || 'other',
      targetAudience: categorized.targetAudience || 'all'
    }
  } catch (error) {
    // Check for quota/billing errors
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('billing')) {
      quotaExceeded = true
      console.error(`[AI] Quota exceeded (${provider}) - disabling AI for remainder of scrape.`)
      if (provider === 'openai') {
        console.error('[AI] Please check your OpenAI billing: https://platform.openai.com/account/billing')
      } else if (provider === 'groq') {
        console.error('[AI] Please check your Groq usage: https://console.groq.com/')
      }
      return { sectors: [], programType: 'other', targetAudience: 'all' }
    }
    console.error('[AI] Error categorizing:', error.message)
    return { sectors: [], programType: 'other', targetAudience: 'all' }
  }
}

/**
 * Use AI to extract structured data from raw HTML content
 * This provides better extraction of overview, eligibility, and other fields
 */
export async function extractStructuredDataWithAI(htmlContent, url, programName = '') {
  if (!aiClient || quotaExceeded) {
    return null
  }

  // Limit content to avoid token limits (keep it reasonable)
  const content = htmlContent.slice(0, 12000) // Increased for better context

  const prompt = `Extract structured funding program information from this webpage content. Return a JSON object with these fields:

- overview: A clear 2-3 sentence overview of what this funding program offers (remove marketing fluff, navigation text, testimonials)
- eligibility: Detailed eligibility criteria - who can apply, requirements, qualifications. Format as clear paragraphs or bullet points. Remove footer text, copyright notices, and navigation menus.
- fundingAmount: Specific funding amounts mentioned (e.g., "R500,000 to R5 million" or "Up to R2 million")
- deadlines: Application deadlines or "ongoing" if no deadline
- applicationProcess: Step-by-step application process (if available)
- sectors: Array of relevant industries/sectors
- contactEmail: Contact email address if found
- contactPhone: Contact phone number if found
- programType: One of: "grant", "loan", "equity", "hybrid", "other"
- targetAudience: One of: "startups", "smes", "enterprises", "individuals", "all"

Webpage URL: ${url}
Program Name: ${programName || 'Unknown'}

Webpage content:
${content}

IMPORTANT:
- Remove all marketing content, testimonials, success stories, navigation menus
- Extract ONLY factual information about the funding program
- For eligibility: Extract actual requirements, not general website text
- For overview: Focus on what the program does, not organizational background
- Return ONLY valid JSON, no markdown formatting, no code blocks`

  try {
    // Use more capable model for full extraction
    const model = provider === 'groq' 
      ? 'llama-3.1-8b-instant'  // Use available model (70b-versatile was decommissioned)
      : 'gpt-4o-mini'

    const response = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured data from funding program web pages. You extract only factual, relevant information and remove all marketing content, navigation menus, testimonials, and irrelevant text. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Lower temperature for more consistent extraction
      max_tokens: 1500, // Increased for detailed eligibility
    })

    const extracted = JSON.parse(response.choices[0].message.content)
    
    // Validate and clean extracted data
    return {
      overview: extracted.overview || '',
      eligibility: extracted.eligibility || '',
      fundingAmount: extracted.fundingAmount || '',
      deadlines: extracted.deadlines || '',
      applicationProcess: extracted.applicationProcess || '',
      sectors: Array.isArray(extracted.sectors) ? extracted.sectors : [],
      contactEmail: extracted.contactEmail || '',
      contactPhone: extracted.contactPhone || '',
      programType: extracted.programType || 'other',
      targetAudience: extracted.targetAudience || 'all',
    }
  } catch (error) {
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('billing')) {
      quotaExceeded = true
      console.error(`[AI] Quota exceeded (${provider}) - disabling AI for remainder of scrape.`)
      return null
    }
    console.error('[AI] Error extracting structured data:', error.message)
    return null
  }
}

/**
 * Use AI to improve eligibility extraction specifically
 */
export async function improveEligibilityWithAI(eligibility, rawText = '') {
  if (!aiClient || quotaExceeded) {
    return eligibility
  }

  if (!eligibility || eligibility.length < 30) {
    return eligibility
  }

  const prompt = `Clean and improve this eligibility criteria text. Remove:
- Footer text, copyright notices, legal disclaimers
- Navigation menus and links
- Marketing content and testimonials
- General website information
- Contact information (keep only if it's part of eligibility requirements)

Keep only the actual eligibility requirements, qualifications, and criteria for applicants.

Current eligibility text:
${eligibility.slice(0, 1000)}

${rawText ? `Additional context: ${rawText.slice(0, 500)}` : ''}

Return ONLY the cleaned eligibility criteria, no explanations.`

  try {
    const model = provider === 'groq' 
      ? 'llama-3.1-8b-instant'
      : 'gpt-4o-mini'

    const response = await aiClient.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at cleaning and extracting eligibility criteria from funding program text. Remove all irrelevant content and keep only actual requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
    })

    const improved = response.choices[0].message.content.trim()
    return improved || eligibility
  } catch (error) {
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('billing')) {
      quotaExceeded = true
      return eligibility
    }
    console.error('[AI] Error improving eligibility:', error.message)
    return eligibility
  }
}

