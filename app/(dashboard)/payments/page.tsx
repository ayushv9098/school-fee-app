'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import PaymentsClient from './payments-client'
import { Loader2 } from 'lucide-react'
import { getSafeInitialCache, setSafeCache, markAppHydrated } from '@/lib/cache-utils'

export default function PaymentsPage() {
  const { academicYear } = useSession()
  const [data, setData] = useState<any>(() => getSafeInitialCache(`payments-cache-${academicYear}`))
  const [loading, setLoading] = useState<boolean>(() => !getSafeInitialCache(`payments-cache-${academicYear}`))

  useEffect(() => {
    let isCurrent = true
    markAppHydrated()

    const cacheKey = `payments-cache-${academicYear}`

    if (!data) {
      try {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          setData(parsed)
          setLoading(false)
        }
      } catch {}
    }

    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        let user = session?.user || null
        if (!user) {
          const userRes = await supabase.auth.getUser()
          user = userRes.data?.user || null
        }

        const [paymentsRes, studentsRes] = await Promise.all([
          supabase
            .from('payments')
            .select('*, students!inner(name, class, total_fee, academic_year, user_id)')
            .eq('students.academic_year', academicYear)
            .eq('students.user_id', user?.id)
            .order('paid_at', { ascending: false }),
          supabase
            .from('student_fee_summary')
            .select('*')
            .eq('academic_year', academicYear)
            .eq('status', 'active')
            .eq('user_id', user?.id)
        ])

        if (!isCurrent) return

        const freshData = {
          allPayments: paymentsRes.data || [],
          students: studentsRes.data || []
        }

        setData(freshData)
        setLoading(false)
        setSafeCache(cacheKey, freshData)
      } catch (err) {
        if (isCurrent) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isCurrent = false
    }
  }, [academicYear])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="px-4 pt-6 md:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Payments</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Transaction history for {academicYear}</p>
        </div>
        <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          {academicYear}
        </div>
      </div>
      
      <PaymentsClient
        allPayments={data.allPayments}
        students={data.students}
      />
    </div>
  )
}
