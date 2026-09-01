'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle2, AlertTriangle, Info, Gift, Users, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { cn } from '@/lib/utils'
import { getDayType, HolidayItem } from '@/lib/holidays'

dayjs.extend(relativeTime)

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
  '10-02': 'Gandhi Jayanti',
  '12-25': 'Christmas',
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<{ present: number, absent: number } | null>(null)
  const [birthdays, setBirthdays] = useState<any[]>([])
  const supabase = createClient()

  async function checkAndInsertEventNotification(userId: string) {
    const today = dayjs().format('YYYY-MM-DD')
    const todayMMDD = dayjs().format('MM-DD')
    
    const eventName = EVENT_DATES[today] || FIXED_EVENTS[todayMMDD]

    if (eventName) {
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
      supabase.from('attendance').select('teacher_id').eq('date', today)
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
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_attendance' },
        () => {
          // Re-fetch attendance summary when anyone marks attendance
          fetchAttendanceSummary()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchAttendanceSummary() {
    const { data } = await supabase.from('student_attendance')
      .select('status')
      .eq('date', dayjs().format('YYYY-MM-DD'))
      .eq('type', 'class')
    
    if (data) {
      const present = data.filter(a => a.status === 'present').length
      const absent = data.filter(a => a.status === 'absent').length
      setAttendanceSummary({ present, absent })
    }
  }

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('notifications')
      .delete()
      .lt('created_at', dayjs().subtract(24, 'hour').toISOString())

    await Promise.all([
      checkAndInsertEventNotification(user.id),
      checkAndInsertStaffUnmarkedAlert(user.id)
    ])

    const [notifRes, attRes, bdayRes] = await Promise.all([
      supabase.from('notifications')
        .select('*')
        .gte('created_at', dayjs().subtract(24, 'hour').toISOString())
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('student_attendance')
        .select('status, type')
        .eq('date', dayjs().format('YYYY-MM-DD'))
        .eq('type', 'class'),
      supabase.from('students')
        .select('name, class')
        .like('date_of_birth', `%-${dayjs().format('MM-DD')}`)
        .eq('status', 'Active')
    ])
    
    if (notifRes.data) setNotifications(notifRes.data)
    
    if (attRes.data) {
      const present = attRes.data.filter(a => a.status === 'present').length
      const absent = attRes.data.filter(a => a.status === 'absent').length
      setAttendanceSummary({ present, absent })
    }

    if (bdayRes.data) {
      setBirthdays(bdayRes.data)
    }
  }

  async function markAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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

              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-zinc-400 font-medium">No recent notifications</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
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
