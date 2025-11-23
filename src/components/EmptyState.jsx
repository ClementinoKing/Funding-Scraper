import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Bookmark, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap = {
  search: Search,
  saved: Bookmark,
  programs: FileText,
  error: AlertCircle,
}

export function EmptyState({
  icon = 'programs',
  title = 'No items found',
  description,
  action,
  actionLabel,
  className,
}) {
  const Icon = iconMap[icon] || FileText

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {description && <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>}
        {action && actionLabel && (
          <Button onClick={action} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

