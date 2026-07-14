'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import StaffClient from './staff-client'
import { Loader2 } from 'lucide-react'
import dayjs from 'dayjs'

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
      const today = dayjs().format('YYYY-MM-DD')

      const [teachers, teacherPayments, todayAttendance] = await Promise.all([
        supabase.from('teachers').select('*').neq('role', 'attendance_staff').eq('academic_year', academicYear).order('name'),
        supabase.from('teacher_payments').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('paid_at', { ascending: false }),
        supabase.from('attendance').select('*').eq('date', today)
      ])

      setData({
        teachers: teachers.data || [],
        teacherPayments: teacherPayments.data || [],
        todayAttendance: todayAttendance.data || []
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
      todayAttendance={data.todayAttendance || []}
      onRefresh={() => setRefreshKey(prev => prev + 1)}
    />
  )
}
