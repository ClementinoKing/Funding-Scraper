import { supabase } from './supabase'

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
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function fetchSavedPrograms() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated', data: [] }
    }

    // Fetch saved programs with joined program/subprogram data
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

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    // Transform the data to match the program structure used in the app
    const transformedData = (data || []).map((saved) => {
      const program = saved.programs || saved.subprograms
      if (!program) return null

      return {
        savedId: saved.id,
        notes: saved.notes,
        savedAt: saved.created_at,
        isSubprogram: !!saved.subprogram_id,
        ...transformProgramData(program),
      }
    }).filter(Boolean)

    return { success: true, data: transformedData }
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

    return { success: true }
  } catch (error) {
    console.error('Error updating saved program notes:', error)
    return { success: false, error: error.message }
  }
}

