import { supabase } from './supabase'

const USER_PROFILE_CACHE_KEY = 'user_profile_cache'
const USER_PROFILE_CACHE_TIMESTAMP_KEY = 'user_profile_cache_timestamp'
const USER_PROFILE_CACHE_USER_ID_KEY = 'user_profile_cache_user_id'
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes cache

/**
 * Get cached user profile from localStorage
 * @param {string} userId - Current user ID to verify cache belongs to this user
 * @returns {Object|null} Cached user profile or null if cache is invalid/expired
 */
function getCachedUserProfile(userId) {
  try {
    const cached = localStorage.getItem(USER_PROFILE_CACHE_KEY)
    const timestamp = localStorage.getItem(USER_PROFILE_CACHE_TIMESTAMP_KEY)
    const cachedUserId = localStorage.getItem(USER_PROFILE_CACHE_USER_ID_KEY)
    
    // Verify cache belongs to current user
    if (!cached || !timestamp || cachedUserId !== userId) {
      return null
    }
    
    const cacheAge = Date.now() - parseInt(timestamp, 10)
    if (cacheAge > CACHE_DURATION) {
      // Cache expired, clear it
      clearUserProfileCache()
      return null
    }
    
    return JSON.parse(cached)
  } catch (error) {
    console.error('Error reading cached user profile:', error)
    return null
  }
}

/**
 * Cache user profile in localStorage
 * @param {Object} profile - User profile object
 * @param {string} userId - Current user ID
 */
function cacheUserProfile(profile, userId) {
  try {
    localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profile))
    localStorage.setItem(USER_PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString())
    localStorage.setItem(USER_PROFILE_CACHE_USER_ID_KEY, userId)
  } catch (error) {
    console.error('Error caching user profile:', error)
  }
}

/**
 * Clear cached user profile
 * Exported for use when user logs out or profile is updated
 */
export function clearUserProfileCache() {
  try {
    localStorage.removeItem(USER_PROFILE_CACHE_KEY)
    localStorage.removeItem(USER_PROFILE_CACHE_TIMESTAMP_KEY)
    localStorage.removeItem(USER_PROFILE_CACHE_USER_ID_KEY)
  } catch (error) {
    console.error('Error clearing user profile cache:', error)
  }
}

/**
 * Fetch user profile with caching
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise<{success: boolean, profile?: Object, error?: string, fromCache?: boolean}>}
 */
export async function fetchUserProfile(useCache = true) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated', profile: null }
    }

    // Return cached data immediately if available and valid
    if (useCache) {
      const cached = getCachedUserProfile(user.id)
      if (cached) {
        // Fetch fresh data in the background (fire and forget)
        fetchUserProfile(false).then((result) => {
          if (result.success && result.profile) {
            cacheUserProfile(result.profile, user.id)
          }
        }).catch(() => {
          // Silently fail background refresh
        })
        return { success: true, profile: cached, fromCache: true }
      }
    }

    // Fetch fresh profile from database
    const { data: profile, error: profileError } = await supabase
      .from('business_profile_view')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      // If not found, return null (user might not have created profile yet)
      if (profileError.code === 'PGRST116') {
        return { success: true, profile: null, fromCache: false }
      }
      return { success: false, error: profileError.message, profile: null }
    }

    // Cache the fresh data
    if (profile) {
      cacheUserProfile(profile, user.id)
    }

    return { success: true, profile: profile || null, fromCache: false }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { success: false, error: error.message, profile: null }
  }
}

