import * as React from 'react'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onWheel, value, ...props }, ref) => {
    const defaultClasses = "flex h-10 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"

    if (type === 'date') {
      const wrapperClasses = cn(defaultClasses, className).replace(/focus:/g, 'focus-within:');
      return (
        <div className={cn("relative items-center", wrapperClasses)}>
          <span className="pointer-events-none w-full truncate text-inherit">
            {value ? dayjs(value as string).format('DD/MM/YYYY') : 'Select Date'}
          </span>
          <input 
            type="date"
            value={value || ''}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            ref={ref}
            {...props}
          />
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(defaultClasses, className)}
        value={value}
        onWheel={(e) => {
          if (type === 'number') {
            e.currentTarget.blur()
          }
          onWheel?.(e)
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }