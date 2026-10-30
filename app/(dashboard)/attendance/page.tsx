import { createClient } from '@/lib/supabase/server'
import dayjs from 'dayjs'
import AttendanceClient from './attendance-client'

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string, month?: string, year?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const selectedDate = params.date || dayjs().format('YYYY-MM-DD')
  const selectedMonth = params.month ? parseInt(params.month) : dayjs().month() + 1
  const selectedYear = params.year ? parseInt(params.year) : dayjs().year()

  const startOfMonth = dayjs().year(selectedYear).month(selectedMonth - 1).startOf('month').format('YYYY-MM-DD')
  const endOfMonth = dayjs().year(selectedYear).month(selectedMonth - 1).endOf('month').format('YYYY-MM-DD')

  // Concurrently execute all queries with Promise.all to eliminate sequential roundtrips
  const [teachersRes, todayAttRes, monthlyAttRes, rawLeavesRes, holidaysRes, settingsRes] = await Promise.all([
    supabase
      .from('teachers')
      .select('*')
      .eq('user_id', user?.id)
      .order('name'),
    supabase
      .from('attendance')
      .select('*')
      .eq('admin_id', user?.id)
      .eq('date', selectedDate),
    supabase
      .from('attendance')
      .select('*')
      .eq('admin_id', user?.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
    supabase
      .from('leaves')
      .select('*')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('holidays')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: true }),
    supabase
      .from('school_settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle()
  ])

  const teachers = teachersRes.data || []
  const todayAttendance = todayAttRes.data || []
  const monthlyAttendance = monthlyAttRes.data || []
  const rawLeaves = rawLeavesRes.data || []
  const holidays = holidaysRes.data || []
  const settings = settingsRes.data || null

  const teacherMap = new Map(teachers.map(t => [t.id, t]))
  const pendingLeaves = rawLeaves.map(l => ({
    ...l,
    teachers: teacherMap.get(l.teacher_id) || { name: 'Staff Member', subject: 'Staff' }
  }))

  return (
    <AttendanceClient 
      initialTeachers={teachers} 
      todayAttendance={todayAttendance}
      monthlyAttendance={monthlyAttendance}
      pendingLeaves={pendingLeaves}
      initialHolidays={holidays}
      adminEmail={user?.email || ''}
      adminId={user?.id || ''}
      selectedDate={selectedDate}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      settings={settings}
    />
  )
}
