import { supabase } from './supabase'

/**
 * Subscribe to real-time updates for a business's matches
 */
export function subscribeToBusinessMatches(businessId, callback) {
  const channel = supabase.channel(`business-matches-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'program_matches_history',
        filter: `business_id=eq.${businessId}`,
      },
      (payload) => {
        console.log('New match added:', payload.new);
        callback(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pending_program_matches',
        filter: `business_id=eq.${businessId}`,
      },
      (payload) => {
        console.log('Pending match updated:', payload.new);
        if (!payload.new.needs_matching) {
          // Matching completed, trigger a refresh
          callback({ type: 'matching_completed', businessId });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all business matches (admin view)
 */
export function subscribeToAllMatches(callback) {
  const channel = supabase.channel('all-business-matches')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'program_matches_history',
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}