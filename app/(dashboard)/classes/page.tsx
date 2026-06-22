'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CLASSES } from '@/lib/constants'
import Link from 'next/link'
import { useSession } from '@/lib/session-context'

export default function ClassesPage() {
  const { academicYear } = useSession()
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    async function fetchClassesData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('student_fee_summary')
        .select('*')
        .eq('academic_year', academicYear)
        .eq('status', 'active')
        .eq('user_id', user?.id)
      setStudents(data || [])
    }
    fetchClassesData()
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

      {classStats.length === 0 ? (
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