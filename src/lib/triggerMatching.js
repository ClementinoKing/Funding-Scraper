import { supabase } from './supabase'

/**
 * Manually trigger matching for a business
 */
export async function triggerBusinessMatching(businessId, useAI = true) {
  try {
    console.log("Triggering matching for business:", businessId, "useAI:", useAI);
    // First mark the business as needing matching
    await supabase
      .from('pending_program_matches')
      .upsert({
        business_id: businessId,
        needs_matching: true,
        priority: 3, // High priority for manual triggers
        updated_at: new Date().toISOString(),
      });

    // Then trigger the background matcher
    const { data, error } = await supabase.functions.invoke('background-matcher', {
      body: {
        batch_size: 1,
        use_ai: useAI,
        priority_threshold: 2, // Only process high priority
      },
    });
    console.log("Trigger response",data)

    return { success: !error, data, error };
  } catch (error) {
    console.error('Error triggering matching:', error);
    return { success: false, error };
  }
}

/**
 * Check if a business has pending matches
 */
export async function checkPendingMatches(businessId) {
  const { data, error } = await supabase
    .from('pending_program_matches')
    .select('*')
    .eq('business_id', businessId)
    .eq('needs_matching', true)
    .single();

  return { hasPending: !!data && !error, data, error };
}

/**
 * Get match results for a business
 */
export async function getBusinessMatches(businessId) {
  const { data, error } = await supabase
    .from('matched_programs_view')
    .select('*')
    .eq('business_id', businessId)
    .order('match_score', { ascending: false });

  return { data, error };
}

/**
 * Get match results for a business
 */
export async function getBusinessMatch(businessId, programSlug) {
  const { data, error } = await supabase
    .from('matched_programs_view')
    .select('*')
    .eq('business_id', businessId)
    .eq('program_slug', programSlug)
    .single();

  return { data, error };
}