'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false, trickleSpeed: 200 })

function ProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

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