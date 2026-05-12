'use client'

import { DesktopSidebar, MobileSidebar } from '@/components/layout/sidebar'
import Link from 'next/link'
import { User, ArrowLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import FloatingAIButton from '@/components/floating-ai-button'
import { Suspense } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-zinc-50">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
  <Suspense fallback={
    <div className="p-4 md:p-6 space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-zinc-200 rounded-lg w-32" />
        <div className="h-10 bg-zinc-200 rounded-xl w-28" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-24 bg-zinc-200 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-zinc-200 rounded-2xl" />
    </div>
  }>
    {children}
  </Suspense>
</main>
<FloatingAIButton />
      </div>
    </div>
  )
}

function Header() {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <MobileSidebar />
          {!isDashboard && (
            <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-zinc-100 transition">
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
            </Link>
          )}
          <p className="text-sm font-semibold text-zinc-900">Ayushman Educational Academy</p>
        </div>
        <Link href="/profile" className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
          <User className="w-4 h-4 text-violet-600" />
        </Link>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {!isDashboard && (
            <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-zinc-100 transition">
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
            </Link>
          )}
          <p className="text-sm font-semibold text-zinc-900">Ayushman Educational Academy</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <Link href="/dashboard" className="hover:text-violet-600 transition">Dashboard</Link>
            <Link href="/students" className="hover:text-violet-600 transition">Students</Link>
            <Link href="/payments" className="hover:text-violet-600 transition">Payments</Link>
            <Link href="/classes" className="hover:text-violet-600 transition">Classes</Link>
          </div>
          <Link href="/profile" className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
            <User className="w-4 h-4 text-violet-600" />
          </Link>
        </div>
      </header>
    </>
  )
}