import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { ProgramCard } from '@/components/ProgramCard'
import { SortDropdown } from '@/components/SortDropdown'
import { ViewToggle } from '@/components/ViewToggle'
import { Pagination } from '@/components/Pagination'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { signOut } from '@/lib/auth'
import { usePrograms } from '@/contexts/ProgramsContext'
import { fetchUserProfile } from '@/lib/userProfile'
import { scoreAllPrograms, filterQualifiedPrograms } from '@/lib/profileMatching'
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { BusinessMatchingStatus } from '../components/pages/dashboard/BusinessMatchingStatus'

export default function Dashboard() {
  const navigate = useNavigate()

  const { programs, loading, error: contextError } = usePrograms()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'grid'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const itemsPerPage = 12
  const error = contextError || ''

  // Fetch user profile with caching
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setProfileLoading(true)
        const result = await fetchUserProfile(true) // Use cache
        if (result.success) {
          setUserProfile(result.profile)
          console.log("Business Profile",result.profile)
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  // Show qualified programs only when user has a profile
  const showQualifiedOnly = userProfile !== null

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Helper function to check if a deadline is actually specified
  const hasActualDeadline = (deadline) => {
    if (!deadline) return false
    const deadlineLower = deadline.trim().toLowerCase()
    // Check for common "not specified" variations
    return !(
      deadlineLower === 'not specified' ||
      deadlineLower === 'not specified.' ||
      deadlineLower === 'no deadline' ||
      deadlineLower === 'no deadlines' ||
      deadlineLower === 'ongoing' ||
      deadlineLower === 'n/a' ||
      deadlineLower === 'na' ||
      deadlineLower === '' ||
      deadlineLower.length < 3
    )
  }

  // Filter out poorly scraped programs
  const isValidProgram = (p) => {
    const name = (p.name || '').trim()
    const summary = (p.summary || '').trim()
    const eligibility = (p.eligibility || '').trim()
    
    // Filter out programs with HTML/JavaScript code in name
    if (name.includes('<![CDATA[') || name.includes('_spBodyOnLoadFunctionNames') || name.includes('// <!')) {
      return false
    }
    
    // Filter out programs with no meaningful name
    if (!name || name === 'Untitled program' || name.length < 5) {
      return false
    }
    
    // Keep programs that have funding info or actual deadlines (useful data)
    if (p.fundingAmount || hasActualDeadline(p.deadlines)) {
      return true
    }
    
    // Filter out programs with no meaningful content
    const hasNoData = !summary || 
      summary === 'No summary available.' ||
      summary === 'Not specified' ||
      summary.length < 10 ||
      (eligibility === 'Not specified.' || !eligibility)
    
    // Keep programs that have meaningful summary or eligibility
    return !hasNoData
  }

  // Filter out invalid programs and subprograms (subprograms are nested in parent programs)
  const validPrograms = programs.filter(p => {
    // Exclude subprograms (they have parentProgram field and should only appear nested)
    if (p.parentProgram) return false
    return isValidProgram(p)
  })

  // Score programs based on user profile
  const scoredPrograms = useMemo(() => {
    if (profileLoading || validPrograms.length === 0) {
      return []
    }
    if (!userProfile) {
      return validPrograms.map(p => ({ ...p, qualification: null, matchScore: 0 }))
    }
    return scoreAllPrograms(validPrograms, userProfile)
  }, [validPrograms, userProfile, profileLoading])

  // Filter and sort programs - optimized with early returns and cached computations
  const filteredAndSortedPrograms = useMemo(() => {
    // Start with scored programs
    let programsToFilter = scoredPrograms

    // Apply qualification filter if enabled
    if (showQualifiedOnly && userProfile) {
      programsToFilter = filterQualifiedPrograms(programsToFilter, userProfile)
    }

    const searchLower = searchQuery.toLowerCase()
    const hasSearch = searchQuery.length > 0
    
    // Filter programs by search only
    const filtered = []
    for (const p of programsToFilter) {
      // Search filter
      if (hasSearch) {
        const nameMatch = (p.name || '').toLowerCase().includes(searchLower)
        const summaryMatch = (p.summary || '').toLowerCase().includes(searchLower)
        const eligibilityMatch = (p.eligibility || '').toLowerCase().includes(searchLower)
        if (!nameMatch && !summaryMatch && !eligibilityMatch) continue
      }
      
      filtered.push(p)
    }

    // Sort - prioritize match score if showing qualified, then apply user's sort preference
    filtered.sort((a, b) => {
      // If showing qualified only, sort by match score first
      if (showQualifiedOnly && userProfile) {
        const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0)
        if (scoreDiff !== 0) return scoreDiff
      }

      switch (sortBy) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '')
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '')
        case 'oldest':
          return (a.createdAt || 0) - (b.createdAt || 0)
        case 'newest':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0)
      }
    })

    return filtered
  }, [scoredPrograms, searchQuery, sortBy, showQualifiedOnly, userProfile])

  // Pagination
  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedPrograms.slice(start, start + itemsPerPage)
  }, [filteredAndSortedPrograms, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedPrograms.length / itemsPerPage)

  // Calculate statistics based on filtered programs (qualified programs when user has profile)
  const stats = useMemo(() => {
    // Use filteredAndSortedPrograms which already contains only qualified programs when user has profile
    const programsToCount = filteredAndSortedPrograms
    
    // Get unique sources from filtered programs
    const filteredSources = new Set()
    for (const p of programsToCount) {
      if (p.sourceDomain) {
        filteredSources.add(p.sourceDomain)
      }
    }

    return {
      total: programsToCount.length,
      qualified: userProfile ? programsToCount.length : 0,
      withFunding: programsToCount.filter(p => p.fundingAmount).length,
      withDeadlines: programsToCount.filter(p => hasActualDeadline(p.deadlines)).length,
      uniqueSources: filteredSources.size,
    }
  }, [filteredAndSortedPrograms, userProfile])


  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar onLogout={logout} />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <Header 
          onLogout={logout} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {userProfile && (
          <div className="px-4 md:px-6">
            <BusinessMatchingStatus businessId={userProfile.business_id} />
          </div>
        )}

        <main className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Funding Opportunities</h1>
            <p className="text-muted-foreground">
              Discover and explore available funding programs
            </p>
            {!profileLoading && !userProfile && (
              <Card className="mt-4 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium">Complete your profile to see qualified programs</p>
                        <p className="text-xs text-muted-foreground">We'll match funding opportunities based on your business profile</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/account-creation')}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="border-2 hover:border-blue-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {userProfile ? 'Qualified Programs' : 'Total Programs'}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {userProfile && (
              <Card className="border-2 hover:border-emerald-500/50 transition-colors border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Match Score</p>
                      <p className="text-2xl font-bold mt-1">
                        {stats.total > 0 
                          ? Math.round(filteredAndSortedPrograms.reduce((sum, p) => sum + (p.matchScore || 0), 0) / stats.total)
                          : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="border-2 hover:border-green-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">With Funding Info</p>
                    <p className="text-2xl font-bold mt-1">{stats.withFunding}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-orange-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">With Deadlines</p>
                    <p className="text-2xl font-bold mt-1">{stats.withDeadlines}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organizations</p>
                    <p className="text-2xl font-bold mt-1">{stats.uniqueSources}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {userProfile && (
                <Badge variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Sparkles className="w-4 h-4" />
                  Showing Qualified Programs Only
                  <Badge variant="secondary" className="ml-1">
                    {stats.qualified}
                  </Badge>
                </Badge>
              )}
              <SortDropdown value={sortBy} onValueChange={setSortBy} className="w-[180px]" />
              <ViewToggle value={viewMode} onValueChange={setViewMode} />
            </div>
            <div className="text-sm text-muted-foreground">
              {userProfile
                ? `Showing ${filteredAndSortedPrograms.length} qualified program${filteredAndSortedPrograms.length !== 1 ? 's' : ''} out of ${stats.total} total`
                : filteredAndSortedPrograms.length === validPrograms.length 
                  ? `Showing all ${filteredAndSortedPrograms.length} programs`
                  : `Found ${filteredAndSortedPrograms.length} of ${validPrograms.length} programs`}
            </div>
          </div>

          {/* Main Content Area */}
          <div>
            {/* Programs List */}
            <div className="w-full">
              {/* Loading State */}
              {(loading || profileLoading) && (
                <div className={viewMode === 'list' ? 'space-y-4' : 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}>
                  {[...Array(profileLoading && userProfile ? 7 : 6)].map((_, i) => (
                    <Card key={i} className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-4 rounded" />
                        </div>
                        {profileLoading && (
                          <Skeleton className="h-5 w-24 mt-2 rounded-full" />
                        )}
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-4" />
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-14 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-7 w-7 rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && (
                <Card className="border-destructive">
                  <CardContent className="p-6 text-center">
                    <p className="text-destructive font-medium">{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
                  </CardContent>
                </Card>
              )}

              {/* Programs Grid/List */}
              {!loading && !profileLoading && !error && (
                <>
                  {paginatedPrograms.length === 0 ? (
                    <EmptyState
                      icon="search"
                      title={userProfile ? "No qualified opportunities found" : "No opportunities found"}
                      description={userProfile 
                        ? "We couldn't find any programs that match your profile. Try adjusting your search or filter criteria."
                        : "Try adjusting your search or filter criteria"}
                      action={() => {
                        setSearchQuery('')
                      }}
                      actionLabel="Clear search"
                    />
                  ) : (
                    <>
                      <div className={viewMode === 'list' ? 'space-y-4' : 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}>
                        {paginatedPrograms.map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            variant={viewMode === 'list' ? 'list' : 'grid'}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="mt-6">
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={itemsPerPage}
                            totalItems={filteredAndSortedPrograms.length}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

