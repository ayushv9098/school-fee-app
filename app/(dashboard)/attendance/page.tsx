import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Users, Mail, Plus, Calendar, Download } from 'lucide-react'
import dayjs from 'dayjs'
import AttendanceClient from './attendance-client'

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string, month?: string, year?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const selectedDate = params.date || dayjs().format('YYYY-MM-DD')
  const selectedMonth = params.month ? parseInt(params.month) : dayjs().month() + 1
  const selectedYear = params.year ? parseInt(params.year) : dayjs().year()

  // Fetch teachers
  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user?.id)
    .order('name')

  // Fetch specific date attendance
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('admin_id', user?.id)
    .eq('date', selectedDate)

  // Fetch selected month's attendance for the table
  const startOfMonth = dayjs().year(selectedYear).month(selectedMonth - 1).startOf('month').format('YYYY-MM-DD')
  const endOfMonth = dayjs().year(selectedYear).month(selectedMonth - 1).endOf('month').format('YYYY-MM-DD')
  
  const { data: monthlyAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('admin_id', user?.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  // Fetch leave requests (all statuses)
  const { data: rawLeaves } = await supabase
    .from('leaves')
    .select('*')
    .eq('admin_id', user?.id)
    .order('created_at', { ascending: false })

  const teacherMap = new Map((teachers || []).map(t => [t.id, t]))
  const pendingLeaves = (rawLeaves || []).map(l => ({
    ...l,
    teachers: teacherMap.get(l.teacher_id) || { name: 'Staff Member', subject: 'Staff' }
  }))

  // Fetch holidays for user
  const { data: holidays } = await supabase
    .from('holidays')
    .select('*')
    .eq('user_id', user?.id)
    .order('date', { ascending: true })

  // Fetch settings for map
  const { data: settings } = await supabase
    .from('school_settings')
    .select('*')
    .eq('user_id', user?.id)
    .maybeSingle()

  console.log('Admin ID:', user?.id)
  console.log('Pending Leaves:', pendingLeaves)

  return (
    <AttendanceClient 
      initialTeachers={teachers || []} 
      todayAttendance={todayAttendance || []}
      monthlyAttendance={monthlyAttendance || []}
      pendingLeaves={pendingLeaves || []}
      initialHolidays={holidays || []}
      adminEmail={user?.email || ''}
      adminId={user?.id || ''}
      selectedDate={selectedDate}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      settings={settings}
    />
  )
}
