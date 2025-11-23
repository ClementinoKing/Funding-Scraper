import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Timeline({ deadlines, className }) {
  if (!deadlines) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No deadline information available.</p>
        </CardContent>
      </Card>
    )
  }

  // Simple parsing - could be enhanced with actual date parsing
  const deadlineText = deadlines.trim()
  const isClosingSoon = deadlineText.toLowerCase().includes('soon') || 
                        deadlineText.toLowerCase().includes('closing') ||
                        deadlineText.toLowerCase().includes('urgent')

  return (
    <Card className={cn('border-l-4', isClosingSoon ? 'border-l-orange-500' : 'border-l-blue-500', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Important Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2",
            isClosingSoon ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : "border-blue-500 bg-blue-50 dark:bg-blue-950"
          )}>
            <Clock className={cn(
              "h-4 w-4",
              isClosingSoon ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">Application Deadline</h4>
              {isClosingSoon && (
                <Badge variant="destructive" className="text-xs">Closing Soon</Badge>
              )}
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap">{deadlineText}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

