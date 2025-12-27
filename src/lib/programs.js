import { supabase } from './supabase'

const CACHE_KEY = 'funding_programs_cache'
const CACHE_TIMESTAMP_KEY = 'funding_programs_cache_timestamp'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes cache

/**
 * Get cached programs if available and not expired
 * @returns {Array|null} Cached programs or null
 */
function getCachedPrograms() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
    
    if (!cached || !timestamp) return null
    
    const cacheAge = Date.now() - parseInt(timestamp, 10)
    if (cacheAge > CACHE_DURATION_MS) {
      // Cache expired
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
      return null
    }
    
    return JSON.parse(cached)
  } catch {
    return null
  }
}

/**
 * Cache programs in localStorage
 * @param {Array} programs - Programs to cache
 */
function setCachedPrograms(programs) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(programs))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    // localStorage might be full or unavailable, ignore
    console.warn('Failed to cache programs:', error)
  }
}

/**
 * Clear the programs cache
 */
export function clearProgramsCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  } catch {
    // ignore
  }
}

/**
 * Fetch all programs from Supabase with their subprograms
 * Uses caching to improve performance
 * @param {Object} options - Fetch options
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {boolean} options.forceRefresh - Force refresh even if cache exists (default: false)
 * @returns {Promise<Array>} Array of programs with nested subprograms
 */
export async function fetchPrograms(options = {}) {
  const { useCache = true, forceRefresh = false } = options
  
  // Return cached data if available and not forcing refresh
  if (useCache && !forceRefresh) {
    const cached = getCachedPrograms()
    if (cached) {
      // Return cached data immediately, then refresh in background
      refreshProgramsInBackground()
      return cached
    }
  }
  
  try {
    // Fetch active programs with only needed fields for better performance
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id, name, summary, source, eligibility, funding_amount, deadlines, contact_email, contact_phone, application_process, sectors, slug, source_domain, age, gender, ethnicity, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (programsError) {
      throw programsError
    }

    if (!programs || programs.length === 0) {
      setCachedPrograms([])
      return []
    }

    // Fetch all subprograms for these programs (only needed fields)
    const programIds = programs.map(p => p.id)
    const { data: subprograms, error: subprogramsError } = await supabase
      .from('subprograms')
      .select('id, name, summary, source, eligibility, funding_amount, deadlines, contact_email, contact_phone, application_process, sectors, slug, source_domain, parent_program_id, created_at')
      .in('parent_program_id', programIds)
      .order('created_at', { ascending: false })

    if (subprogramsError) {
      console.error('Error fetching subprograms:', subprogramsError)
      // Continue without subprograms if there's an error
    }

    // Transform database fields to match the JSON structure
    const transformProgram = (program) => {
      const programSubprograms = (subprograms || [])
        .filter(sp => sp.parent_program_id === program.id)
        .map(transformSubprogram)

      // Pre-compute source domain to avoid repeated URL parsing
      let sourceDomain = program.source_domain || ''
      if (!sourceDomain && program.source) {
        try {
          sourceDomain = new URL(program.source).hostname.replace('www.', '')
        } catch {
          sourceDomain = ''
        }
      }

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
        sourceDomain,
        age: program.age || null,
        gender: program.gender || null,
        ethnicity: program.ethnicity || null,
        createdAt: program.created_at || null,
        subprograms: programSubprograms,
        // Keep original fields for compatibility
        parentProgram: null, // Programs don't have parent programs
      }
    }

    const transformSubprogram = (subprogram) => {
      return {
        id: subprogram.id,
        name: subprogram.name,
        summary: subprogram.summary || '',
        source: subprogram.source,
        eligibility: subprogram.eligibility || '',
        fundingAmount: subprogram.funding_amount || '',
        deadlines: subprogram.deadlines || '',
        contactEmail: subprogram.contact_email || '',
        contactPhone: subprogram.contact_phone || '',
        applicationProcess: subprogram.application_process || '',
        sectors: subprogram.sectors || '',
        slug: subprogram.slug,
        sourceDomain: subprogram.source_domain || '',
      }
    }

    // Transform all programs
    const transformedPrograms = programs.map(transformProgram)
    
    // Cache the results
    setCachedPrograms(transformedPrograms)
    
    return transformedPrograms
  } catch (error) {
    console.error('Error fetching programs:', error)
    // Return cached data if available, even if expired
    const cached = getCachedPrograms()
    if (cached) {
      console.warn('Using stale cache due to fetch error')
      return cached
    }
    throw error
  }
}

/**
 * Refresh programs in the background without blocking
 */
async function refreshProgramsInBackground() {
  try {
    await fetchPrograms({ useCache: false, forceRefresh: true })
  } catch (error) {
    // Silently fail - we already have cached data
    console.warn('Background refresh failed:', error)
  }
}

/**
 * Fetch a single program by slug
 * @param {string} slug - The program slug
 * @returns {Promise<Object|null>} The program with nested subprograms or null
 */
export async function fetchProgramBySlug(slug) {
  try {
    const { data: program, error } = await supabase
      .from('programs')
      .select('id, name, summary, source, eligibility, funding_amount, deadlines, contact_email, contact_phone, application_process, sectors, slug, source_domain, age, gender, ethnicity, created_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw error
    }

    if (!program) {
      return null
    }

    // Fetch subprograms for this program
    const { data: subprograms, error: subprogramsError } = await supabase
      .from('subprograms')
      .select('*')
      .eq('parent_program_id', program.id)
      .order('created_at', { ascending: false })

    if (subprogramsError) {
      console.error('Error fetching subprograms:', subprogramsError)
    }

    // Transform to match JSON structure
    const programSubprograms = (subprograms || []).map(sp => ({
      id: sp.id,
      name: sp.name,
      summary: sp.summary || '',
      source: sp.source,
      eligibility: sp.eligibility || '',
      fundingAmount: sp.funding_amount || '',
      deadlines: sp.deadlines || '',
      contactEmail: sp.contact_email || '',
      contactPhone: sp.contact_phone || '',
      applicationProcess: sp.application_process || '',
      sectors: sp.sectors || '',
      slug: sp.slug,
      sourceDomain: sp.source_domain || '',
    }))

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
      age: program.age || null,
      gender: program.gender || null,
      ethnicity: program.ethnicity || null,
      subprograms: programSubprograms,
      parentProgram: null,
    }
  } catch (error) {
    console.error('Error fetching program by slug:', error)
    throw error
  }
}

/**
 * Fetch a subprogram by parent slug and subprogram slug
 * @param {string} parentSlug - The parent program slug
 * @param {string} subprogramSlug - The subprogram slug
 * @returns {Promise<Object|null>} Object with parentProgram and subprogram, or null
 */
export async function fetchSubprogramBySlugs(parentSlug, subprogramSlug) {
  try {
    // First fetch the parent program
    const { data: parentProgram, error: parentError } = await supabase
      .from('programs')
      .select('id, name, summary, source, eligibility, funding_amount, deadlines, contact_email, contact_phone, application_process, sectors, slug, source_domain, age, gender, ethnicity, created_at')
      .eq('slug', parentSlug)
      .eq('is_active', true)
      .single()

    if (parentError || !parentProgram) {
      return null
    }

    // Then fetch the subprogram
    const { data: subprogram, error: subprogramError } = await supabase
      .from('subprograms')
      .select('*')
      .eq('parent_program_id', parentProgram.id)
      .eq('slug', subprogramSlug)
      .single()

    if (subprogramError || !subprogram) {
      return null
    }

    // Transform parent program
    const transformedParent = {
      id: parentProgram.id,
      name: parentProgram.name,
      summary: parentProgram.summary || '',
      source: parentProgram.source,
      eligibility: parentProgram.eligibility || '',
      fundingAmount: parentProgram.funding_amount || '',
      deadlines: parentProgram.deadlines || '',
      contactEmail: parentProgram.contact_email || '',
      contactPhone: parentProgram.contact_phone || '',
      applicationProcess: parentProgram.application_process || '',
      sectors: parentProgram.sectors || '',
      slug: parentProgram.slug,
      sourceDomain: parentProgram.source_domain || '',
      age: parentProgram.age || null,
      gender: parentProgram.gender || null,
      ethnicity: parentProgram.ethnicity || null,
    }

    // Transform subprogram
    const transformedSubprogram = {
      id: subprogram.id,
      name: subprogram.name,
      summary: subprogram.summary || '',
      source: subprogram.source,
      eligibility: subprogram.eligibility || '',
      fundingAmount: subprogram.funding_amount || '',
      deadlines: subprogram.deadlines || '',
      contactEmail: subprogram.contact_email || '',
      contactPhone: subprogram.contact_phone || '',
      applicationProcess: subprogram.application_process || '',
      sectors: subprogram.sectors || '',
      slug: subprogram.slug,
      sourceDomain: subprogram.source_domain || '',
    }

    return {
      parentProgram: transformedParent,
      subprogram: transformedSubprogram,
    }
  } catch (error) {
    console.error('Error fetching subprogram by slugs:', error)
    throw error
  }
}

