'use client'

import { GraduationCap, LogOut, User as UserIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 flex flex-col">
      {/* Simple Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-100 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-sm font-bold text-zinc-900 truncate max-w-[150px] xs:max-w-none">
            Ayushman Educational Academy
          </h1>
        </div>

        <button 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-100 disabled:opacity-50"
        >
          <LogOut size={14} />
          <span className="hidden xs:inline">{isLoggingOut ? '...' : 'Logout'}</span>
        </button>
      </header>
      
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="fade-in-page h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
