import { cn } from '@/lib/utils'

export function FieldGroup({ className, ...props }) {
  return <div className={cn('grid gap-4', className)} {...props} />
}

export function Field({ className, ...props }) {
  return <div className={cn('grid gap-2', className)} {...props} />
}

export function FieldLabel({ className, ...props }) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />
}

export function FieldDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}


