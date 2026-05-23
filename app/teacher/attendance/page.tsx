import { createClient } from '@/lib/supabase/server'
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
  const today = new Date().toISOString().split('T')[0]
  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('date', today)
    .maybeSingle()

  return (
    <TeacherAttendanceClient 
      teacher={teacher} 
      schoolSettings={schoolSettings} 
      todayRecord={todayRecord}
    />
  )
}
