import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchPrograms, clearProgramsCache } from '@/lib/programs'

const ProgramsContext = createContext(null)

export function ProgramsProvider({ children }) {
  const [programs, setPrograms] = useState(() => {
    // Try to load cached programs immediately for instant display
    try {
      const cached = localStorage.getItem('funding_programs_cache')
      const timestamp = localStorage.getItem('funding_programs_cache_timestamp')
      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp, 10)
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          return JSON.parse(cached)
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
    return []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const loadPrograms = useCallback(async (forceRefresh = false) => {
    try {
      // Only show loading if we don't have cached data
      if (programs.length === 0 || forceRefresh) {
        setLoading(true)
      }
      setError(null)
      const data = await fetchPrograms({ useCache: !forceRefresh, forceRefresh })
      setPrograms(Array.isArray(data) ? data : [])
      setLastFetch(Date.now())
    } catch (e) {
      console.error('Error loading programs:', e)
      setError('Failed to load funding data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [programs.length])

  useEffect(() => {
    loadPrograms()
  }, [loadPrograms])

  const refreshPrograms = useCallback(() => {
    clearProgramsCache()
    return loadPrograms(true)
  }, [loadPrograms])

  return (
    <ProgramsContext.Provider
      value={{
        programs,
        loading,
        error,
        refreshPrograms,
        lastFetch,
      }}
    >
      {children}
    </ProgramsContext.Provider>
  )
}

export function usePrograms() {
  const context = useContext(ProgramsContext)
  if (!context) {
    throw new Error('usePrograms must be used within ProgramsProvider')
  }
  return context
}


