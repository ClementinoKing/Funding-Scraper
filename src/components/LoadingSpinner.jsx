import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ className, size = 'default', ...props }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)}
      {...props}
    />
  )
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  )
}

export function InlineLoader({ className }) {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <LoadingSpinner />
    </div>
  )
}

