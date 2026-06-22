import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'paid' | 'partial' | 'unpaid' | 'outline' | 'default'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variant === 'paid' && 'bg-green-100 text-green-700',
          variant === 'partial' && 'bg-yellow-100 text-yellow-700',
          variant === 'unpaid' && 'bg-red-100 text-red-700',
          variant === 'outline' && 'border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400',
          variant === 'default' && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }