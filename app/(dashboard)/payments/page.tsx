'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import PaymentsClient from './payments-client'
import { Loader2 } from 'lucide-react'

export default function PaymentsPage() {
  const { academicYear } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()

      const [paymentsRes, studentsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*, students!inner(name, class, total_fee, academic_year)')
          .eq('students.academic_year', academicYear)
          .order('paid_at', { ascending: false }),
        supabase
          .from('student_fee_summary')
          .select('*')
          .eq('academic_year', academicYear)
      ])

      setData({
        allPayments: paymentsRes.data || [],
        students: studentsRes.data || []
      })
      setLoading(false)
    }

    fetchData()
  }, [academicYear])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="px-4 pt-6 md:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Payments</h1>
          <p className="text-sm text-zinc-500">Transaction history for {academicYear}</p>
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
