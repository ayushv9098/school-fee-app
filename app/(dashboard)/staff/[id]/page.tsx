'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import StaffDetailClient from './staff-detail-client'
import { Loader2 } from 'lucide-react'

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { academicYear } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function fetchData() {
      if (!data) {
        setLoading(true)
      }
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      const [teacherRes, settingsRes, paymentsRes] = await Promise.all([
        supabase.from('teachers').select('*').eq('id', id).single(),
        supabase.from('school_settings').select('school_name').eq('user_id', user?.id).maybeSingle(),
        supabase.from('teacher_payments').select('*').eq('teacher_id', id).or(`academic_year.eq.${academicYear},academic_year.is.null`).order('month', { ascending: true })
      ])

      setData({
        teacher: teacherRes.data,
        schoolName: settingsRes.data?.school_name || 'School Name',
        payments: paymentsRes.data || []
      })
      setLoading(false)
    }

    fetchData()
  }, [academicYear, id, refreshKey])

  if (loading && !data?.teacher) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <StaffDetailClient
      teacher={data.teacher}
      schoolName={data.schoolName}
      initialPayments={data.payments}
      onRefresh={() => setRefreshKey(prev => prev + 1)}
    />
  )
}
