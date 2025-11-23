import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchPrograms, clearProgramsCache } from '@/lib/programs'

const ProgramsContext = createContext(null)

export function ProgramsProvider({ children }) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)

  const loadPrograms = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
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
  }, [])

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


