import OpenAI from "openai";

export async function fetchAiResponse(
  payload,
  apiKey,
  provider = "openai",
  pageText = ""
) {
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
`;

  const userPrompt = `
Transform the following raw database record into a clean, human-readable summary and structured insights. 
Normalize this funding opportunity's data according to the schema provided below. 
Use only the data given; do not infer or hallucinate any information. 
If certain fields are missing, indicate them as "Not specified" or null as appropriate.

KEYPOINTS:
- If the program seems to have multiple funding opportunities, let's say there are multiple grants under one umbrella program or a grant and a lone in one program, return an array of separate JSON objects following the schema provided, one for each distinct funding opportunity.
- Focus on clarity and human readability
- Recreate the title to be clear and human friendly.
- Regenerate the summary so it is clear, concise, and suitable for human readers. Make sure the summary captures the essence of the funding opportunity and it should never be empty or "Not specified".

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
${payload?.source || "Not specified"}

WEBSITE CONTENT (if available):
${pageText || "No website content provided."}

RAW SCRAPED DATA (from database):
${JSON.stringify(payload, null, 2)}

Required JSON schema:
{
    "name": string,
    "summary": string,
    "source": string,
    "eligibility": string,
    "funding_amount": string,
    "deadlines": string,
    "contact_email": string | null,
    "contact_phone": string | null,
    "application_process": string,
    "sectors": string,
    "source_domain": string,
    "slug": string,
    "is_active": boolean,
    "confidence": number,
    "age": string,
    "gender": string,
    "ethnicity": string
}
`;
  console.log("System Propmt: ",systemPrompt);
  console.log("user propmt: ",userPrompt);

  if (provider === "openai") {
    const client = new OpenAI({
      apiKey: apiKey,
    });

    const response = await client.responses.create({
      model: "gpt-5-nano",
      instructions: systemPrompt,
      input: userPrompt,
    });

    return response.output_text;
  } else if (provider === "groq") {
    const url = "https://api.groq.com/v1/chat/completions";

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}