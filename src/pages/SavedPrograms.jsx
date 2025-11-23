import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ProgramCard } from '@/components/ProgramCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/auth'
import { fetchSavedPrograms, unsaveProgram } from '@/lib/savedPrograms'
import { Bookmark } from 'lucide-react'

export default function SavedPrograms() {
  const navigate = useNavigate()
  const [savedPrograms, setSavedPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSavedPrograms()
  }, [])

  async function loadSavedPrograms() {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchSavedPrograms()
      if (result.success) {
        setSavedPrograms(result.data || [])
      } else {
        setError(result.error || 'Failed to load saved programs')
      }
    } catch (err) {
      setError(err.message || 'Failed to load saved programs')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsave(savedId, programId, subprogramId) {
    try {
      const result = await unsaveProgram(programId, subprogramId)
      if (result.success) {
        // Remove from local state
        setSavedPrograms(prev => prev.filter(p => p.savedId !== savedId))
      } else {
        console.error('Error unsaving program:', result.error)
      }
    } catch (err) {
      console.error('Error unsaving program:', err)
    }
  }

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar onLogout={logout} />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <Header onLogout={logout} />
        <main className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
          <Breadcrumbs items={[{ label: 'Saved Programs' }]} className="mb-6" />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Saved Programs</h1>
            <p className="text-muted-foreground">
              Your saved funding opportunities
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <EmptyState
              icon="error"
              title="Error loading saved programs"
              description={error}
              action={loadSavedPrograms}
              actionLabel="Try Again"
            />
          ) : savedPrograms.length === 0 ? (
            <EmptyState
              icon="saved"
              title="No saved programs"
              description="Start saving programs you're interested in to see them here."
              action={() => navigate('/dashboard')}
              actionLabel="Browse Programs"
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {savedPrograms.map((program) => (
                <ProgramCard
                  key={program.savedId}
                  program={program}
                  variant="grid"
                  isSubprogram={program.isSubprogram}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

