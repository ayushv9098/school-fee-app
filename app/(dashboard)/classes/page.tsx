'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CLASSES } from '@/lib/constants'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSession } from '@/lib/session-context'
import { getSafeInitialCache, setSafeCache, markAppHydrated } from '@/lib/cache-utils'

function getSessionStudents(academicYear: string): any[] {
  if (typeof window === 'undefined') return []
  try {
    const classCache = sessionStorage.getItem(`classes-cache-${academicYear}`)
    if (classCache) {
      const parsed = JSON.parse(classCache)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
    const dashCache = sessionStorage.getItem(`dashboard-cache-${academicYear}`)
    if (dashCache) {
      const parsed = JSON.parse(dashCache)
      if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
        return parsed.students
      }
    }
  } catch {}
  return []
}

export default function ClassesPage() {
  const { academicYear } = useSession()
  const [students, setStudents] = useState<any[]>(() => {
    return (
      getSafeInitialCache<any[]>(`classes-cache-${academicYear}`) ||
      getSafeInitialCache<any>(`dashboard-cache-${academicYear}`)?.students ||
      []
    )
  })
  const [loading, setLoading] = useState<boolean>(() => {
    const initial = (
      getSafeInitialCache<any[]>(`classes-cache-${academicYear}`) ||
      getSafeInitialCache<any>(`dashboard-cache-${academicYear}`)?.students ||
      []
    )
    return initial.length === 0
  })

  useEffect(() => {
    let isCurrent = true
    markAppHydrated()
    const cacheKey = `classes-cache-${academicYear}`

    if (students.length === 0) {
      const cached = getSessionStudents(academicYear)
      if (cached.length > 0) {
        setStudents(cached)
        setLoading(false)
      }
    }

    async function fetchClassesData() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        let user = session?.user || null
        if (!user) {
          const userRes = await supabase.auth.getUser()
          user = userRes.data?.user || null
        }

        const { data } = await supabase
          .from('student_fee_summary')
          .select('*')
          .eq('academic_year', academicYear)
          .eq('status', 'active')
          .eq('user_id', user?.id)

        if (!isCurrent) return

        const freshStudents = data || []
        setStudents(freshStudents)
        setLoading(false)
        setSafeCache(cacheKey, freshStudents)
      } catch (err) {
        if (isCurrent) setLoading(false)
      }
    }

    fetchClassesData()

    return () => {
      isCurrent = false
    }
  }, [academicYear])

  const classStats = CLASSES.map(cls => {
    const cl = students?.filter(s => s.class === cls) || []
    if (cl.length === 0) return null
    const fee = cl.reduce((a, s) => a + s.total_fee, 0)
    const paid = cl.reduce((a, s) => a + s.total_paid, 0)
    return {
      name: cls,
      count: cl.length,
      totalFee: fee,
      collected: paid,
      pending: fee - paid,
      percent: getProgressPercent(fee, paid)
    }
  }).filter(Boolean)

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          Classes
          <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            {academicYear}
          </span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{classStats.length} active classes</p>
      </div>

      {loading && students.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : classStats.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-zinc-400 text-sm">
            No students right now
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {classStats.map(cls => cls && (
            <Link key={cls.name} href={`/students?class=${cls.name}`}>
              <Card className="hover:shadow-md transition cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cls.name}</CardTitle>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{cls.count} students</span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3">
                  <Progress value={cls.percent} />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-green-600">
                      Collected: {formatCurrency(cls.collected)}
                    </span>
                    <span className="text-red-500">
                      Pending: {formatCurrency(cls.pending)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Total: {formatCurrency(cls.totalFee)}</span>
                    <span>{cls.percent}% paid</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
