'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { cn } from '@/lib/utils'

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
  const supabase = createClient()

  async function checkAndInsertEventNotification(userId: string) {
    const today = dayjs().format('YYYY-MM-DD')
    const todayMMDD = dayjs().format('MM-DD')
    
    // Prioritize specific year mappings (handles overlaps), then fallback to fixed annual dates
    const eventName = EVENT_DATES[today] || FIXED_EVENTS[todayMMDD]

    if (eventName) {
      // Check if we already inserted it today for this user
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

  useEffect(() => {
    fetchNotifications()

    // Use a unique channel name to avoid conflicts during rapid re-mounts (Strict Mode)
    const channelName = `notifications-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete notifications older than 24 hours for the current user
    await supabase.from('notifications')
      .delete()
      .lt('created_at', dayjs().subtract(24, 'hour').toISOString())

    await checkAndInsertEventNotification(user.id)

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .gte('created_at', dayjs().subtract(24, 'hour').toISOString())
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setNotifications(data)
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
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-zinc-400 font-medium">No notifications yet</p>
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
                      n.type === 'geofence_breach' ? "bg-red-100 text-red-600" : "bg-violet-100 text-violet-600"
                    )}>
                      {n.type === 'geofence_breach' ? <AlertTriangle size={14} /> : <Info size={14} />}
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
