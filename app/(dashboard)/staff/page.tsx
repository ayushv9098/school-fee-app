'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import StaffClient from './staff-client'
import { Loader2 } from 'lucide-react'

export default function StaffPage() {
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

      const [teachers, teacherPayments] = await Promise.all([
        supabase.from('teachers').select('*').neq('role', 'attendance_staff').order('name'),
        supabase.from('teacher_payments').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('paid_at', { ascending: false })
      ])

      setData({
        teachers: teachers.data || [],
        teacherPayments: teacherPayments.data || []
      })
      setLoading(false)
    }

    fetchData()
  }, [academicYear, refreshKey])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <StaffClient
      initialTeachers={data.teachers}
      initialTeacherPayments={data.teacherPayments}
      onRefresh={() => setRefreshKey(prev => prev + 1)}
    />
  )
}
