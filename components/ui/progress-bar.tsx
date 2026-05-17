'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 200 })

function ProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest('a')
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      if (!anchor.href || !anchor.href.startsWith(location.origin)) return
      if (anchor.href === location.href) return
      NProgress.start()
    }

    const handleSubmit = () => {
      NProgress.start()
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
  }, [pathname, searchParams])

  return null
}

export default function ProgressBar() {
  return (
    <>
      <style>{`
        #nprogress .bar {
          background: #7C3AED;
          height: 3px;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }
        #nprogress .peg {
          box-shadow: 0 0 10px #7C3AED, 0 0 5px #7C3AED;
        }
      `}</style>
      <Suspense fallback={null}>
        <ProgressBarInner />
      </Suspense>
    </>
  )
}