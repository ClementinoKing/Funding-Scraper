import OpenAI from 'openai'

/**
 * Enhance scraped item with AI processing
 */
export async function enhanceWithAI(item, pageText, config) {
  const aiProvider = config.aiProvider || process.env.AI_PROVIDER || 'openai'
  const apiKey = aiProvider === 'openai' 
    ? (config.openaiKey || process.env.OPENAI_API_KEY)
    : (config.groqKey || process.env.GROQ_API_KEY)

  if (!apiKey) {
    throw new Error(`AI API key not found for provider: ${aiProvider}`)
  }

  const systemPrompt = `
You are a deterministic data-processing and normalization engine.

Rules you MUST follow:
- Output MUST be valid JSON only
- No markdown, no commentary, no explanations
- Do NOT infer missing data
- Never hallucinate facts
- Follow the schema EXACTLY
- Use ONLY provided data
- Prefer website content over raw scraped data if conflicts exist
- If information is missing, write "Not specified" or null
- Follow the schema EXACTLY
`

  const userPrompt = `
Transform the following raw database record into a clean, human-readable summary and structured insights. 
Normalize this funding opportunity's data according to the schema provided below. 
Use only the data given; do not infer or hallucinate any information. 
If certain fields are missing, indicate them as "Not specified" or null as appropriate.

KEYPOINTS:
- If the program seems to have multiple funding opportunities, let's say there are multiple grants under one umbrella program or a grant and a loan in one program, return an array of separate JSON objects following the schema provided, one for each distinct funding opportunity.
- Once you split the funding opportunities, determine the program type (program_type) as well, if its a grant, loan etc.
- You should also be able to determine the funding categories based on the list provided below. Use the column funding_category.
- Focus on clarity and human readability
- Recreate the title to be clear and human friendly.
- Regenerate the summary so it is clear, concise, and suitable for human readers. Make sure the summary captures the essence of the funding opportunity and it should never be empty or "Not specified".
- Make sure you capture the deadline if it has been provided anywhere in the content.

**Available Funding Categories:**
1. Working capital (cashflow)                        
2. Inventory / stock                                 
3. Equipment / assets                                
4. Business expansion / CAPEX (premises, new branch) 
5. Marketing & sales                                 
6. Payroll / hiring                                  
7. Technology / software                             
8. R&D / product development                         
9. Debt consolidation / refinance                    
10. Supplier / trade finance need                     
11. Other 

ELIGIBILITY (CRITICAL):
- Capturing accurate eligibility criteria is a must no matter what, no blanks needed - write something based on the summary or the website content.
- Eligibility describes WHO is allowed to apply.
- Extract ONLY factual conditions explicitly stated in the content.
- You can also use the raw scraped data for eligibility extraction.
- The summary can also be used to find eligibility information.
- Look for eligibility information using these indicators:
  /(eligib|requirements|qualif|who can apply|criteria|support|applicants must|open to)/i
- Include conditions such as:
  - organisation type (individuals, SMEs, startups, NGOs, companies, researchers, students)
  - geographic restrictions (country, province, region)
  - legal status (registered entity, tax compliant, licensed)
  - demographic restrictions (age, gender, ethnicity) ONLY if explicitly stated
  - sector or activity restrictions ONLY if framed as eligibility
- EXCLUDE:
  - application steps
  - selection process descriptions
  - evaluation criteria
  - benefits or funding usage
- If eligibility is spread across multiple sections, combine into a single readable paragraph.

- Funding amount must be explicit, include currency, and be human-readable
  (e.g. "R 500 Thousand", "R 10 Million", "$100,000").

- Deadlines must be a clear date ("31 December 2024"), "Open", or "Not specified".

- Extract contact email and phone number if explicitly present; otherwise use null.

APPLICATION PROCESS:
- Summarize HOW to apply.
- Include steps if available, otherwise a short descriptive paragraph.

- Capture sectors clearly; if missing write "Not specified".

AGE:
- Extract age ONLY if explicitly stated.
- Format as a range, e.g. "18-25".
- If missing, write "Not specified".

GENDER:
- Extract gender ONLY if explicitly stated.
- If missing, write "Not specified".

ETHNICITY:
- Extract ethnicity ONLY if explicitly stated.
- If missing, write "Not specified".

SOURCE URL:
${item.url || "Not specified"}

WEBSITE CONTENT (if available):
${pageText || "No website content provided."}

RAW SCRAPED DATA (from database):
${JSON.stringify(item, null, 2)}

Required JSON schema:
{
    "title": string,
    "summary": string,
    "url": string,
    "eligibility": string,
    "funding_amount": string,
    "deadlines": string,
    "contact_email": string | null,
    "contact_phone": string | null,
    "application_process": string,
    "sectors": string,
    "slug": string,
    "confidence": number (0-1),
    "age": string,
    "gender": string,
    "ethnicity": string,
    "desired_location": string,
    "program_type": string,
    "funding_category": string
}

Return either a single JSON object or an array of JSON objects if splitting into multiple opportunities.
`

  if (aiProvider === 'openai') {
    return await enhanceWithOpenAI(systemPrompt, userPrompt, apiKey, config)
  } else if (aiProvider === 'groq') {
    return await enhanceWithGroq(systemPrompt, userPrompt, apiKey, config)
  } else {
    throw new Error(`Unsupported AI provider: ${aiProvider}`)
  }
}

/**
 * Enhance with OpenAI
 */
async function enhanceWithOpenAI(systemPrompt, userPrompt, apiKey, config) {
  const client = new OpenAI({ apiKey })

  const model = config.aiModel || 'gpt-4o-mini'

  const response = await client.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1, // Low temperature for deterministic output
    response_format: { type: 'json_object' }
  })

  const content = response.choices[0].message.content
  
  try {
    const parsed = JSON.parse(content)
    return parsed
  } catch (error) {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('Failed to parse AI response as JSON')
  }
}

/**
 * Enhance with Groq
 */
async function enhanceWithGroq(systemPrompt, userPrompt, apiKey, config) {
  const model = config.aiModel || 'llama-3.3-70b-versatile'
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    const parsed = JSON.parse(content)
    return parsed
  } catch (error) {
    // Try to extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('Failed to parse AI response as JSON')
  }
}
