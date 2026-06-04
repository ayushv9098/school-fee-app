import { createClient } from '@/lib/supabase/server'
import dayjs from 'dayjs'
import TeacherAttendanceClient from './teacher-client'

export default async function TeacherAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get teacher record
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('auth_user_id', user?.id)
    .single()

  if (!teacher) {
    return <div className="p-10 text-center">Teacher record not found. Please contact admin.</div>
  }

  // Get admin's school settings
  const { data: schoolSettings } = await supabase
    .from('school_settings')
    .select('*')
    .eq('user_id', teacher.user_id)
    .single()

  // Check if already marked today
  const today = dayjs().format('YYYY-MM-DD')
  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('date', today)
    .maybeSingle()

  // Fetch monthly records for summary
  const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
  const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

  const { data: monthlyAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('teacher_id', teacher.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  // Fetch leaves for status
  const { data: leaves } = await supabase
    .from('leaves')
    .select('*')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })

  return (
    <TeacherAttendanceClient 
      teacher={teacher} 
      schoolSettings={schoolSettings} 
      todayRecord={todayRecord}
      monthlyAttendance={monthlyAttendance || []}
      leaves={leaves || []}
    />
  )
}
