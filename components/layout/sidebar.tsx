'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, CreditCard, BookOpen, LogOut, X, Menu, User, Bot, HelpCircle, Wallet, Contact } from 'lucide-react'
import { useSession } from '@/lib/session-context'
import { toast } from 'sonner'
import { setSafeCache } from '@/lib/cache-utils'

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

// Background pre-warming state guard
let isPrewarming = false

export async function prewarmDashboardData(academicYear: string) {
  if (typeof window === 'undefined' || !academicYear || isPrewarming) return

  const staffKey = `staff-cache-${academicYear}`
  const paymentsKey = `payments-cache-${academicYear}`
  const expensesKey = `expenses-cache-${academicYear}`
  const classesKey = `classes-cache-${academicYear}`

  try {
    const hasStaff = !!sessionStorage.getItem(staffKey)
    const hasPayments = !!sessionStorage.getItem(paymentsKey)
    const hasExpenses = !!sessionStorage.getItem(expensesKey)
    const hasClasses = !!sessionStorage.getItem(classesKey)

    // If all target dashboard caches are already warm, exit immediately
    if (hasStaff && hasPayments && hasExpenses && hasClasses) {
      return
    }

    isPrewarming = true

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    let user = session?.user || null
    if (!user) {
      const userRes = await supabase.auth.getUser()
      user = userRes.data?.user || null
    }
    if (!user) {
      isPrewarming = false
      return
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // 1. Shared student summary if classes, payments, or expenses need it
    const needStudentSummary = !hasClasses || !hasPayments || !hasExpenses
    const studentSummaryPromise = needStudentSummary
      ? supabase
          .from('student_fee_summary')
          .select('*')
          .eq('academic_year', academicYear)
          .eq('status', 'active')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] })

    // 2. Staff queries
    const staffTeachersPromise = !hasStaff
      ? supabase
          .from('teachers')
          .select('*')
          .or('role.neq.attendance_staff,role.is.null')
          .eq('user_id', user.id)
          .order('name')
      : Promise.resolve({ data: [] })

    const staffAttendancePromise = !hasStaff
      ? supabase
          .from('attendance')
          .select('*')
          .eq('date', today)
          .eq('admin_id', user.id)
      : Promise.resolve({ data: [] })

    // 3. Teacher payments (used by staff and expenses)
    const needTeacherPayments = !hasStaff || !hasExpenses
    const teacherPaymentsPromise = needTeacherPayments
      ? supabase
          .from('teacher_payments')
          .select('*')
          .or(`academic_year.eq.${academicYear},academic_year.is.null`)
          .order('paid_at', { ascending: false })
      : Promise.resolve({ data: [] })

    // 4. Payments queries
    const paymentsPromise = !hasPayments
      ? supabase
          .from('payments')
          .select('*, students!inner(name, class, total_fee, academic_year, user_id)')
          .eq('students.academic_year', academicYear)
          .eq('students.user_id', user.id)
          .order('paid_at', { ascending: false })
      : Promise.resolve({ data: [] })

    // 5. Expenses-specific queries
    const expensesTeachersPromise = !hasExpenses
      ? supabase.from('teachers').select('*').order('name')
      : Promise.resolve({ data: [] })

    const expensesVehiclesPromise = !hasExpenses
      ? supabase.from('vehicles').select('*').order('name')
      : Promise.resolve({ data: [] })

    const expensesVehicleExpPromise = !hasExpenses
      ? supabase
          .from('vehicle_expenses')
          .select('*')
          .or(`academic_year.eq.${academicYear},academic_year.is.null`)
          .order('date', { ascending: false })
      : Promise.resolve({ data: [] })

    const expensesBuildingExpPromise = !hasExpenses
      ? supabase
          .from('building_expenses')
          .select('*')
          .or(`academic_year.eq.${academicYear},academic_year.is.null`)
          .order('date', { ascending: false })
      : Promise.resolve({ data: [] })

    // Execute needed lightweight queries concurrently in background
    const [
      studentSummaryRes,
      staffTeachersRes,
      staffAttendanceRes,
      teacherPaymentsRes,
      paymentsRes,
      expensesTeachersRes,
      expensesVehiclesRes,
      expensesVehicleExpRes,
      expensesBuildingExpRes,
    ] = await Promise.all([
      studentSummaryPromise,
      staffTeachersPromise,
      staffAttendancePromise,
      teacherPaymentsPromise,
      paymentsPromise,
      expensesTeachersPromise,
      expensesVehiclesPromise,
      expensesVehicleExpPromise,
      expensesBuildingExpPromise,
    ])

    const studentSummaryData = studentSummaryRes.data || []

    // Populate classes cache
    if (!hasClasses && !sessionStorage.getItem(classesKey)) {
      setSafeCache(classesKey, studentSummaryData)
    }

    // Populate students default filter cache for instant 0ms load
    const studentsDefaultKey = `students-cache-${academicYear}-s:-c:-p:-st:active`
    if (!sessionStorage.getItem(studentsDefaultKey)) {
      setSafeCache(studentsDefaultKey, studentSummaryData)
    }

    // Populate payments cache
    if (!hasPayments && !sessionStorage.getItem(paymentsKey)) {
      setSafeCache(paymentsKey, {
        allPayments: paymentsRes.data || [],
        students: studentSummaryData,
      })
    }

    // Populate staff cache
    if (!hasStaff && !sessionStorage.getItem(staffKey)) {
      setSafeCache(staffKey, {
        teachers: staffTeachersRes.data || [],
        teacherPayments: teacherPaymentsRes.data || [],
        todayAttendance: staffAttendanceRes.data || [],
      })
    }

    // Populate expenses cache
    if (!hasExpenses && !sessionStorage.getItem(expensesKey)) {
      setSafeCache(expensesKey, {
        teachers: expensesTeachersRes.data || [],
        teacherPayments: teacherPaymentsRes.data || [],
        vehicles: expensesVehiclesRes.data || [],
        vehicleExpenses: expensesVehicleExpRes.data || [],
        buildingExpenses: expensesBuildingExpRes.data || [],
        students: studentSummaryData,
      })
    }
  } catch (err) {
    console.warn('Background cache pre-warming failed silently:', err)
  } finally {
    isPrewarming = false
  }
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { academicYear, setAcademicYear, availableYears } = useSession()
  const [mounted, setMounted] = useState(false)
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)

  // Clear or sync optimisticPath when pathname changes
  useEffect(() => {
    setOptimisticPath(null)
  }, [pathname])

  useEffect(() => {
    setMounted(true)
    const coreRoutes = [
      '/students',
      '/staff',
      '/attendance',
      '/student-records',
      '/payments',
      '/expenses',
      '/classes',
      '/ai',
      '/dashboard',
    ]
    coreRoutes.forEach((route) => {
      router.prefetch(route)
    })
  }, [router])

  // Background Cache Pre-warming after 600ms of mount (during browser idle time)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          prewarmDashboardData(academicYear)
        })
      } else {
        prewarmDashboardData(academicYear)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [academicYear])

  async function handleLogout() {
    if (typeof document !== 'undefined') {
      document.cookie = 'user-role=; path=/; max-age=0;'
    }
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
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-0.5 flex items-center justify-center overflow-hidden shrink-0">
            <Image src="/logo-crest.png" alt="Ayushman Logo" width={28} height={28} className="w-full h-full object-contain" priority />
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
          const active = optimisticPath ? optimisticPath === item.href : pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              onClick={() => {
                setOptimisticPath(item.href)
                if (onClose) onClose()
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-violet-600 text-white shadow-sm'
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
              onMouseDown={(e) => {
                e.preventDefault()
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
