import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { existsSync } from 'node:fs'

// Load environment variables from .env file
// Use process.cwd() which is the project root when running via npm scripts
const envPath = path.resolve(process.cwd(), '.env')

// Load .env file
const result = config({ path: envPath })

if (result.error) {
  console.warn('[db] Warning: Could not load .env file:', result.error.message)
  console.warn('[db] Attempted path:', envPath)
}

// Try to load from process.env (Vite prefixes with VITE_)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[db] Environment variables not found:')
  console.error('[db] VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'found' : 'missing')
  console.error('[db] VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'found' : 'missing')
  console.error('[db] .env file path:', envPath)
  console.error('[db] .env file exists:', existsSync(envPath))
  console.error('[db] Current working directory:', process.cwd())
  throw new Error('Missing Supabase environment variables. Please check .env file.')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Generate slug from name and source (same logic as slugifyFunding)
 */
export function generateSlug(name = '', source = '') {
  const base = `${name} ${source}`.toLowerCase()
  return base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'program'
}

/**
 * Extract domain from source URL
 */
export function extractDomain(source) {
  if (!source) return ''
  try {
    const url = new URL(source)
    return url.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

/**
 * Transform program data from JSON structure to database schema
 */
function transformProgram(program) {
  return {
    name: program.name || '',
    summary: program.summary || null,
    source: program.source || '',
    eligibility: program.eligibility || null,
    funding_amount: program.fundingAmount || null,
    deadlines: program.deadlines || null,
    contact_email: program.contactEmail || null,
    contact_phone: program.contactPhone || null,
    application_process: program.applicationProcess || null,
    sectors: program.sectors || null,
    slug: program.slug || generateSlug(program.name, program.source),
    source_domain: extractDomain(program.source),
    is_active: true,
    last_scraped_at: new Date().toISOString(),
  }
}

/**
 * Transform subprogram data from JSON structure to database schema
 */
function transformSubprogram(subprogram, parentProgramId) {
  return {
    parent_program_id: parentProgramId,
    name: subprogram.name || '',
    summary: subprogram.summary || null,
    source: subprogram.source || '',
    eligibility: subprogram.eligibility || null,
    funding_amount: subprogram.fundingAmount || null,
    deadlines: subprogram.deadlines || null,
    contact_email: subprogram.contactEmail || null,
    contact_phone: subprogram.contactPhone || null,
    application_process: subprogram.applicationProcess || null,
    sectors: subprogram.sectors || null,
    slug: subprogram.slug || generateSlug(subprogram.name, subprogram.source),
    source_domain: extractDomain(subprogram.source),
  }
}

/**
 * Insert or update programs in the database
 * Returns a map of slug -> program_id for linking subprograms
 */
export async function insertPrograms(programs) {
  if (!programs || programs.length === 0) {
    return new Map()
  }

  const programMap = new Map() // slug -> program_id
  const errors = []

  // Process programs in larger batches for speed
  const batchSize = 100
  for (let i = 0; i < programs.length; i += batchSize) {
    const batch = programs.slice(i, i + batchSize)
    
    try {
      const transformedBatch = batch.map(transformProgram)
      
      // Upsert programs based on slug
      const { data, error } = await supabase
        .from('programs')
        .upsert(transformedBatch, {
          onConflict: 'slug',
          ignoreDuplicates: false,
        })
        .select('id, slug')

      if (error) {
        console.error(`[db] Error inserting programs batch ${i / batchSize + 1}:`, error.message)
        errors.push(error)
        continue
      }

      // Build map of slug -> id
      if (data) {
        for (const program of data) {
          programMap.set(program.slug, program.id)
        }
      }

      console.log(`[db] Upserted ${transformedBatch.length} programs (batch ${i / batchSize + 1})`)
    } catch (err) {
      console.error(`[db] Exception inserting programs batch ${i / batchSize + 1}:`, err.message)
      errors.push(err)
    }
  }

  // If we have errors but some programs were inserted, try to fetch IDs for the ones we have
  if (errors.length > 0 && programMap.size < programs.length) {
    try {
      const slugs = programs.map(p => p.slug || generateSlug(p.name, p.source))
      const { data, error } = await supabase
        .from('programs')
        .select('id, slug')
        .in('slug', slugs)

      if (!error && data) {
        for (const program of data) {
          programMap.set(program.slug, program.id)
        }
      }
    } catch (err) {
      console.error('[db] Error fetching program IDs:', err.message)
    }
  }

  return programMap
}

/**
 * Insert or update subprograms in the database
 * subprograms: array of subprogram objects with parentProgram and parentSource fields
 * programMap: Map of slug -> program_id
 */
export async function insertSubprograms(subprograms, programMap) {
  if (!subprograms || subprograms.length === 0) {
    return { inserted: 0, errors: [] }
  }

  const errors = []
  let inserted = 0

  // Group subprograms by parent
  const subprogramsByParent = new Map()
  
  for (const subprogram of subprograms) {
    // Find parent program ID by generating slug from parentProgram and parentSource
    const parentSlug = generateSlug(subprogram.parentProgram || '', subprogram.parentSource || '')
    let parentId = programMap.get(parentSlug)
    
    if (!parentId) {
      // Try to find by querying the database
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('id')
          .eq('slug', parentSlug)
          .maybeSingle()
        
        if (!error && data) {
          parentId = data.id
          programMap.set(parentSlug, parentId) // Cache it
        }
      } catch (err) {
        // Ignore
      }
    }
    
    if (!parentId) {
      console.warn(`[db] Parent program not found for subprogram: ${subprogram.name} (parent: ${subprogram.parentProgram})`)
      continue
    }

    if (!subprogramsByParent.has(parentId)) {
      subprogramsByParent.set(parentId, [])
    }
    
    // Deduplicate by slug within each parent group
    const subSlug = subprogram.slug || generateSlug(subprogram.name, subprogram.source)
    const existingSubs = subprogramsByParent.get(parentId)
    const isDuplicate = existingSubs.some(existing => {
      const existingSlug = existing.slug || generateSlug(existing.name, existing.source)
      return existingSlug === subSlug
    })
    
    if (!isDuplicate) {
      subprogramsByParent.get(parentId).push(subprogram)
    } else {
      console.warn(`[db] Skipping duplicate subprogram: ${subprogram.name} (slug: ${subSlug}) for parent ${parentId}`)
    }
  }

  // Insert subprograms in batches
  // Strategy: For each parent, delete existing subprograms and insert new ones
  // This is simpler and avoids complex conflict resolution
  const batchSize = 100
  for (const [parentId, subs] of subprogramsByParent) {
    try {
      // Delete existing subprograms for this parent
      const { error: deleteError } = await supabase
        .from('subprograms')
        .delete()
        .eq('parent_program_id', parentId)

      if (deleteError) {
        console.warn(`[db] Error deleting existing subprograms for parent ${parentId}:`, deleteError.message)
        // Continue anyway - we'll try to insert and handle conflicts
      }

      // Insert new subprograms in batches
      for (let i = 0; i < subs.length; i += batchSize) {
        const batch = subs.slice(i, i + batchSize)
        
        // Deduplicate batch by slug to prevent duplicate key errors
        const seenSlugs = new Set()
        const uniqueBatch = batch.filter(sub => {
          const subSlug = sub.slug || generateSlug(sub.name, sub.source)
          if (seenSlugs.has(subSlug)) {
            return false
          }
          seenSlugs.add(subSlug)
          return true
        })
        
        if (uniqueBatch.length === 0) {
          continue
        }
        
        const transformedBatch = uniqueBatch.map(sub => transformSubprogram(sub, parentId))
        
        const { data, error } = await supabase
          .from('subprograms')
          .insert(transformedBatch)
          .select()

        if (error) {
          console.error(`[db] Error inserting subprograms batch for parent ${parentId}:`, error.message)
          errors.push(error)
          continue
        }

        inserted += transformedBatch.length
      }

      console.log(`[db] Upserted ${subs.length} subprograms for parent ${parentId}`)
    } catch (err) {
      console.error(`[db] Exception processing subprograms for parent ${parentId}:`, err.message)
      errors.push(err)
    }
  }

  return { inserted, errors }
}

/**
 * Log scrape run to scrape_logs table
 */
export async function logScrapeRun({
  sourceUrl,
  sourceName,
  programsFound = 0,
  subprogramsFound = 0,
  status = 'success',
  errorMessage = null,
  durationSeconds = null,
  startedAt = null,
  completedAt = null,
}) {
  try {
    // source_url is NOT NULL in database, so provide a default placeholder if not given
    // Use a placeholder URL format that indicates it's a site name rather than actual URL
    const finalSourceUrl = sourceUrl || `placeholder://${(sourceName || 'unknown').toLowerCase().replace(/\s+/g, '-')}`
    
    const logData = {
      source_url: finalSourceUrl,
      source_name: sourceName || 'Unknown',
      programs_found: programsFound,
      subprograms_found: subprogramsFound,
      status,
      error_message: errorMessage,
      duration_seconds: durationSeconds ? Math.round(durationSeconds) : null,
      started_at: startedAt || new Date().toISOString(),
      completed_at: completedAt || new Date().toISOString(),
    }

    const { error } = await supabase
      .from('scrape_logs')
      .insert([logData])

    if (error) {
      console.error('[db] Error logging scrape run:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('[db] Exception logging scrape run:', err.message)
    return false
  }
}

/**
 * Insert all programs and subprograms into database
 * Returns summary of insertion results
 * organizedPrograms: array of programs (some may have nested subprograms)
 * subprogramsList: array of standalone subprograms with parentProgram/parentSource fields
 */
export async function insertScrapedData(organizedPrograms, subprogramsList = []) {
  const startTime = Date.now()
  const summary = {
    programsInserted: 0,
    subprogramsInserted: 0,
    errors: [],
  }

  try {
    console.log('[db] Starting database insertion...')
    
    // First, ensure all programs have slugs
    for (const program of organizedPrograms) {
      if (!program.slug) {
        program.slug = generateSlug(program.name, program.source)
      }
    }

    // Insert programs first
    const programMap = await insertPrograms(organizedPrograms)
    summary.programsInserted = programMap.size

    // Extract subprograms from organized programs (nested subprograms)
    const allSubprograms = []
    
    // Get subprograms from organized programs
    // These subprograms are nested in parent programs, so we need to link them to their parents
    // Extract ALL nested subprograms - let insertSubprograms handle parent lookup
    for (const program of organizedPrograms) {
      if (program.subprograms && program.subprograms.length > 0) {
        for (const subprogram of program.subprograms) {
          if (!subprogram.slug) {
            subprogram.slug = generateSlug(subprogram.name, subprogram.source)
          }
          // Add parent information so insertSubprograms can find the parent
          allSubprograms.push({
            ...subprogram,
            parentProgram: program.name,
            parentSource: program.source,
          })
        }
      }
    }

    // Add standalone subprograms (those that were in subprogramsList)
    for (const subprogram of subprogramsList) {
      if (!subprogram.slug) {
        subprogram.slug = generateSlug(subprogram.name, subprogram.source)
      }
      allSubprograms.push(subprogram)
    }

    // Insert subprograms
    const subprogramResult = await insertSubprograms(allSubprograms, programMap)
    summary.subprogramsInserted = subprogramResult.inserted
    summary.errors.push(...subprogramResult.errors)

    const duration = (Date.now() - startTime) / 1000
    console.log(`[db] Database insertion completed in ${duration.toFixed(1)}s`)
    console.log(`[db] Programs: ${summary.programsInserted}, Subprograms: ${summary.subprogramsInserted}`)

    return summary
  } catch (err) {
    console.error('[db] Fatal error during database insertion:', err.message)
    summary.errors.push(err)
    return summary
  }
}

