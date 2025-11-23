import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { slugifyFunding } from '@/lib/utils'
import { signOut } from '@/lib/auth'
import { fetchPrograms } from '@/lib/programs'
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
  Layers,
  Mail,
  Phone,
} from 'lucide-react'

export default function SubprogramDetail() {
  const { parentSlug, subprogramSlug } = useParams()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function logout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Check saved status when subprogram is loaded
  useEffect(() => {
    if (subprogram?.id) {
      checkSavedStatus(null, subprogram.id)
        .then(({ isSaved: saved }) => {
          setIsSaved(saved)
        })
        .catch(() => {
          setIsSaved(false)
        })
    }
  }, [subprogram?.id])

  // Handle save/unsave for subprogram
  async function handleSaveToggle() {
    if (!subprogram?.id) return

    setIsSaving(true)
    try {
      if (isSaved) {
        const result = await unsaveProgram(null, subprogram.id)
        if (result.success) {
          setIsSaved(false)
        }
      } else {
        const result = await saveProgram(null, subprogram.id)
        if (result.success) {
          setIsSaved(true)
        } else if (result.error !== 'Program is already saved') {
          console.error('Error saving subprogram:', result.error)
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        setLoading(true)
        const data = await fetchPrograms()
        if (!isMounted) return
        setPrograms(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!isMounted) return
        console.error('Error loading programs:', e)
        setError('Failed to load funding data. Please try again later.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const { parentProgram, subprogram } = useMemo(() => {
    if (!parentSlug || !subprogramSlug || programs.length === 0) {
      return { parentProgram: null, subprogram: null }
    }

    // Find parent program - try slug first, then fall back to slugifyFunding
    const parent = programs.find((p) => 
      p.slug === parentSlug || slugifyFunding(p.name, p.source) === parentSlug
    )
    if (!parent || !parent.subprograms) {
      return { parentProgram: null, subprogram: null }
    }

    // Find subprogram within parent - try slug first, then fall back to slugifyFunding
    const sub = parent.subprograms.find(
      (sp) => sp.slug === subprogramSlug || slugifyFunding(sp.name, sp.source) === subprogramSlug
    )

    return { parentProgram: parent, subprogram: sub || null }
  }, [parentSlug, subprogramSlug, programs])

  const otherSubprograms = useMemo(() => {
    if (!parentProgram || !subprogram) return []
    return (parentProgram.subprograms || []).filter(
      (sp) => (sp.slug || slugifyFunding(sp.name, sp.source)) !== subprogramSlug
    )
  }, [parentProgram, subprogram, subprogramSlug])

  const sourceDomain = subprogram?.source ? (() => {
    try {
      return new URL(subprogram.source).hostname.replace('www.', '')
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

  if (!parentProgram || !subprogram) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Subprogram not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The requested subprogram could not be located.
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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/funding/${parentSlug}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Parent Program
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Layers className="w-3 h-3" /> Subprogram
            </Badge>
          </div>
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
              disabled={isSaving || !subprogram?.id}
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
            {subprogram.source && (
              <a href={subprogram.source} target="_blank" rel="noreferrer">
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

        {/* Parent Program Link */}
        <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Layers className="w-4 h-4" />
              <span>Subprogram of:</span>
            </div>
            <Link 
              to={`/funding/${parentSlug}`}
              className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {parentProgram.name}
            </Link>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-3xl font-bold leading-tight">
                    {subprogram.name || 'Untitled subprogram'}
                  </CardTitle>
                  <Badge variant="secondary" className="flex-shrink-0">
                    Subprogram
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-muted-foreground">{sourceDomain}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Info Cards */}
                {(subprogram.fundingAmount || subprogram.deadlines) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subprogram.fundingAmount && (
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Funding Amount</p>
                              <p className="text-sm font-semibold text-foreground mt-0.5">
                                {subprogram.fundingAmount}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {subprogram.deadlines && (
                      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-900">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Deadline</p>
                              <p className="text-sm font-semibold text-foreground mt-0.5">
                                {subprogram.deadlines}
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
                    {subprogram.summary || 'No summary available.'}
                  </p>
                </section>

                <Separator />

                {/* Eligibility */}
                {subprogram.eligibility && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Eligibility Criteria
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {subprogram.eligibility}
                      </p>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Funding Details */}
                {subprogram.fundingAmount && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Funding Details
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {subprogram.fundingAmount}
                      </p>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Deadlines */}
                {subprogram.deadlines && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        Important Deadlines
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {subprogram.deadlines}
                      </p>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Contact Information */}
                {(subprogram.contactEmail || subprogram.contactPhone) && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Contact Information
                      </h2>
                      <div className="space-y-2">
                        {subprogram.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a 
                              href={`mailto:${subprogram.contactEmail}`}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {subprogram.contactEmail}
                            </a>
                          </div>
                        )}
                        {subprogram.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a 
                              href={`tel:${subprogram.contactPhone}`}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {subprogram.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Application Process */}
                {subprogram.applicationProcess && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Application Process
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {subprogram.applicationProcess}
                      </p>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Sectors */}
                {subprogram.sectors && (
                  <>
                    <section>
                      <h2 className="text-xl font-semibold mb-3">Sectors</h2>
                      <div className="flex flex-wrap gap-2">
                        {subprogram.sectors.split(', ').map((sector, idx) => (
                          <Badge key={idx} variant="outline">
                            {sector.trim()}
                          </Badge>
                        ))}
                      </div>
                    </section>
                    <Separator />
                  </>
                )}

                {/* Source */}
                <section>
                  <h2 className="text-xl font-semibold mb-3">Source</h2>
                  {subprogram.source ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="secondary" className="text-sm py-1.5 px-3">
                        {subprogram.source.replace(/^https?:\/\//, '')}
                      </Badge>
                      <a href={subprogram.source} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-2">
                          <ExternalLink className="w-4 h-4" /> Open Original Page
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not available.</p>
                  )}
                </section>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Parent Program */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parent Program</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/funding/${parentSlug}`}
                  className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {parentProgram.name}
                  </p>
                  {parentProgram.fundingAmount && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {parentProgram.fundingAmount}
                    </p>
                  )}
                </Link>
              </CardContent>
            </Card>

            {/* Other Subprograms */}
            {otherSubprograms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Other Subprograms</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    From the same parent program
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {otherSubprograms.map((sp, i) => (
                      <li key={i}>
                        <Link
                          className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                          to={`/funding/${parentSlug}/subprogram/${sp.slug || slugifyFunding(sp.name, sp.source)}`}
                        >
                          <p className="text-sm font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                            {sp.name || 'Untitled subprogram'}
                          </p>
                          {sp.fundingAmount && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {sp.fundingAmount}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
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
                  disabled={isSaving || !subprogram?.id}
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
                  <Share2 className="w-4 h-4" /> Share Subprogram
                </Button>
                {subprogram.source && (
                  <a href={subprogram.source} target="_blank" rel="noreferrer" className="block">
                    <Button className="w-full justify-start gap-2">
                      <ExternalLink className="w-4 h-4" /> Apply Now
                    </Button>
                  </a>
                )}
                <Link to={`/funding/${parentSlug}`} className="block">
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <ArrowLeft className="w-4 h-4" /> View Parent Program
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

