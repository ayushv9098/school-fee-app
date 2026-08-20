import React, { useState, useRef, useEffect, Children } from 'react'
import { cn } from '@/lib/utils'

export function CustomSelect({ value, onChange, children, className, ...props }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract options deeply from children
  const options: { value: string, label: string }[] = []
  
  const extractOptions = (nodes: any) => {
    Children.forEach(nodes, child => {
       if (!child) return
       if (child.type === 'option') {
          options.push({ value: child.props.value, label: child.props.children })
       } else if (child.props && child.props.children) {
          extractOptions(child.props.children)
       } else if (Array.isArray(child)) {
          extractOptions(child)
       }
    })
  }
  extractOptions(children)

  const selectedOpt = options.find(o => String(o.value) === String(value))

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Separate layout classes (for wrapper) from visual/sizing classes (for button)
  const wrapperClass = className 
    ? className.split(' ').filter((c: string) => /^(w-|sm:w-|md:w-|lg:w-|flex-|col-|row-|m[trblxy]?-)/.test(c)).join(' ')
    : '';

  return (
    <div className={cn("relative", wrapperClass)} ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        className={cn(
          "flex items-center justify-between cursor-pointer outline-none transition-colors",
          className,
          // Ensure these are enforced for the custom dropdown layout
          "w-full text-left appearance-none"
        )}
        style={{ ...props.style }}
      >
        <span className="truncate mr-2 block flex-1">{selectedOpt ? selectedOpt.label : (value || 'Select...')}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 shrink-0"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[60] overflow-hidden max-h-64 overflow-y-auto min-w-[8rem]">
          {options.map(opt => (
            <button
              type="button"
              key={String(opt.value)}
              onClick={(e) => {
                e.preventDefault()
                if (onChange) {
                  // Simulate event for drop-in replacement
                  onChange({ target: { value: opt.value } })
                }
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-lg transition-colors text-left",
                String(value) === String(opt.value)
                  ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {String(value) === String(opt.value) && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-2"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
