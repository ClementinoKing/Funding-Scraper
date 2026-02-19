import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { OpenAI } from "https://esm.sh/openai@latest";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MatchedProfile {
    business_id: string | number;
    program_id: string | number;
    eligibility_gaps: string[] | {[key: string]: string | number};
    match_reasons: string[] | {[key: string]: string | number};
    ai_analysis: string;
    ai_confidence: number;
    rule_score: number;
    ai_score: number;
    final_score: number;
    program_title: string;
    match_type: string;
    matched_at: string;
}


// Logger helper
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

serve(async (req) => {
  logger.info("=== AI-MATCH-PROGRAMS FUNCTION STARTED ===");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logger.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON request body",
          details: parseError?.message || "Unknown parsing error"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { business_id, program_ids, use_ai = true } = requestBody;

    if (!business_id) {
      return new Response(
        JSON.stringify({ error: "Business ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // STEP 1: Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      logger.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          details: "Missing Supabase credentials"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // STEP 2: Fetch business profile
    logger.info(`Fetching business profile for ID: ${business_id}`);

    const { data: businessProfile, error: profileError } = await supabaseClient
      .from("business_profile_view")
      .select("*")
      .eq("business_id", business_id)
      .single();

    if (profileError) {
      logger.error("Business profile query error:", profileError);
      return new Response(
        JSON.stringify({
          error: "Business profile not found",
          details: profileError.message
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!businessProfile) {
      logger.error("Business profile not found");
      return new Response(
        JSON.stringify({ error: "Business profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logger.info("Business profile loaded:", {
      business_name: businessProfile.business_name,
      industry: businessProfile.industry,
      province: businessProfile.province
    });

    // STEP 3: Fetch programs
    logger.info("Fetching programs...");

    let query = supabaseClient
      .from("scraped_items")
      .select(`
        id, 
        title, 
        summary, 
        eligibility, 
        funding_amount, 
        tags, 
        age, 
        gender, 
        ethnicity, 
        program_type,
        funding_category,
        desired_location,
        created_at
      `)
      .eq("is_active", true)
      .eq("is_valid", true)
      .not('funding_category', 'is', null)
      .not('funding_category', 'ilike', 'not specified%')
      .not('structured_data', 'is', null)
      .not('structured_data', 'eq', '{}')
      .order("created_at", { ascending: false });

    if (program_ids && Array.isArray(program_ids) && program_ids.length > 0) {
      query = query.in("id", program_ids);
    }

    const { data: programs, error: programsError } = await query;

    if (programsError) {
      logger.error("Error fetching programs:", programsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch programs",
          details: programsError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logger.info(`Found ${programs?.length || 0} programs`);

    // STEP 4: Initialize OpenAI if needed
    let openai: OpenAI | null = null;
    let aiAvailable = false;

    if (use_ai) {
      try {
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        if (openaiApiKey && openaiApiKey.trim() !== "") {
          openai = new OpenAI({
            apiKey: openaiApiKey,
            timeout: 30000, // 30 second timeout
            maxRetries: 2
          });
          aiAvailable = true;
          logger.info("OpenAI client initialized successfully");
        } else {
          logger.warn("OPENAI_API_KEY is empty or not set, AI features disabled");
        }
      } catch (error) {
        logger.error("Failed to initialize OpenAI client:", error);
      }
    }

    const matches: any[] = [];
    const debugLogs: any[] = [];

    // STEP 5: Process each program
    if (programs && programs.length > 0) {
      logger.info(`Processing ${programs.length} programs...`);

      for (const program of programs) {
        const debugLog: any = {
          program_id: program.id,
          program_title: program.title,
          scores: {},
          rule_reasons: [],
          rule_gaps: [],
          ai_reasons: [],
          ai_gaps: []
        };

        let ruleScore = 0;
        const maxScore = 100;

        // 1. Industry/Tags Matching (40 points)
        if (businessProfile.industry && program.tags) {
          const businessIndustry = (businessProfile.industry || '').toString().toLowerCase();
          let programTags: string[] = [];

          if (Array.isArray(program.tags)) {
            programTags = program.tags.map(t => t?.toString().toLowerCase() || '');
          } else if (typeof program.tags === 'string') {
            programTags = program.tags.toLowerCase().split(',').map(t => t.trim());
          }

          const hasIndustryMatch = programTags.some(tag => {
            return tag.includes(businessIndustry) ||
              businessIndustry.includes(tag) ||
              (tag && businessIndustry && (
                tag.split(' ').some(word => businessIndustry.includes(word)) ||
                businessIndustry.split(' ').some(word => tag.includes(word))
              ));
          });

          if (hasIndustryMatch) {
            ruleScore += 40;
            debugLog.scores.industry = 40;
            debugLog.rule_reasons.push(`Industry match: ${businessProfile.industry} found in program tags`);
          } else {
            debugLog.rule_gaps.push(`Industry mismatch: ${businessProfile.industry} not in program tags`);
          }
        }

        // 2. Location Matching (20 points)
        if (businessProfile.province) {
          const province = (businessProfile.province || '').toString().toLowerCase();
          const desiredLocation = (program.desired_location || '').toString().toLowerCase();

          const isNationwide = desiredLocation.includes('nationwide') ||
            desiredLocation.includes('all') ||
            desiredLocation.includes('any') ||
            desiredLocation.includes('not specified') ||
            desiredLocation.includes('national') ||
            desiredLocation.trim() === '';

          const hasLocationMatch = isNationwide ||
            desiredLocation.includes(province) ||
            province.includes(desiredLocation);

          if (hasLocationMatch) {
            ruleScore += 20;
            debugLog.scores.location = 20;
            debugLog.rule_reasons.push(`Location match: ${businessProfile.province}`);
          } else {
            debugLog.rule_gaps.push(`Location mismatch: ${businessProfile.province} not in ${program.desired_location}`);
          }
        } else {
          ruleScore += 10;
          debugLog.scores.location = 10;
          debugLog.rule_reasons.push(`No location restriction`);
        }

        // 3. Funding Amount Matching (20 points)
        const fundingMin = businessProfile?.funding_amount_min || businessProfile.funding_amount_exact || 0;
        const fundingMax = businessProfile?.funding_amount_max || businessProfile.funding_amount_exact || 1000000;

        if (fundingMin > 0 && program.funding_amount) {
          const programAmount = parseFundingAmount(program.funding_amount);

          if (programAmount >= (fundingMin - 5000) && programAmount <= (fundingMax + 5000)) {
            ruleScore += 20;
            debugLog.scores.funding = 20;
            debugLog.rule_reasons.push(`Funding amount match: ${program.funding_amount}`);
          } else {
            debugLog.rule_gaps.push(`Funding mismatch: Business needs ${fundingMin}-${fundingMax}, Program offers ${programAmount}`);
          }
        } else {
          ruleScore += 10;
          debugLog.scores.funding = 10;
          debugLog.rule_reasons.push(`Funding amount not specified`);
        }

        // 4. BEE/Certification Matching (10 points)
        if (businessProfile.bbee_certification && program.eligibility) {
          const eligibility = (program.eligibility || '').toString().toLowerCase();
          const beeLevel = (businessProfile.bbee_certification || '').toString().toLowerCase();

          if (eligibility.includes('bee') || eligibility.includes('bbee')) {
            if (beeLevel !== 'not-certified' && beeLevel !== 'prefer-not-to-say') {
              ruleScore += 10;
              debugLog.scores.bee = 10;
              debugLog.rule_reasons.push(`BEE certification match: ${beeLevel}`);
            } else {
              debugLog.rule_gaps.push(`BEE required but business is ${beeLevel}`);
            }
          } else {
            ruleScore += 5;
            debugLog.scores.bee = 5;
            debugLog.rule_reasons.push(`No BEE requirement`);
          }
        } else {
          ruleScore += 5;
          debugLog.scores.bee = 5;
        }

        // Cap rule score at 100
        ruleScore = Math.min(ruleScore, maxScore);
        debugLog.scores.rule_score = ruleScore;

        let aiScore = 0;
        let aiAnalysis = '';
        let aiConfidence = 0;
        let finalScore = ruleScore;
        let aiError = '';

        // AI-ENHANCED SCORING
        if (use_ai && aiAvailable && openai && ruleScore >= 25) {
          try {
            logger.info(`Running AI analysis for program ${program.id} (rule score: ${ruleScore})`);

            const aiResult = await calculateAIScore(openai, businessProfile, program);

            if (aiResult.success) {
              aiScore = aiResult.score;
              aiAnalysis = aiResult.analysis;
              aiConfidence = aiResult.confidence;
              debugLog.ai_reasons = aiResult.match_reasons;
              debugLog.ai_gaps = aiResult.eligibility_gaps;
              debugLog.scores.ai_score = aiScore;
              debugLog.scores.ai_confidence = aiConfidence;

              // Calculate weighted final score (60% rule-based, 40% AI)
              finalScore = Math.round((ruleScore * 0.6) + (aiScore * 0.4));
              debugLog.scores.final_score = finalScore;

              logger.info(`AI score: ${aiScore}, Final score: ${finalScore}`);
            } else {
              aiError = aiResult.error || 'Unknown AI error';
              debugLog.ai_error = aiError;
              finalScore = ruleScore;
              debugLog.scores.final_score = finalScore;
            }

          } catch (error) {
            aiError = error instanceof Error ? error.message : String(error);
            logger.error(`AI analysis failed for program ${program.id}:`, error);
            debugLog.ai_error = aiError;
            finalScore = ruleScore;
            debugLog.scores.final_score = finalScore;
          }
        } else {
          finalScore = ruleScore;
          debugLog.scores.final_score = finalScore;
          debugLog.ai_skipped = !aiAvailable ? 'OpenAI not available' :
            !use_ai ? 'AI disabled' :
              ruleScore < 25 ? 'Rule score < 25' : 'Unknown';
        }

        // Only include if final score >= 25
        if (finalScore >= 25) {
            const match = {
            program_id: program.id,
            business_id,
            rule_score: ruleScore,
            ai_score: aiScore,
            final_score: finalScore,
            match_reasons: [...(debugLog.ai_reasons ? debugLog.ai_reasons : debugLog.rule_reasons)].filter(Boolean),
            eligibility_gaps: [...(debugLog.ai_gaps ? debugLog.ai_gaps : debugLog.rule_gaps)].filter(Boolean),
            ai_analysis: aiAnalysis,
            ai_confidence: aiConfidence,
            program_title: program.title,
            matched_at: new Date().toISOString(),
            match_type: aiScore ? 'ai_enhanced' : 'rule_based'
          };
          matches.push(match);

          // STEP 7: Save Match
          saveMatchedProgram(match, supabaseClient);

          debugLog.qualified = true;
        } else {
          debugLog.qualified = false;
        }

        debugLogs.push(debugLog);
      }
    }

    // STEP 7: Sort matches by score
    matches.sort((a, b) => b.final_score - a.final_score);

    logger.info(`Found ${matches.length} qualified matches`);

    // STEP 8: Return response
    const response = {
      success: true,
      matches: matches.map(m => ({
        program_id: m.program_id,
        program_title: m.program_title,
        rule_score: m.rule_score,
        ai_score: m.ai_score,
        final_score: m.final_score,
        ai_confidence: m.ai_confidence,
        match_reasons: m.match_reasons?.slice(0, 3) || [],
        eligibility_gaps: m.eligibility_gaps?.slice(0, 3) || [],
        ai_analysis: m.ai_analysis ? m.ai_analysis.substring(0, 200) + '...' : null
      })),
      debug: {
        business_profile: {
          business_id: businessProfile.business_id,
          business_name: businessProfile.business_name,
          industry: businessProfile.industry,
          province: businessProfile.province,
          funding_min: businessProfile?.funding_amount_min || businessProfile.funding_amount_exact || 0,
          funding_max: businessProfile?.funding_amount_max || businessProfile.funding_amount_exact || 0,
          bbee: businessProfile.bbee_certification
        },
        total_programs: programs?.length || 0,
        matched_programs: matches.length,
        ai_enabled: use_ai,
        ai_available: aiAvailable,
        sample_debug_logs: debugLogs.slice(0, 2)
      },
      total_programs: programs?.length || 0,
      matched_programs: matches.length,
    };

    logger.info("=== AI-MATCH-PROGRAMS FUNCTION COMPLETED ===");

    return new Response(
      JSON.stringify(response, null, 2),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("Critical error in main function:", {
      message: errorMessage,
      stack: errorStack,
      error: error
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        stack: errorStack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to parse funding amounts
function parseFundingAmount(amountStr: string): number {
  if (!amountStr) return 0;

  const amountStrLower = amountStr.toLowerCase();

  // Handle ranges like "R50,000 - R100,000"
  const rangeMatch = amountStrLower.match(/r?\s*([\d,]+)\s*[-–—to]+\s*r?\s*([\d,]+)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const max = parseFloat(rangeMatch[2].replace(/,/g, ''));
    return (min + max) / 2;
  }

  // Handle single amounts
  const singleMatch = amountStrLower.match(/r?\s*([\d,.]+)\s*([kmb]?)/);
  if (!singleMatch) return 0;

  const value = parseFloat(singleMatch[1].replace(/,/g, ''));
  const multiplier = singleMatch[2]?.toLowerCase() || '';

  const multipliers: Record<string, number> = {
    'k': 1000,
    'm': 1000000,
    'b': 1000000000,
  };

  return value * (multipliers[multiplier] || 1);
}

// Enhanced AI Scoring Function with better error handling
async function calculateAIScore(
  openai: OpenAI,
  businessProfile: any,
  program: any
): Promise<{
  success: boolean;
  score?: number;
  analysis?: string;
  match_reasons?: string[];
  eligibility_gaps?: string[];
  confidence?: number;
  error?: string;
}> {

  try {
    // Prepare program data
    const programTags = Array.isArray(program.tags)
      ? program.tags.join(', ')
      : program.tags || 'Not specified';

    const prompt = `You are an expert funding program matching consultant. Analyze how well this funding program matches the business profile.

BUSINESS PROFILE:
- Business Name: ${businessProfile.business_name || 'Not specified'}
- Industry: ${businessProfile.industry || 'Not specified'}
- Business Type: ${businessProfile.business_type || 'Not specified'}
- Location: ${businessProfile.province || 'Not specified'}
- Annual Revenue Band: ${businessProfile.annual_revenue_band || 'Not specified'}
- Employee Size: ${businessProfile.employees_band || 'Not specified'}
- Funding Needs: ${businessProfile.funding_purposes || 'Not specified'}
- Funding Range: ${businessProfile.funding_amount_min || 0} - ${businessProfile.funding_amount_max || 0}
- BEE Certification: ${businessProfile.bbee_certification || 'Not specified'}
- Owner Demographics: Age ${businessProfile.owner_age || 'N/A'}, ${businessProfile.gender || 'N/A'}, ${businessProfile.race || 'N/A'}

FUNDING PROGRAM:
- Program Title: ${program.title}
- Summary: ${program.summary || 'Not provided'}
- Eligibility Criteria: ${program.eligibility || 'Not provided'}
- Funding Amount: ${program.funding_amount || 'Not specified'}
- Program Type: ${program.program_type || 'Not specified'}
- Funding Category: ${program.funding_category || 'Not specified'}
- Target Industries/Tags: ${programTags}
- Target Location: ${program.desired_location || 'Nationwide'}
- Target Demographics: Age ${program.age || 'Any'}, Gender ${program.gender || 'Any'}, Ethnicity ${program.ethnicity || 'Any'}

ANALYSIS CONSIDERATIONS:
1. Industry relevance and alignment (should carry 40% of the matching)
2. Funding amount compatibility (should carry 30% of the matching)
3. Location eligibility (should carry 5% of the matching)
4. Demographic targeting (should carry 5% of the matching)
5. Business stage and size appropriateness (should carry 5% of the matching)
6. Certification requirements (BEE, etc.) (should carry 5% of the matching)
7. Purpose of funding alignment (should carry 10% of the matching)

Return ONLY a valid JSON object in this exact format:
{
  "score": 85,
  "match_reasons": [{"name": "Reason 1", "value": 20}, {"name": "Reason 2", "value": 30}, {"name": "Reason 3", "value": 40}],
  "eligibility_gaps": [{"name": "Gap 1", "value": 5}, {"name": "Gap 2", "value": 10}, {"name": "Gap 3", "value": 5}],
  "analysis": "Brief analysis here (3-4 sentences)",
  "confidence": 0.95
}`;

    const response = await openai.responses.create({
      model: "gpt-3.5-turbo",
      instructions: "You are a funding program matching expert. Always respond with valid JSON only. Do not include any text outside the JSON object.",
      input: prompt,
    });

    const messageContent = response.output_text;
    if (!messageContent) {
      return {
        success: false,
        error: "Empty response from OpenAI"
      };
    }

    // Parse and validate the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(messageContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", messageContent);
      return {
        success: false,
        error: `Invalid JSON response from OpenAI: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`
      };
    }

    // Validate the parsed result structure
    if (typeof parsedResult !== 'object' || parsedResult === null) {
      return {
        success: false,
        error: "Invalid response format from OpenAI"
      };
    }

    // Ensure score is a number between 0-100
    const score = Math.min(Math.max(Number(parsedResult.score) || 0, 0), 100);

    // Ensure confidence is a number between 0-1
    const confidence = Math.min(Math.max(Number(parsedResult.confidence) || 0.5, 0), 1);

    // Ensure arrays are valid
    const match_reasons = Array.isArray(parsedResult.match_reasons)
      ? parsedResult.match_reasons.filter((r: any) => typeof r === 'string')
      : [];

    const eligibility_gaps = Array.isArray(parsedResult.eligibility_gaps)
      ? parsedResult.eligibility_gaps.filter((g: any) => typeof g === 'string')
      : [];

    // Ensure analysis is a string
    const analysis = typeof parsedResult.analysis === 'string'
      ? parsedResult.analysis
      : "No analysis provided";

    return {
      success: true,
      score,
      analysis,
      match_reasons,
      eligibility_gaps,
      confidence
    };

  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function saveMatchedProgram(match: MatchedProfile, supabaseClient: any) {
    const { data: existing } = await supabaseClient
        .from('program_matches_history')
        .select('*')
        .eq('business_id', match.business_id)
        .eq('program_id', match.program_id)
        .single();

    if (existing) {
    const { error: histError } = await supabaseClient
        .from("program_matches_history")
        .update(
        {
            match_score: match.final_score,
            eligibility_gaps: match.eligibility_gaps,
            match_reasons: match.match_reasons,
            ai_analysis: match.ai_analysis,
            ai_confidence: match.ai_confidence,
            rule_score: match.rule_score,
            ai_score: match.ai_score,
            match_type: 'ai_enhanced',
            created_at: new Date().toISOString(),
        }
        )
        .eq('business_id', match.business_id)
        .eq('program_id', match.program_id);

        if(histError) {
            logger.error("Error saving matches to history:", histError);
            return;
        }
    } else {
    const { error: histError } = await supabaseClient
        .from("program_matches_history")
        .insert(
        {
            business_id: match.business_id,
            program_id: match.program_id,
            match_score: match.final_score,
            eligibility_gaps: match.eligibility_gaps,
            match_reasons: match.match_reasons,
            ai_analysis: match.ai_analysis,
            ai_confidence: match.ai_confidence,
            rule_score: match.rule_score,
            ai_score: match.ai_score,
            match_type: 'ai_enhanced',
            created_at: new Date().toISOString(),
        }
        );

        if(histError) {
            logger.error("Error saving matches to history:", histError);
            return;
        }
    }
}