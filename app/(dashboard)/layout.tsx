'use client'

import { DesktopSidebar, MobileSidebar } from '@/components/layout/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { User, ArrowLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import NotificationsDropdown from '@/components/layout/notifications'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col overflow-hidden fade-in-page">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function Header() {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/50 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <MobileSidebar />
        </div>
        {!isDashboard && (
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-zinc-100 dark:bg-zinc-800 transition">
            <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </Link>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs p-0.5 flex items-center justify-center shrink-0">
            <Image src="/logo-crest.png" alt="Ayushman Logo" width={20} height={20} className="w-full h-full object-contain" priority />
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ayushman Academy</p>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        <NotificationsDropdown />
        <Link href="/profile" className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
          <User className="w-4 h-4 text-violet-600" />
        </Link>
      </div>
    </header>
  )
}
