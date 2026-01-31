import { supabase } from "@/lib/supabase";

export async function triggerProgramMatching (businessId, useAI = true) {
  const { data, error } = await supabase.functions.invoke('match-programs', {
    body: {
      business_id: businessId,
      use_ai: useAI,
      program_ids: [], // Empty array = match against all programs
    },
  });

  return { data, error };
}

// Get matches for a business
export async function getBusinessMatches(businessId) {
  const { data, error } = await supabase
    .from('matched_programs_view')
    .select('*')
    .eq('business_id', businessId)
    .order('match_score', { ascending: false })
    .limit(50);

  return { data, error };
}

// Get match statistics
export async function getMatchStatistics() {
  const { data, error } = await supabase
    .from('match_categories_view')
    .select('*');

  return { data, error };
}

// Real-time subscription to matches
export function subscribeToMatches(businessId, callback) {
  return supabase
    .channel('program-matches')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'program_matches',
        filter: `business_id=eq.${businessId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}