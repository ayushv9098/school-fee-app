'use client'

import { useEffect, Suspense, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({ 
  showSpinner: true, 
  trickleSpeed: 100,
  minimum: 0.1,
  easing: 'ease-out',
  speed: 200
})

const ALLOWED_PATHS = [
  '/dashboard',
  '/ai',
  '/classes',
  '/students',
  '/payments',
  '/how-to-use',
  '/expenses',
  '/profile'
]

function ProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const handleStart = (url: string) => {
      // Only show loader for specific paths
      const targetPath = new URL(url, location.origin).pathname
      const isAllowed = ALLOWED_PATHS.some(path => targetPath === path || targetPath.startsWith(path + '/'))
      
      if (isAllowed) {
        NProgress.start()
        setIsNavigating(true)
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest('a')
      
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
      
      // Ignore modified clicks
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      
      // Ignore external links and special links
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return
      
      // Only same-origin links
      if (!anchor.href || !anchor.href.startsWith(location.origin)) return
      
      // Don't start if it's the current page
      if (anchor.href === location.href) return
      
      handleStart(anchor.href)
    }

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement
      const action = form.getAttribute('action')
      if (action) handleStart(action)
      else handleStart(location.href)
    }

    window.addEventListener('click', handleClick, true)
    window.addEventListener('submit', handleSubmit, true)

    return () => {
      window.removeEventListener('click', handleClick, true)
      window.removeEventListener('submit', handleSubmit, true)
    }
  }, [])

  useEffect(() => {
    NProgress.done()
    setIsNavigating(false)
  }, [pathname, searchParams])

  return (
    <>
      {isNavigating && (
        <div className="fixed inset-0 bg-white dark:bg-zinc-900/5 backdrop-blur-[1px] z-[9998] pointer-events-none transition-opacity duration-200 animate-in fade-in" />
      )}
    </>
  )
}

export default function ProgressBar() {
  return (
    <>
      <style>{`
        #nprogress {
          pointer-events: none;
        }
        #nprogress .bar {
          background: #7C3AED;
          height: 4px;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 9999;
          box-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
        }
        #nprogress .peg {
          display: block;
          position: absolute;
          right: 0px;
          width: 100px;
          height: 100%;
          box-shadow: 0 0 10px #7C3AED, 0 0 5px #7C3AED;
          opacity: 1.0;
          transform: rotate(3deg) translate(0px, -4px);
        }
        #nprogress .spinner {
          display: block;
          position: fixed;
          z-index: 9999;
          top: 15px;
          right: 15px;
        }
        #nprogress .spinner-icon {
          width: 16px;
          height: 16px;
          box-sizing: border-box;
          border: solid 2px transparent;
          border-top-color: #7C3AED;
          border-left-color: #7C3AED;
          border-radius: 50%;
          animation: nprogress-spinner 300ms linear infinite;
        }
        @keyframes nprogress-spinner {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Suspense fallback={null}>
        <ProgressBarInner />
      </Suspense>
    </>
  )
}