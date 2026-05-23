import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Users, Mail, Plus, Calendar, Download } from 'lucide-react'
import dayjs from 'dayjs'
import AttendanceClient from './attendance-client'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch teachers
  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user?.id)
    .order('name')

  // Fetch today's attendance
  const today = dayjs().format('YYYY-MM-DD')
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*, teachers(name, subject)')
    .eq('admin_id', user?.id)
    .eq('date', today)

  // Fetch this month's attendance for the table
  const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
  const { data: monthlyAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('admin_id', user?.id)
    .gte('date', startOfMonth)

  return (
    <AttendanceClient 
      initialTeachers={teachers || []} 
      todayAttendance={todayAttendance || []}
      monthlyAttendance={monthlyAttendance || []}
      adminEmail={user?.email || ''}
      adminId={user?.id || ''}
    />
  )
}
