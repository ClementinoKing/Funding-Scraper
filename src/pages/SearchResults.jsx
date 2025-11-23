import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useNavigate } from 'react-router-dom'
import { signOut } from '@/lib/auth'
import { Search } from 'lucide-react'

export default function SearchResults() {
  const navigate = useNavigate()
  const [results] = useState([]) // TODO: Implement search functionality

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
          <Breadcrumbs items={[{ label: 'Search Results' }]} className="mb-6" />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Search Results</h1>
            <p className="text-muted-foreground">
              {results.length > 0 ? `Found ${results.length} results` : 'No results found'}
            </p>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon="search"
              title="No results found"
              description="Try adjusting your search terms or filters."
              action={() => navigate('/dashboard')}
              actionLabel="Browse All Programs"
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* TODO: Render search results */}
            </div>
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

