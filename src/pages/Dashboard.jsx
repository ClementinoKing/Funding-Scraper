import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { ProgramCard } from '@/components/ProgramCard'
import { SortDropdown } from '@/components/SortDropdown'
import { ViewToggle } from '@/components/ViewToggle'
import { Pagination } from '@/components/Pagination'
import { EmptyState } from '@/components/EmptyState'
import { signOut } from '@/lib/auth'
import { fetchUserProfile } from '@/lib/userProfile'
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  RefreshCw, Percent, Clock, Scale 
} from 'lucide-react'
import { 
  triggerBusinessMatching, 
  checkPendingMatches, 
  getBusinessMatches 
} from '@/lib/triggerMatching';
import { subscribeToBusinessMatches } from '@/lib/realtimeMatching';

export default function Dashboard() {
  const navigate = useNavigate()

  const [matches, setMatches] = useState([]);
    const [pending, setPending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
  

    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('newest')
    const [viewMode, setViewMode] = useState(() => {
      return localStorage.getItem('viewMode') || 'grid'
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [userProfile, setUserProfile] = useState(null)
    const [profileLoading, setProfileLoading] = useState(true)
    const itemsPerPage = 12
  
    const loadMatchStatus = async () => {
      setLoading(true);
      
      // Check pending status
      const pendingResult = await checkPendingMatches(userProfile.business_id);
      setPending(pendingResult.hasPending);
      
      // Load existing matches
      const matchesResult = await getBusinessMatches(userProfile.business_id);
      if (matchesResult.data) {
        setMatches(matchesResult.data);
        console.log("Loaded matches:", matchesResult.data);
        if (matchesResult.data.length > 0) {
          setLastUpdated(matchesResult.data[0].created_at);
        }
      }
      
      setLoading(false);
    };
  
    const triggerMatching = async (useAI = true) => {
      setRefreshing(true);
      const result = await triggerBusinessMatching(userProfile.business_id, useAI);
      console.log("Trigger matching result:", result);
      if (result.success) {
        setPending(true);
        // Wait a moment then refresh
        setTimeout(() => loadMatchStatus(), 500);
      }
      setRefreshing(false);
    };
  
    const matchStats = {
      total: matches.length,
      excellent: matches.filter(m => m.match_score >= 80).length,
      good: matches.filter(m => m.match_score >= 60 && m.match_score < 80).length,
      averageScore: matches.length > 0 
        ? Math.round(matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length)
        : 0,
    };
  
    useEffect(() => {
      if(userProfile?.business_id) {
        (async () => loadMatchStatus())();
        
        // Subscribe to real-time updates
        const unsubscribe = subscribeToBusinessMatches(userProfile.business_id, (update) => {
          if (update.type === 'matching_completed') {
            loadMatchStatus();
          } else {
            setMatches(prev => [update, ...prev]);
          }
        });
    
        return () => unsubscribe();
      }
    }, [userProfile]);

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

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }


  // Pagination
  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return matches.slice(start, start + itemsPerPage)
  }, [matches, currentPage, itemsPerPage])

  const totalPages = Math.ceil(matches.length / itemsPerPage)

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

        <main className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Funding Opportunities</h1>
                <p className="text-muted-foreground">
                  Discover and explore available funding programs
                </p>
              </div>
              <div className="flex items-center gap-2">
                    {pending && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        Processing
                      </Badge>
                    )}
                    <Badge variant={matchStats.total > 0 ? "default" : "secondary"}>
                      {matchStats.total} matches
                    </Badge>
                  </div>
            </div>
            
            <div className='my-2'>
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  <Card className="border-2 hover:border-blue-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Matches
                          </p>
                          <p className="text-2xl font-bold mt-1">{matchStats.total}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-blue-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Excellent
                          </p>
                          <p className="text-2xl font-bold mt-1">{matchStats.excellent}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>


                  <Card className="border-2 hover:border-blue-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Average Score
                          </p>
                          <p className="text-2xl font-bold mt-1">{matchStats.averageScore}%</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-blue-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Last Updated
                          </p>
                          <p className="text-2xl font-bold mt-1">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
            
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

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={() => triggerMatching(true)}
                disabled={pending || refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Matches (AI)
              </Button>
              <Button 
                variant="outline"
                onClick={() => triggerMatching(false)}
                disabled={pending || refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Quick Refresh
              </Button>
              <Button 
                variant="ghost"
                onClick={loadMatchStatus}
                disabled={loading}
              >
                Check Status
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <SortDropdown value={sortBy} onValueChange={setSortBy} className="w-[180px]" />
              <ViewToggle value={viewMode} onValueChange={setViewMode} />
            </div>
          </div>

          {/* Status Message */}
          {pending && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md my-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Matches are being processed. This may take a minute...</span>
            </div>
          )}

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

              {/* Programs Grid/List */}
              {!loading && !profileLoading && (
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
                            totalItems={matches.length}
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

