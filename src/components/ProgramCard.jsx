import { memo, useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DollarSign,
  Calendar,
  Building2,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Share2,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { slugifyFunding } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { saveProgram, unsaveProgram, checkSavedStatus } from '@/lib/savedPrograms'

export const ProgramCard = memo(function ProgramCard({ program, variant = 'grid', className, isSubprogram = false }) {
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Use pre-computed sourceDomain if available, otherwise compute it
  const sourceDomain = program.sourceDomain || (() => {
    if (!program.source) return 'Unknown'
    try {
      return new URL(program.source).hostname.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  })()

  const isClosingSoon = program.deadlines && (() => {
    // Simple check - could be enhanced with actual date parsing
    const deadlineLower = program.deadlines.toLowerCase()
    return deadlineLower.includes('soon') || deadlineLower.includes('closing')
  })()

  // Check saved status on mount
  useEffect(() => {
    if (program.id) {
      checkSavedStatus(isSubprogram ? null : program.id, isSubprogram ? program.id : null)
        .then(({ isSaved: saved }) => {
          setIsSaved(saved)
        })
        .catch(() => {
          setIsSaved(false)
        })
    }
  }, [program.id, isSubprogram])

  // Handle save/unsave
  const handleSaveToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!program.id) {
      return // Can't save programs without IDs
    }

    setIsSaving(true)
    try {
      if (isSaved) {
        const result = await unsaveProgram(
          isSubprogram ? null : program.id,
          isSubprogram ? program.id : null
        )
        if (result.success) {
          setIsSaved(false)
        }
      } else {
        const result = await saveProgram(
          isSubprogram ? null : program.id,
          isSubprogram ? program.id : null
        )
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

  if (variant === 'list') {
    return (
      <Link
        to={`/funding/${program.slug || slugifyFunding(program.name, program.source)}`}
        className="block group"
      >
        <Card className="h-full hover:shadow-md hover:border-blue-500/50 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {program.name || 'Untitled program'}
                    </CardTitle>
                    {program.qualification?.qualifies && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="default" 
                              className="mt-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Qualified ({program.matchScore || program.qualification?.score || 0}%)
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="text-xs space-y-1">
                              <p className="font-semibold">Why this qualifies:</p>
                              {program.qualification?.reasons?.slice(0, 3).map((reason, idx) => (
                                <p key={idx}>• {reason}</p>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {program.summary || 'No summary available.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {program.fundingAmount && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span className="line-clamp-1">{program.fundingAmount}</span>
                    </div>
                  )}
                  {program.deadlines && (
                    <div className={cn(
                      "flex items-center gap-1.5",
                      isClosingSoon ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                      <span className="line-clamp-1">{program.deadlines}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{sourceDomain}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleSaveToggle}
                          disabled={isSaving || !program.id}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 fill-current" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isSaved ? 'Unsave program' : 'Save program'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault()
                            // TODO: Implement share functionality
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Share program</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {program.sectors && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {program.sectors.split(', ').slice(0, 2).map((sector, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {sector.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  // Grid view (default)
  return (
    <Link
      to={`/funding/${program.slug || slugifyFunding(program.name, program.source)}`}
      className="block group"
    >
      <Card className={cn("h-full hover:shadow-lg hover:border-blue-500/50 transition-all duration-200 flex flex-col", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {program.name || 'Untitled program'}
              </CardTitle>
              {program.qualification?.qualifies && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="default" 
                        className="mt-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Qualified ({program.matchScore || program.qualification?.score || 0}% match)
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="text-xs space-y-1">
                        <p className="font-semibold">Why this qualifies:</p>
                        {program.qualification?.reasons?.slice(0, 3).map((reason, idx) => (
                          <p key={idx}>• {reason}</p>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {program.summary || 'No summary available.'}
          </p>
          
          <div className="space-y-2 mb-4">
            {program.fundingAmount && (
              <div className="flex items-start gap-2 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">Funding: </span>
                  {program.fundingAmount}
                </span>
              </div>
            )}
            {program.deadlines && (
              <div className={cn(
                "flex items-start gap-2 text-xs",
                isClosingSoon && "text-orange-600 dark:text-orange-400"
              )}>
                <Clock className={cn(
                  "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
                  isClosingSoon ? "text-orange-600 dark:text-orange-400" : "text-orange-600 dark:text-orange-400"
                )} />
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">Deadline: </span>
                  {program.deadlines}
                </span>
              </div>
            )}
            {program.eligibility && (
              <div className="flex items-start gap-2 text-xs">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">
                  <span className="font-medium text-foreground">Eligibility: </span>
                  {program.eligibility}
                </span>
              </div>
            )}
          </div>
          
          {program.sectors && (
            <div className="flex flex-wrap gap-1 mb-4">
              {program.sectors.split(', ').slice(0, 3).map((sector, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {sector.trim()}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-muted-foreground truncate">
                {sourceDomain}
              </span>
            </div>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSaveToggle}
                      disabled={isSaving || !program.id}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 fill-current" />
                      ) : (
                        <Bookmark className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSaved ? 'Unsave' : 'Save'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

