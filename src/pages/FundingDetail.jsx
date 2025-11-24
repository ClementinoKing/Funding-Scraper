import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { slugifyFunding } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { usePrograms } from '@/contexts/ProgramsContext'
import { saveProgram, unsaveProgram, checkSavedStatus } from '@/lib/savedPrograms'
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
} from 'lucide-react'

export default function FundingDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { programs, loading, error: contextError } = usePrograms()
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const error = contextError || ''

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

  const siblingPrograms = useMemo(() => {
    if (!program || !program.source) return []
    let host = ''
    try {
      host = new URL(program.source).host
    } catch {}
    if (!host) return []
    return programs.filter((p) => {
      if (!p?.source || p === program) return false
      if (!isValidProgram(p)) return false
      // Exclude subprograms (they have parentProgram field)
      if (p.parentProgram) return false
      try {
        return new URL(p.source).host === host
      } catch {
        return false
      }
    }).slice(0, 5)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, programs])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
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
                  <Copy className="w-4 h-4" /> Copy Link
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleSaveToggle}
              disabled={isSaving || !program?.id}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" /> Save
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            {program.source && (
              <a href={program.source} target="_blank" rel="noreferrer">
                <Button className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Visit Source
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-3xl font-bold leading-tight">
                    {program.name || 'Untitled program'}
                  </CardTitle>
                  <Badge variant="secondary" className="flex-shrink-0">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">{sourceDomain}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Info Cards */}
                {(program.fundingAmount || program.deadlines) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {program.fundingAmount && (
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Funding Amount</p>
                              <p className="text-sm font-semibold text-foreground mt-0.5">
                                {program.fundingAmount}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {program.deadlines && (
                      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Deadline</p>
                              <p className="text-sm font-semibold text-foreground mt-0.5">
                                {program.deadlines}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Overview */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Overview
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {program.summary || 'No summary available.'}
                  </p>
                </section>

                <Separator />

                {/* Eligibility */}
                <section>
                  <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Eligibility Criteria
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {program.eligibility || 'Not specified.'}
                  </p>
                </section>

                <Separator />

                {/* Funding Details */}
                {program.fundingAmount && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Funding Details
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {program.fundingAmount}
                      </p>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Deadlines */}
                {program.deadlines && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        Important Deadlines
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {program.deadlines}
                      </p>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Source */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">Source</h2>
                  {program.source ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="text-sm py-1.5 px-3">
                        {program.source.replace(/^https?:\/\//, '')}
                      </Badge>
                      <a href={program.source} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink className="w-4 h-4" /> Open Original Page
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not available.</p>
                  )}
                </section>

                {/* Subprograms */}
                {program.subprograms && program.subprograms.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Subprograms
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        This program includes the following subprograms:
                      </p>
                      <div className="grid gap-3">
                        {program.subprograms.map((subprogram, idx) => (
                          <Card key={idx} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-base mb-2">{subprogram.name}</h3>
                                  {subprogram.summary && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                      {subprogram.summary}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {subprogram.fundingAmount && (
                                      <Badge variant="outline" className="gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {subprogram.fundingAmount}
                                      </Badge>
                                    )}
                                    {subprogram.deadlines && (
                                      <Badge variant="outline" className="gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {subprogram.deadlines}
                                      </Badge>
                                    )}
                                    {subprogram.sectors && (
                                      <Badge variant="outline">
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
            {/* Related Programs */}
            {siblingPrograms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Programs</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    From the same organization
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {siblingPrograms.map((p, i) => (
                      <li key={`sib-${i}`}>
                        <Link
                          className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                          to={`/funding/${p.slug || slugifyFunding(p.name, p.source)}`}
                        >
                          <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {p.name || 'Untitled program'}
                          </p>
                          {p.fundingAmount && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {p.fundingAmount}
                            </p>
                          )}
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
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={handleSaveToggle}
                  disabled={isSaving || !program?.id}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" /> Save for Later
                    </>
                  )}
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Share2 className="w-4 h-4" /> Share Opportunity
                </Button>
                {program.source && (
                  <a href={program.source} target="_blank" rel="noreferrer" className="block">
                    <Button className="w-full justify-start gap-2">
                      <ExternalLink className="w-4 h-4" /> Apply Now
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


