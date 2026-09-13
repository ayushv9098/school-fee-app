'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCircle2, AlertTriangle, Info, Gift, Users, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { cn } from '@/lib/utils'
import { getDayType, HolidayItem } from '@/lib/holidays'

dayjs.extend(relativeTime)

function deduplicateNotifications(list: any[]): { unique: any[], duplicateIdsToDelete: string[] } {
  const seenIds = new Set<string>()
  const seenContentKeys = new Set<string>()
  const unique: any[] = []
  const duplicateIdsToDelete: string[] = []

  for (const item of list) {
    if (!item) continue
    
    // Deduplicate by database ID
    if (item.id && seenIds.has(item.id)) {
      continue
    }

    // Deduplicate by content signature: type + title + message + date (YYYY-MM-DD)
    const dateStr = item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
    const titleClean = (item.title || '').trim().toLowerCase()
    const msgClean = (item.message || '').trim().toLowerCase()
    const contentKey = `${item.type || ''}__${titleClean}__${msgClean}__${dateStr}`

    if (seenContentKeys.has(contentKey)) {
      if (item.id) {
        duplicateIdsToDelete.push(item.id)
      }
      continue
    }

    if (item.id) seenIds.add(item.id)
    seenContentKeys.add(contentKey)
    unique.push(item)
  }

  return { unique, duplicateIdsToDelete }
}

const EVENT_DATES: Record<string, string> = {
  // 2024
  '2024-03-25': 'Holi',
  '2024-08-19': 'Raksha Bandhan',
  '2024-08-26': 'Janmashtami',
  '2024-10-12': 'Dussehra',
  '2024-11-01': 'Diwali',
  // 2025
  '2025-03-14': 'Holi',
  '2025-08-09': 'Raksha Bandhan',
  '2025-08-15': 'Independence Day & Janmashtami',
  '2025-10-02': 'Gandhi Jayanti & Dussehra',
  '2025-10-20': 'Diwali',
  // 2026
  '2026-03-03': 'Holi',
  '2026-08-28': 'Raksha Bandhan',
  '2026-09-04': 'Janmashtami',
  '2026-10-20': 'Dussehra',
  '2026-11-08': 'Diwali',
}

const FIXED_EVENTS: Record<string, string> = {
  '01-01': 'New Year',
  '01-26': 'Republic Day',
  '08-15': 'Independence Day',
  '09-05': "Teachers' Day",
  '10-02': 'Gandhi Jayanti',
  '11-14': "Children's Day",
  '12-25': 'Christmas',
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<{ present: number, absent: number } | null>(null)
  const [birthdays, setBirthdays] = useState<any[]>([])
  const activeChecks = useRef<Set<string>>(new Set())
  const currentUserIdRef = useRef<string | null>(null)
  const schoolAdminIdRef = useRef<string | null>(null)
  const supabase = createClient()

  async function checkAndInsertEventNotification(userId: string) {
    const today = dayjs().format('YYYY-MM-DD')
    const todayMMDD = dayjs().format('MM-DD')
    
    const eventName = EVENT_DATES[today] || FIXED_EVENTS[todayMMDD]

    if (eventName) {
      const checkKey = `event_${userId}_${today}`
      if (activeChecks.current.has(checkKey)) return false
      activeChecks.current.add(checkKey)

      const { data } = await supabase.from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'event_notification')
        .gte('created_at', dayjs().startOf('day').toISOString())
        .limit(1)
        
      if (!data || data.length === 0) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'event_notification',
          title: `Happy ${eventName}!`,
          message: `Wishing you a very Happy ${eventName}. Warm greetings from AV Infra.`
        })
        return true
      }
    }
    return false
  }

  async function checkAndInsertStaffUnmarkedAlert(userId: string) {
    const currentHour = dayjs().hour()
    if (currentHour < 15) return false // Cutoff: 3:00 PM

    const today = dayjs().format('YYYY-MM-DD')
    if (dayjs().day() === 0) return false // Exclude Sunday

    const checkKey = `staff_unmarked_${userId}_${today}`
    if (activeChecks.current.has(checkKey)) return false
    activeChecks.current.add(checkKey)

    const { data: hData } = await supabase.from('holidays').select('*').eq('date', today)
    const dt = getDayType(today, hData || [])
    if (dt.type !== 'working') return false

    // Check if staff attendance reminder notification was already sent today
    const { data: existing } = await supabase.from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'staff_unmarked_3pm')
      .gte('created_at', dayjs().startOf('day').toISOString())
      .limit(1)

    if (existing && existing.length > 0) return false

    const [teachersRes, attRes] = await Promise.all([
      supabase.from('teachers').select('id, name').eq('user_id', userId),
      supabase.from('attendance').select('teacher_id').eq('date', today).or(`admin_id.eq.${userId},admin_user_id.eq.${userId}`)
    ])

    const teachers = teachersRes.data || []
    if (teachers.length === 0) return false

    const markedIds = new Set((attRes.data || []).map(a => a.teacher_id))
    const unmarked = teachers.filter(t => !markedIds.has(t.id))

    if (unmarked.length > 0) {
      const names = unmarked.map(t => t.name).slice(0, 3).join(', ') + (unmarked.length > 3 ? ` +${unmarked.length - 3} more` : '')
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'staff_unmarked_3pm',
        title: 'Staff Attendance Alert (3:00 PM)',
        message: `${unmarked.length} staff member${unmarked.length > 1 ? 's' : ''} (${names}) haven't marked attendance today by 3:00 PM.`
      })
      return true
    }
    return false
  }

  useEffect(() => {
    fetchNotifications()

    const channelName = `notifications-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newItem = payload.new
          if (!newItem) return
          // Filter out notifications that don't belong to the current logged in user
          if (newItem.user_id && currentUserIdRef.current && newItem.user_id !== currentUserIdRef.current) return
          setNotifications((prev) => {
            const { unique } = deduplicateNotifications([newItem, ...prev])
            return unique
          })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_attendance' },
        () => {
          // Re-fetch attendance summary scoped to this school's admin
          if (schoolAdminIdRef.current) {
            fetchAttendanceSummary(schoolAdminIdRef.current)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchAttendanceSummary(adminId?: string) {
    const targetAdminId = adminId || schoolAdminIdRef.current
    if (!targetAdminId) return

    const today = dayjs().format('YYYY-MM-DD')

    try {
      // First attempt: inner join with students table so attendance is scoped to this school
      const { data, error } = await supabase
        .from('student_attendance')
        .select('status, students!inner(user_id)')
        .eq('date', today)
        .eq('type', 'class')
        .eq('students.user_id', targetAdminId)
      
      if (!error && data) {
        const present = data.filter(a => a.status === 'present').length
        const absent = data.filter(a => a.status === 'absent').length
        setAttendanceSummary({ present, absent })
        return
      }

      // Resilient fallback: Query student IDs for target school admin, then filter attendance
      const { data: userStudents } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', targetAdminId)

      if (userStudents && userStudents.length > 0) {
        const studentIds = userStudents.map(s => s.id)
        const { data: attData } = await supabase
          .from('student_attendance')
          .select('status')
          .eq('date', today)
          .eq('type', 'class')
          .in('student_id', studentIds)

        if (attData) {
          const present = attData.filter(a => a.status === 'present').length
          const absent = attData.filter(a => a.status === 'absent').length
          setAttendanceSummary({ present, absent })
        }
      } else {
        setAttendanceSummary({ present: 0, absent: 0 })
      }
    } catch (e) {
      console.error('Error fetching scoped attendance summary:', e)
    }
  }

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    currentUserIdRef.current = user.id

    // Check if user is staff/teacher to resolve school admin ID
    let schoolAdminId = user.id
    const { data: teacherProfile } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (teacherProfile?.user_id) {
      schoolAdminId = teacherProfile.user_id
    }
    schoolAdminIdRef.current = schoolAdminId

    // Clean up old notifications for this user only
    await supabase.from('notifications')
      .delete()
      .eq('user_id', user.id)
      .lt('created_at', dayjs().subtract(24, 'hour').toISOString())

    await Promise.all([
      checkAndInsertEventNotification(user.id),
      checkAndInsertStaffUnmarkedAlert(schoolAdminId)
    ])

    const todayMMDD = dayjs().format('MM-DD')

    const [notifRes, bdayRes] = await Promise.all([
      supabase.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dayjs().subtract(24, 'hour').toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('students')
        .select('name, class')
        .eq('user_id', schoolAdminId)
        .like('date_of_birth', `%-${todayMMDD}`)
        .ilike('status', 'active')
    ])
    
    if (notifRes.data) {
      const { unique, duplicateIdsToDelete } = deduplicateNotifications(notifRes.data)
      setNotifications(unique.slice(0, 10))

      // Clean up duplicate records from DB
      if (duplicateIdsToDelete.length > 0) {
        supabase.from('notifications').delete().in('id', duplicateIdsToDelete).then(() => {})
      }
    }
    
    if (bdayRes.data) {
      setBirthdays(bdayRes.data)
    }

    // Fetch attendance summary strictly scoped to this school
    await fetchAttendanceSummary(schoolAdminId)
  }

  async function markAsRead(id: string) {
    if (!id) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const { unique: displayNotifications } = deduplicateNotifications(notifications)
  const unreadCount = displayNotifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center relative hover:bg-zinc-200 transition-colors"
      >
        <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Notifications</p>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-400">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[32rem] overflow-y-auto">
              {/* Daily Summary Widget */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-violet-50/50 dark:bg-violet-500/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">Today's Overview</p>
                  <p className="text-[10px] font-medium text-zinc-500">{dayjs().format('dddd, DD MMM YYYY')}</p>
                </div>
                
                <div className="space-y-2">
                  {/* Attendance */}
                  {attendanceSummary !== null && (
                    <div className="flex items-center justify-between bg-white dark:bg-zinc-900/50 rounded-lg p-2.5 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <Users size={14} className="text-blue-500" />
                        <span className="text-xs font-medium">Student Attendance</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">{attendanceSummary.present} P</span>
                        <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">{attendanceSummary.absent} A</span>
                      </div>
                    </div>
                  )}

                  {/* Birthdays */}
                  {birthdays.length > 0 ? (
                    <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-2.5 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 mb-2">
                        <Gift size={14} className="text-pink-500" />
                        <span className="text-xs font-medium">Today's Birthdays ({birthdays.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {birthdays.map((b, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{b.name}</span>
                            <span className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">Class {b.class}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900/50 rounded-lg p-2.5 border border-zinc-100 dark:border-zinc-800 text-zinc-500">
                      <Gift size={14} className="text-zinc-400" />
                      <span className="text-[11px] font-medium">No birthdays today</span>
                    </div>
                  )}
                </div>
              </div>

              {displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-zinc-400 font-medium">No recent notifications</p>
                </div>
              ) : (
                displayNotifications.map(n => (
                  <div 
                    key={n.id || `${n.type}-${n.title}-${n.created_at}`} 
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      "p-4 border-b border-zinc-50 last:border-0 cursor-pointer hover:bg-zinc-50 dark:bg-zinc-950 transition-colors flex gap-3",
                      !n.is_read && "bg-violet-50/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      n.type === 'geofence_breach' ? "bg-red-100 text-red-600" :
                      n.type === 'staff_unmarked_3pm' ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300" :
                      "bg-violet-100 text-violet-600"
                    )}>
                      {n.type === 'geofence_breach' ? <AlertTriangle size={14} /> :
                       n.type === 'staff_unmarked_3pm' ? <Clock size={14} /> :
                       <Info size={14} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{n.title}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-zinc-400 font-bold">{dayjs(n.created_at).fromNow()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
