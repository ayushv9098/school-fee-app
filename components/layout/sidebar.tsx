'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, CreditCard, BookOpen, LogOut, GraduationCap, X, Menu, User, Bot, HelpCircle, Wallet, Contact } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/staff', label: 'Staff', icon: Contact },
  { href: '/attendance', label: 'Staff Attendance', icon: User },
  { href: '/student-records', label: 'Student Attendance', icon: BookOpen },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/classes', label: 'Classes', icon: BookOpen },
  { href: '/ai', label: 'AI Insights', icon: Bot },
  { href: '/how-to-use', label: 'How to Use', icon: HelpCircle },
  { href: '/profile', label: 'Profile', icon: User },
]

import { useSession } from '@/lib/session-context'
import { toast } from 'sonner'

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { academicYear, setAcademicYear, availableYears } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const onYearChange = (year: string) => {
    setAcademicYear(year)
    toast.success(`Session switched to ${year}`, {
      description: 'The app data has been updated.',
      duration: 3000
    })
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">Ayushman</p>
            <p className="text-xs text-zinc-400">School Manager</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 dark:bg-zinc-800">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-zinc-50 dark:border-zinc-800/50 relative">
        <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5 block px-1">Session / Year</label>
        {mounted ? (
          <SessionDropdown 
            academicYear={academicYear} 
            availableYears={availableYears} 
            onYearChange={onYearChange} 
          />
        ) : (
          <div className="w-full h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  )
}

function SessionDropdown({ academicYear, availableYears, onYearChange }: { academicYear: string, availableYears: string[], onYearChange: (y: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 flex items-center justify-between text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      >
        <span>{academicYear}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => {
                onYearChange(year)
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-lg transition-colors text-left",
                academicYear === year 
                  ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              {year}
              {academicYear === year && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-zinc-100 dark:bg-zinc-800 lg:hidden"
      >
        <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-900 z-50 shadow-xl transition-transform duration-300 lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent onClose={() => setOpen(false)} />
      </div>
    </>
  )
}

export function DesktopSidebar() {
  return (
    <div className="hidden lg:flex lg:flex-col w-60 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800/50 h-screen sticky top-0 overflow-hidden">
      <SidebarContent />
    </div>
  )
}