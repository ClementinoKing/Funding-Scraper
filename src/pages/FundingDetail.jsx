import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { slugifyFunding, cn } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { usePrograms } from '@/contexts/ProgramsContext'
import { saveProgram, unsaveProgram, checkSavedStatus } from '@/lib/savedPrograms'
import { fetchUserProfile } from '@/lib/userProfile'
import { checkProgramQualification, filterQualifiedPrograms } from '@/lib/profileMatching'
import { CircularProgress } from '@/components/CircularProgress'
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  DollarSign,
  Building2,
  FileText,
  Bookmark,
  BookmarkCheck,
  Share2,
  Copy,
  CheckCircle2,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react'

export default function FundingDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { programs, loading, error: contextError } = usePrograms()
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const error = contextError || ''

  // Fetch user profile with caching
  useEffect(() => {
    async function loadUserProfile() {
      try {
        setProfileLoading(true)
        const result = await fetchUserProfile(true) // Use cache
        if (result.success) {
          setUserProfile(result.profile)
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

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
    
    // Keep programs that have funding info or deadlines (useful data)
    if (p.fundingAmount || p.deadlines) {
      return true
    }
    
    // Filter out programs with no meaningful content
    const hasNoData = !summary || 
      summary === 'No summary available.' ||
      summary.length < 10 ||
      (eligibility === 'Not specified.' || !eligibility)
    
    // Keep programs that have meaningful summary or eligibility
    return !hasNoData
  }

  const program = useMemo(() => {
    if (!slug || programs.length === 0) return null
    // Try to match by database slug first, then fall back to slugifyFunding
    const found = programs.find((p) => 
      p.slug === slug || slugifyFunding(p.name, p.source) === slug
    )
    // Return null if program is invalid (poorly scraped)
    return found && isValidProgram(found) ? found : null
  }, [slug, programs])

  // Check saved status when program is loaded
  useEffect(() => {
    if (program?.id) {
      checkSavedStatus(program.id, null)
        .then(({ isSaved: saved }) => {
          setIsSaved(saved)
        })
        .catch(() => {
          setIsSaved(false)
        })
    }
  }, [program?.id])

  // Handle save/unsave
  async function handleSaveToggle() {
    if (!program?.id) return

    setIsSaving(true)
    try {
      if (isSaved) {
        const result = await unsaveProgram(program.id, null)
        if (result.success) {
          setIsSaved(false)
        }
      } else {
        const result = await saveProgram(program.id, null)
        if (result.success) {
          setIsSaved(true)
        } else if (result.error !== 'Program is already saved') {
          console.error('Error saving program:', result.error)
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate match score for current program
  const programQualification = useMemo(() => {
    if (!program || !userProfile) return null
    return checkProgramQualification(program, userProfile)
  }, [program, userProfile])

  const siblingPrograms = useMemo(() => {
    if (!program || !program.source) return []
    let host = ''
    try {
      host = new URL(program.source).host
    } catch {}
    if (!host) return []
    
    // Get programs from same source
    let relatedPrograms = programs.filter((p) => {
      if (!p?.source || p === program) return false
      if (!isValidProgram(p)) return false
      // Exclude subprograms (they have parentProgram field)
      if (p.parentProgram) return false
      try {
        return new URL(p.source).host === host
      } catch {
        return false
      }
    })

    // If user has a profile, filter to only show matched programs
    if (userProfile) {
      const qualifiedPrograms = filterQualifiedPrograms(relatedPrograms, userProfile)
      return qualifiedPrograms.slice(0, 5)
    }
    
    return relatedPrograms.slice(0, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, programs, userProfile])

  const sourceDomain = program?.source ? (() => {
    try {
      return new URL(program.source).hostname.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  })() : 'Unknown'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-red-200 dark:border-red-900">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Program not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The requested funding opportunity could not be located.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Bar */}
        <div className="mb-8 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyLink}
              className="gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={handleSaveToggle}
              disabled={isSaving || !program?.id}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                </>
              )}
            </Button>
            {program.source && (
              <a href={program.source} target="_blank" rel="noreferrer">
                <Button size="sm" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Apply
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{sourceDomain}</p>
                      {profileLoading ? (
                        <Skeleton className="h-5 w-24 mt-1" />
                      ) : (
                        programQualification && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={programQualification.qualifies ? "default" : "secondary"}
                              className="gap-1.5 text-xs"
                            >
                              <Sparkles className="w-3 h-3" />
                              {programQualification.score}% Match
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight leading-tight">
                    {program.name || 'Untitled program'}
                  </h1>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-8">
                {/* Overview */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Overview</h2>
                  </div>
                  <div className="pl-10">
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {program.summary || 'No summary available.'}
                    </p>
                  </div>
                </section>

                <Separator className="my-8" />

                {/* Eligibility */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Eligibility Criteria</h2>
                  </div>
                  <div className="pl-10">
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {program.eligibility || 'Not specified.'}
                    </p>
                  </div>
                </section>

                {/* Funding Amount */}
                {program.fundingAmount && (
                  <>
                    <Separator className="my-8" />
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Funding Amount</h2>
                      </div>
                      <div className="pl-10">
                        {program.fundingAmount.includes(';') ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(() => {
                              // Function to format numbers with commas
                              const formatAmount = (amountStr) => {
                                // Replace numbers (including decimals) with comma-formatted versions
                                return amountStr.replace(/(\d+\.?\d*)/g, (match) => {
                                  // Skip if already has commas
                                  if (match.includes(',')) return match
                                  
                                  // Split by decimal point
                                  const parts = match.split('.')
                                  const integerPart = parts[0]
                                  
                                  // Add commas to integer part
                                  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                  
                                  // Rejoin with decimal part if exists
                                  return parts.length > 1 ? `${formattedInteger}.${parts[1]}` : formattedInteger
                                })
                              }
                              
                              // Parse and sort amounts from highest to lowest
                              const amounts = program.fundingAmount
                                .split(';')
                                .map((amount) => amount.trim())
                                .filter((amount) => amount.length > 0)
                              
                              // Function to convert amount string to numeric value for sorting
                              const parseAmount = (amountStr) => {
                                const cleanStr = amountStr.toLowerCase().replace(/[r,\s]/g, '')
                                
                                // Extract number and multiplier
                                const billionMatch = cleanStr.match(/([\d.]+)\s*billion/i)
                                const millionMatch = cleanStr.match(/([\d.]+)\s*million/i)
                                const thousandMatch = cleanStr.match(/([\d.]+)\s*thousand/i)
                                
                                if (billionMatch) {
                                  return parseFloat(billionMatch[1]) * 1000000000
                                } else if (millionMatch) {
                                  return parseFloat(millionMatch[1]) * 1000000
                                } else if (thousandMatch) {
                                  return parseFloat(thousandMatch[1]) * 1000
                                } else {
                                  // Try to extract just the number
                                  const numberMatch = cleanStr.match(/([\d.]+)/)
                                  if (numberMatch) {
                                    const num = parseFloat(numberMatch[1])
                                    // If it's a large number without suffix, assume it's already in base units
                                    return num >= 1000000 ? num : num * 1000000
                                  }
                                  return 0
                                }
                              }
                              
                              // Sort amounts from highest to lowest
                              const sortedAmounts = amounts.sort((a, b) => {
                                const valueA = parseAmount(a)
                                const valueB = parseAmount(b)
                                return valueB - valueA // Descending order
                              })
                              
                              return sortedAmounts.map((amount, index) => {
                                const formattedAmount = formatAmount(amount)
                                return (
                                  <div 
                                    key={index} 
                                    className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-border"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 flex-shrink-0"></div>
                                    <span className="text-sm leading-relaxed text-foreground font-medium">
                                      {formattedAmount}
                                    </span>
                                  </div>
                                )
                              })
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed text-foreground">
                            {program.fundingAmount.includes(',') ? program.fundingAmount : program.fundingAmount.replace(/(\d+\.?\d*)/g, (match) => {
                              if (match.includes(',')) return match
                              const parts = match.split('.')
                              const formattedInteger = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                              return parts.length > 1 ? `${formattedInteger}.${parts[1]}` : formattedInteger
                            })}
                          </p>
                        )}
                      </div>
                    </section>
                  </>
                )}

                {/* Deadline */}
                {program.deadlines && (
                  <>
                    <Separator className="my-8" />
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Deadline</h2>
                      </div>
                      <div className="pl-10">
                        <p className="text-sm leading-relaxed text-foreground">
                          {program.deadlines}
                        </p>
                      </div>
                    </section>
                  </>
                )}

                {/* Source */}
                {program.source && (
                  <>
                    <Separator className="my-8" />
                    <section className="space-y-3">
                      <h2 className="text-lg font-semibold">Source</h2>
                      <div className="pl-0 flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="text-sm py-2 px-4 font-mono">
                          {program.source.replace(/^https?:\/\//, '')}
                        </Badge>
                        <a href={program.source} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="w-4 h-4" /> View Source
                          </Button>
                        </a>
                      </div>
                    </section>
                  </>
                )}

                {/* Subprograms */}
                {program.subprograms && program.subprograms.length > 0 && (
                  <>
                    <Separator className="my-8" />
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Subprograms</h2>
                      </div>
                      <div className="pl-10 space-y-3">
                        {program.subprograms.map((subprogram, idx) => (
                          <Card key={idx} className="border-l-4 border-l-purple-500 hover:shadow-md transition-all">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0 space-y-2">
                                  <h3 className="font-semibold text-base leading-tight">{subprogram.name}</h3>
                                  {subprogram.summary && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                      {subprogram.summary}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {subprogram.fundingAmount && (
                                      <Badge variant="outline" className="gap-1.5 text-xs">
                                        <DollarSign className="w-3 h-3" />
                                        {subprogram.fundingAmount}
                                      </Badge>
                                    )}
                                    {subprogram.deadlines && (
                                      <Badge variant="outline" className="gap-1.5 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        {subprogram.deadlines}
                                      </Badge>
                                    )}
                                    {subprogram.sectors && (
                                      <Badge variant="outline" className="text-xs">
                                        {subprogram.sectors}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {subprogram.source && (
                                  <Link
                                    to={`/funding/${slug}/subprogram/${subprogram.slug || slugifyFunding(subprogram.name, subprogram.source)}`}
                                    className="flex-shrink-0"
                                  >
                                    <Button size="sm" variant="outline">
                                      View Details
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Match Score */}
            {profileLoading ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <Skeleton className="h-40 w-40 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : programQualification && userProfile ? (
              <Card className="shadow-sm sticky top-8">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Match Score</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    How well this program matches your profile
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Circular Progress */}
                  <div className="flex justify-center py-2">
                    <CircularProgress 
                      value={programQualification.score} 
                      size={160}
                      strokeWidth={10}
                    />
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold mb-3 text-foreground">Score Breakdown</h3>
                    {programQualification.breakdown && programQualification.breakdown.length > 0 ? (
                      (() => {
                        const matchedItems = programQualification.breakdown.filter(item => item.points > 0)
                        return matchedItems.length > 0 ? (
                          <div className="space-y-1.5">
                            {matchedItems.map((item, index) => {
                              return (
                                <div 
                                  key={index}
                                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    {item.partial ? (
                                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    )}
                                    <span className="text-sm text-foreground truncate font-medium">
                                      {item.criterion}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={cn(
                                      "text-sm font-semibold tabular-nums",
                                      item.partial 
                                        ? "text-yellow-600 dark:text-yellow-400"
                                        : "text-green-600 dark:text-green-400"
                                    )}>
                                      {item.points}/{item.maxPoints}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            No matches found
                          </p>
                        )
                      })()
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No breakdown available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Related Programs */}
            {profileLoading ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                          <Skeleton className="h-5 w-12 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ) : siblingPrograms.length > 0 ? (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Related Programs</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userProfile 
                      ? "Matched programs from the same organization"
                      : "From the same organization"
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {siblingPrograms.map((p, i) => (
                      <li key={`sib-${i}`}>
                        <Link
                          className="block p-3 rounded-lg hover:bg-accent transition-colors group border border-transparent hover:border-border"
                          to={`/funding/${p.slug || slugifyFunding(p.name, p.source)}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {p.name || 'Untitled program'}
                              </p>
                              {p.fundingAmount && (
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
                                  {p.fundingAmount}
                                </p>
                              )}
                            </div>
                            {p.matchScore !== undefined && (
                              <Badge variant="outline" className="flex-shrink-0 gap-1 ml-2">
                                <Sparkles className="w-3 h-3" />
                                {p.matchScore}%
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => navigate('/dashboard')}
                  >
                    View All Programs
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}


