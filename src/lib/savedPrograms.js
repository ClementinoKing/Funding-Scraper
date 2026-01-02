import { supabase } from './supabase'

const SAVED_PROGRAMS_CACHE_KEY = 'saved_programs_cache'
const CACHE_TIMESTAMP_KEY = 'saved_programs_cache_timestamp'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached saved programs from localStorage
 * @returns {Array|null} Cached saved programs or null if cache is invalid/expired
 */
function getCachedSavedPrograms() {
  try {
    const cached = localStorage.getItem(SAVED_PROGRAMS_CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (!cached || !timestamp) return null
    
    const cacheAge = Date.now() - parseInt(timestamp, 10)
    if (cacheAge > CACHE_DURATION) {
      // Cache expired, clear it
      localStorage.removeItem(SAVED_PROGRAMS_CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
      return null
    }
    
    return JSON.parse(cached)
  } catch (error) {
    console.error('Error reading cached saved programs:', error)
    return null
  }
}

/**
 * Cache saved programs in localStorage
 * @param {Array} programs - Saved programs array
 */
function cacheSavedPrograms(programs) {
  try {
    localStorage.setItem(SAVED_PROGRAMS_CACHE_KEY, JSON.stringify(programs))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('Error caching saved programs:', error)
  }
}

/**
 * Clear cached saved programs
 * Exported for use when user logs out
 */
export function clearSavedProgramsCache() {
  try {
    localStorage.removeItem(SAVED_PROGRAMS_CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  } catch (error) {
    console.error('Error clearing saved programs cache:', error)
  }
}

/**
 * Save a program or subprogram for the current user
 * @param {string} programId - UUID of the program (null if saving subprogram)
 * @param {string} subprogramId - UUID of the subprogram (null if saving program)
 * @param {string} notes - Optional notes about the saved program
 * @returns {Promise<{success: boolean, error?: string, data?: Object}>}
 */
export async function saveProgram(programId, subprogramId = null, notes = null) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate that exactly one of programId or subprogramId is provided
    if (!programId && !subprogramId) {
      return { success: false, error: 'Either programId or subprogramId must be provided' }
    }
    if (programId && subprogramId) {
      return { success: false, error: 'Cannot save both program and subprogram simultaneously' }
    }

    // Insert into saved_programs table
    const { data, error } = await supabase
      .from('saved_programs')
      .insert({
        user_id: user.id,
        program_id: programId || null,
        subprogram_id: subprogramId || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      // Check if it's a unique constraint violation (already saved)
      if (error.code === '23505') {
        return { success: false, error: 'Program is already saved' }
      }
      return { success: false, error: error.message }
    }

    // Invalidate cache when a program is saved
    clearSavedProgramsCache()

    return { success: true, data }
  } catch (error) {
    console.error('Error saving program:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Unsave a program or subprogram for the current user
 * @param {string} programId - UUID of the program (null if unsaving subprogram)
 * @param {string} subprogramId - UUID of the subprogram (null if unsaving program)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unsaveProgram(programId, subprogramId = null) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Build the query
    let query = supabase
      .from('saved_programs')
      .delete()
      .eq('user_id', user.id)

    if (programId) {
      query = query.eq('program_id', programId).is('subprogram_id', null)
    } else if (subprogramId) {
      query = query.eq('subprogram_id', subprogramId).is('program_id', null)
    } else {
      return { success: false, error: 'Either programId or subprogramId must be provided' }
    }

    const { error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // Invalidate cache when a program is unsaved
    clearSavedProgramsCache()

    return { success: true }
  } catch (error) {
    console.error('Error unsaving program:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if a program or subprogram is saved by the current user
 * @param {string} programId - UUID of the program (null if checking subprogram)
 * @param {string} subprogramId - UUID of the subprogram (null if checking program)
 * @returns {Promise<{isSaved: boolean, savedProgram?: Object}>}
 */
export async function checkSavedStatus(programId, subprogramId = null) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { isSaved: false }
    }

    // Build the query
    let query = supabase
      .from('saved_programs')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (programId) {
      query = query.eq('program_id', programId).is('subprogram_id', null)
    } else if (subprogramId) {
      query = query.eq('subprogram_id', subprogramId).is('program_id', null)
    } else {
      return { isSaved: false }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking saved status:', error)
      return { isSaved: false }
    }

    return {
      isSaved: data && data.length > 0,
      savedProgram: data && data.length > 0 ? data[0] : null,
    }
  } catch (error) {
    console.error('Error checking saved status:', error)
    return { isSaved: false }
  }
}

/**
 * Fetch all saved programs for the current user
 * @param {boolean} useCache - Whether to return cached data immediately (default: true)
 * @returns {Promise<{success: boolean, data?: Array, error?: string, fromCache?: boolean}>}
 */
export async function fetchSavedPrograms(useCache = true) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated', data: [] }
    }

    // Return cached data immediately if available and valid
    if (useCache) {
      const cached = getCachedSavedPrograms()
      if (cached) {
        // Fetch fresh data in the background (fire and forget)
        fetchSavedPrograms(false).then((result) => {
          if (result.success && result.data) {
            cacheSavedPrograms(result.data)
          }
        }).catch(() => {
          // Silently fail background refresh
        })
        return { success: true, data: cached, fromCache: true }
      }
    }

    // Fetch saved programs with joined program/subprogram data
    // Only select fields that are actually used to improve query performance
    const { data, error } = await supabase
      .from('saved_programs')
      .select(`
        id,
        program_id,
        subprogram_id,
        notes,
        created_at,
        programs:program_id (
          id,
          name,
          summary,
          source,
          eligibility,
          funding_amount,
          deadlines,
          contact_email,
          contact_phone,
          application_process,
          sectors,
          slug,
          source_domain,
          created_at
        ),
        subprograms:subprogram_id (
          id,
          name,
          summary,
          source,
          eligibility,
          funding_amount,
          deadlines,
          contact_email,
          contact_phone,
          application_process,
          sectors,
          slug,
          source_domain,
          parent_program_id,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1000) // Limit to prevent huge queries

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    // Transform the data to match the program structure used in the app
    // Filter out saved programs where the program/subprogram was deleted (null foreign keys)
    const transformedData = (data || []).map((saved) => {
      const program = saved.programs || saved.subprograms
      // If program/subprogram was deleted, the foreign key will be null
      // Skip these entries as they're orphaned records
      if (!program) return null

      return {
        savedId: saved.id,
        notes: saved.notes,
        savedAt: saved.created_at,
        isSubprogram: !!saved.subprogram_id,
        ...transformProgramData(program),
      }
    }).filter(Boolean)

    // Cache the fresh data
    cacheSavedPrograms(transformedData)

    return { success: true, data: transformedData, fromCache: false }
  } catch (error) {
    console.error('Error fetching saved programs:', error)
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Transform database program/subprogram data to match app structure
 * @param {Object} program - Program or subprogram from database
 * @returns {Object} Transformed program object
 */
function transformProgramData(program) {
  return {
    id: program.id,
    name: program.name,
    summary: program.summary || '',
    source: program.source,
    eligibility: program.eligibility || '',
    fundingAmount: program.funding_amount || '',
    deadlines: program.deadlines || '',
    contactEmail: program.contact_email || '',
    contactPhone: program.contact_phone || '',
    applicationProcess: program.application_process || '',
    sectors: program.sectors || '',
    slug: program.slug,
    sourceDomain: program.source_domain || '',
    createdAt: program.created_at || null,
  }
}

/**
 * Update notes for a saved program
 * @param {string} savedProgramId - UUID of the saved_programs record
 * @param {string} notes - New notes text
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateSavedProgramNotes(savedProgramId, notes) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('saved_programs')
      .update({ notes })
      .eq('id', savedProgramId)
      .eq('user_id', user.id) // Ensure user can only update their own saved programs

    if (error) {
      return { success: false, error: error.message }
    }

    // Invalidate cache when notes are updated
    clearSavedProgramsCache()

    return { success: true }
  } catch (error) {
    console.error('Error updating saved program notes:', error)
    return { success: false, error: error.message }
  }
}

