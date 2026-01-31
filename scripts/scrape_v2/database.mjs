import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// SOURCE MANAGEMENT
// ============================================

/**
 * Get sources that need scraping
 */
export async function getSourcesToScrape(sourceIds = null) {
  let query = supabase
    .from('scrape_sources')
    .select('*')
    .eq('is_active', true)
    .order('last_scraped_at', { ascending: true, nullsFirst: true })

  if (sourceIds && sourceIds.length > 0) {
    query = query.in('id', sourceIds)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch sources: ${error.message}`)
  }

  return data || []
}

/**
 * Update source last scraped timestamp
 */
export async function updateSourceLastScraped(sourceId) {
  const { error } = await supabase
    .from('scrape_sources')
    .update({ 
      last_scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', sourceId)

  if (error) {
    throw new Error(`Failed to update source: ${error.message}`)
  }
}

/**
 * Add a new scrape source
 */
export async function addSource(sourceData) {
  const { name, base_url, config = {} } = sourceData

  // Extract domain from URL
  let domain = ''
  try {
    const url = new URL(base_url)
    domain = url.hostname.replace('www.', '')
  } catch (error) {
    // Invalid URL
  }

  const { data, error } = await supabase
    .from('scrape_sources')
    .insert([{
      name,
      base_url,
      domain,
      config,
      is_active: true
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add source: ${error.message}`)
  }

  return data
}

// ============================================
// SCRAPE RUN LOGGING
// ============================================

/**
 * Log a scrape run (create or update)
 */
export async function logScrapeRun(runData) {
  if (runData.id) {
    // Update existing run
    const { error } = await supabase
      .from('scrape_runs')
      .update(runData)
      .eq('id', runData.id)

    if (error) {
      throw new Error(`Failed to update scrape run: ${error.message}`)
    }

    return runData.id
  } else {
    // Create new run
    const { data, error } = await supabase
      .from('scrape_runs')
      .insert([runData])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create scrape run: ${error.message}`)
    }

    return data.id
  }
}

/**
 * Get recent scrape runs
 */
export async function getRecentRuns(limit = 50) {
  const { data, error } = await supabase
    .from('scrape_runs')
    .select(`
      *,
      scrape_sources (
        name,
        base_url
      )
    `)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch runs: ${error.message}`)
  }

  return data || []
}

// ============================================
// ITEM MANAGEMENT
// ============================================

/**
 * Insert or update scraped items
 */
export async function insertOrUpdateItems(items, sourceId) {
  if (!items || items.length === 0) {
    return { inserted: 0, updated: 0 }
  }

  let inserted = 0
  let updated = 0

  // Process in batches
  const batchSize = 50

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    for (const item of batch) {
      try {
        // Check if item exists
        const { data: existing } = await supabase
          .from('scraped_items')
          .select('id, content_hash, structured_data')
          .eq('slug', item.slug)
          .maybeSingle()

        const now = new Date().toISOString()

        // Prepare item data
        const itemData = {
          source_id: sourceId,
          url: item.url,
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          content_text: item.content_text,
          content_html: item.content_html,
          content_hash: item.content_hash,
          structured_data: item.structured_data,
          category: item.category,
          tags: item.tags,
          is_active: item.is_active !== undefined ? item.is_active : true,
          is_valid: item.is_valid !== undefined ? item.is_valid : true,
          
          // AI enhancement fields
          ai_enhanced: item.ai_enhanced || false,
          ai_confidence: item.ai_confidence || null,
          program_type: item.program_type || null,
          funding_category: item.funding_category || null,
          age: item.age || null,
          gender: item.gender || null,
          ethnicity: item.ethnicity || null,
          desired_location: item.desired_location || null,
          
          // Extracted fields
          eligibility: item.eligibility || null,
          funding_amount: item.funding_amount || null,
          deadlines: item.deadlines || null,
          contact_email: item.contact_email || null,
          contact_phone: item.contact_phone || null,
          application_process: item.application_process || null
        }

        if (existing) {
          // Check if content has changed
          const contentChanged = existing.content_hash !== item.content_hash

          if (contentChanged) {
            // Update item
            const { error } = await supabase
              .from('scraped_items')
              .update({
                ...itemData,
                last_scraped_at: now,
                last_updated_at: now,
                scrape_count: supabase.raw('scrape_count + 1'),
                updated_at: now
              })
              .eq('id', existing.id)

            if (error) {
              console.error(`Failed to update item ${item.slug}:`, error.message)
            } else {
              updated++
              
              // Log the change
              await logItemChanges(existing.id, existing, item)
            }
          } else {
            // Just update scrape timestamp
            await supabase
              .from('scraped_items')
              .update({
                last_scraped_at: now,
                scrape_count: supabase.raw('scrape_count + 1'),
                updated_at: now
              })
              .eq('id', existing.id)
          }
        } else {
          // Insert new item
          const { error } = await supabase
            .from('scraped_items')
            .insert([{
              ...itemData,
              first_seen_at: now,
              last_scraped_at: now,
              created_at: now,
              updated_at: now
            }])

          if (error) {
            console.error(`Failed to insert item ${item.slug}:`, error.message)
          } else {
            inserted++
          }
        }
      } catch (error) {
        console.error(`Error processing item ${item.slug}:`, error.message)
      }
    }
  }

  return { inserted, updated }
}

/**
 * Log changes to an item
 */
async function logItemChanges(itemId, oldItem, newItem) {
  const changes = []
  const fieldsToTrack = ['title', 'summary', 'content_text', 'structured_data', 'category', 'tags']

  for (const field of fieldsToTrack) {
    const oldValue = oldItem[field]
    const newValue = newItem[field]

    // Compare values (handle JSON fields)
    const oldStr = typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue || '')
    const newStr = typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue || '')

    if (oldStr !== newStr) {
      changes.push({
        item_id: itemId,
        field_name: field,
        old_value: oldStr.slice(0, 5000), // Limit size
        new_value: newStr.slice(0, 5000),
        changed_at: new Date().toISOString()
      })
    }
  }

  if (changes.length > 0) {
    await supabase
      .from('item_changes')
      .insert(changes)
  }
}

/**
 * Get items by source
 */
export async function getItemsBySource(sourceId, options = {}) {
  const { 
    limit = 100, 
    offset = 0,
    activeOnly = true,
    category = null 
  } = options

  let query = supabase
    .from('scraped_items')
    .select('*', { count: 'exact' })
    .eq('source_id', sourceId)
    .order('last_scraped_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch items: ${error.message}`)
  }

  return { items: data || [], total: count || 0 }
}

/**
 * Search items
 */
export async function searchItems(searchTerm, options = {}) {
  const { limit = 50, category = null } = options

  let query = supabase
    .from('scraped_items')
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    .order('last_scraped_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to search items: ${error.message}`)
  }

  return data || []
}

// ============================================
// RELATIONSHIPS
// ============================================

/**
 * Create item relationship (parent-child)
 */
export async function createItemRelationship(parentId, childId, relationshipType = 'subitem') {
  const { error } = await supabase
    .from('item_relationships')
    .insert([{
      parent_item_id: parentId,
      child_item_id: childId,
      relationship_type: relationshipType
    }])

  if (error) {
    throw new Error(`Failed to create relationship: ${error.message}`)
  }
}

/**
 * Get item with children
 */
export async function getItemWithChildren(itemId) {
  // Get main item
  const { data: item, error: itemError } = await supabase
    .from('scraped_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (itemError) {
    throw new Error(`Failed to fetch item: ${itemError.message}`)
  }

  // Get children
  const { data: relationships, error: relError } = await supabase
    .from('item_relationships')
    .select(`
      relationship_type,
      order_position,
      scraped_items!child_item_id (*)
    `)
    .eq('parent_item_id', itemId)
    .order('order_position', { ascending: true })

  if (relError) {
    throw new Error(`Failed to fetch relationships: ${relError.message}`)
  }

  return {
    ...item,
    children: relationships || []
  }
}

// ============================================
// SEARCH QUERIES & DISCOVERY
// ============================================

/**
 * Get configured search queries
 */
export async function getSearchQueries() {
  const { data, error } = await supabase
    .from('search_queries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch search queries: ${error.message}`)
  }

  return data || []
}

/**
 * Add discovered source
 */
export async function addDiscoveredSource(discoveryData) {
  const { error } = await supabase
    .from('discovered_sources')
    .insert([discoveryData])

  if (error) {
    throw new Error(`Failed to add discovered source: ${error.message}`)
  }
}

/**
 * Get pending discovered sources
 */
export async function getPendingDiscoveries(limit = 50) {
  const { data, error } = await supabase
    .from('discovered_sources')
    .select('*')
    .eq('status', 'pending')
    .order('discovered_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch discoveries: ${error.message}`)
  }

  return data || []
}

/**
 * Approve discovered source (convert to scrape_source)
 */
export async function approveDiscoveredSource(discoveryId) {
  // Get the discovered source
  const { data: discovery, error: fetchError } = await supabase
    .from('discovered_sources')
    .select('*')
    .eq('id', discoveryId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch discovery: ${fetchError.message}`)
  }

  // Create scrape source
  const source = await addSource({
    name: discovery.title || discovery.domain,
    base_url: discovery.url,
    config: {}
  })

  // Update discovery status
  await supabase
    .from('discovered_sources')
    .update({ 
      status: 'approved',
      reviewed_at: new Date().toISOString()
    })
    .eq('id', discoveryId)

  return source
}
