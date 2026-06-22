'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, MapPin, CheckCircle, AlertTriangle, 
  Loader2, Navigation, History as HistoryIcon, 
  User, Clock, Calendar as CalendarIcon, 
  ChevronRight, Sparkles, Check, X, ArrowRight, Mail, Home, Download, Plus, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

interface Props {
  teacher: any
  schoolSettings: any
  todayRecord: any
  monthlyAttendance: any[]
  leaves: any[]
}

export default function TeacherAttendanceClient({ 
  teacher, 
  schoolSettings, 
  todayRecord: initialTodayRecord,
  monthlyAttendance: initialMonthlyAttendance,
  leaves: initialLeaves
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'attendance' | 'history' | 'profile'>('attendance')
  const [todayRecord, setTodayRecord] = useState(initialTodayRecord)
  const [step, setStep] = useState(initialTodayRecord ? 'done' : 'init')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [distance, setDistance] = useState<number | null>(null)
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>(initialMonthlyAttendance)
  const [leaves, setLeaves] = useState<any[]>(initialLeaves)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false)
      setDeferredPrompt(null)
    })
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBtn(false)
    }
    setDeferredPrompt(null)
  }

  async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/teacher-login')
    router.refresh()
  }

  useEffect(() => {
    if (activeTab === 'attendance' && navigator.geolocation) {
      // Warm up GPS
      navigator.geolocation.getCurrentPosition(() => {}, null, { enableHighAccuracy: true, maximumAge: 30000 })
    }
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab])

  async function fetchHistory() {
    setHistoryLoading(true)
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('teacher_id', teacher.id)
      .order('date', { ascending: false })
      .limit(10)
    setHistory(data || [])
    setHistoryLoading(false)
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const dPhi = (lat2-lat1) * Math.PI/180;
    const dLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLambda/2) * Math.sin(dLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async function handleMarkAttendance() {
    setLoading(true)
    setError('')
    if (!navigator.geolocation) {
      setError('GPS not available in this browser.')
      setLoading(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        if (!schoolSettings?.lat || !schoolSettings?.lng) {
          setError('School location missing. Please contact admin.')
          setLoading(false)
          return
        }
        const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng)
        setDistance(dist)
        setCoords({ lat: latitude, lng: longitude })
        const radius = schoolSettings.radius || 100
        if (dist > radius) {
          setError(`Too far from school (${Math.round(dist)}m)`)
          setLoading(false)
          return
        }
        setStep('camera')
        setTimeout(startCamera, 100)
        setLoading(false)
      },
      (err) => {
        let msg = 'Could not get location.'
        if (err.code === 1) msg = 'Location permission denied. Please allow it.'
        else if (err.code === 2) msg = 'GPS signal weak or unavailable.'
        else if (err.code === 3) msg = 'GPS request timed out. Try again.'
        setError(msg)
        setLoading(false)
      },
      options
    )
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) { videoRef.current.srcObject = stream }
    } catch (err) {
      setError('Camera access failed.')
    }
  }

  function captureSelfie() {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight)
      canvasRef.current.width = size
      canvasRef.current.height = size
      const startX = (videoRef.current.videoWidth - size) / 2
      const startY = (videoRef.current.videoHeight - size) / 2
      context?.drawImage(videoRef.current, startX, startY, size, size, 0, 0, size, size)
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8)
      setSelfie(dataUrl)
      setStep('preview')
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      if (!selfie) return
      const res = await fetch(selfie)
      const blob = await res.blob()
      const fileName = `${teacher.id}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.jpg`
      const filePath = `selfies/${fileName}`
      const { error: uploadError } = await supabase.storage.from('attendance-selfies').upload(filePath, blob)
      if (uploadError) throw new Error('Upload Fail')

      const now = dayjs()
      const startTimeStr = schoolSettings?.school_start_time || '09:30:00'
      const startTime = dayjs(`${now.format('YYYY-MM-DD')} ${startTimeStr}`)
      const isLate = now.isAfter(startTime)

      const { data: newRecord, error: dbError } = await supabase.from('attendance').insert({
        teacher_id: teacher.id,
        admin_user_id: teacher.user_id, 
        admin_id: teacher.user_id, 
        date: now.format('YYYY-MM-DD'),
        check_in_time: now.toISOString(),
        check_in_lat: coords?.lat,
        check_in_lng: coords?.lng,
        selfie_url: filePath,
        status: isLate ? 'late' : 'present',
        late_entry: isLate
      }).select().single()

      if (dbError) throw new Error(`Database Fail: ${dbError.message}`)

      if (isLate) {
        await supabase.from('notifications').insert({
          user_id: teacher.user_id,
          type: 'late_attendance',
          title: 'Late Attendance',
          message: `${teacher.name} checked in late at ${now.format('hh:mm A')}.`
        })
      }

      setTodayRecord(newRecord)
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut() {
    setLoading(true)
    setError('')
    try {
      if (!navigator.geolocation) {
        setError('GPS not available.')
        setLoading(false)
        return
      }
      
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords
        const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng)
        const radius = schoolSettings.radius || 100
        
        if (dist > radius) {
          setError(`Too far from school (${Math.round(dist)}m)`)
          setLoading(false)
          return
        }

        const now = dayjs()
        const endTimeStr = schoolSettings?.school_end_time || '15:40:00'
        const endTime = dayjs(`${now.format('YYYY-MM-DD')} ${endTimeStr}`)
        const isEarlyExit = now.isBefore(endTime)

        const { data: updatedRecord, error: dbError } = await supabase
          .from('attendance')
          .update({
            check_out_time: now.toISOString(),
            check_out_lat: latitude,
            check_out_lng: longitude,
            early_exit: isEarlyExit
          })
          .eq('id', todayRecord.id)
          .select()
          .single()

        if (dbError) throw new Error(`Database Fail: ${dbError.message}`)

        if (isEarlyExit) {
          await supabase.from('notifications').insert({
            user_id: teacher.user_id,
            type: 'early_exit',
            title: 'Early Exit',
            message: `${teacher.name} checked out early at ${now.format('hh:mm A')}.`
          })
        }

        setTodayRecord(updatedRecord)
        router.refresh()
        setLoading(false)
      }, (err) => {
        setError('Enable GPS and try again.')
        setLoading(false)
      }, { enableHighAccuracy: true })
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveSuccess, setLeaveSuccess] = useState(false)
  const [leaveData, setLeaveData] = useState({
    type: 'full',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    reason: ''
  })

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: dbError } = await supabase.from('leaves').insert({
        teacher_id: teacher.id,
        admin_id: teacher.user_id,
        type: leaveData.type,
        start_date: leaveData.startDate,
        end_date: leaveData.type === 'half' ? leaveData.startDate : leaveData.endDate,
        reason: leaveData.reason,
        status: 'pending'
      })

      if (dbError) throw dbError

      await supabase.from('notifications').insert({
        user_id: teacher.user_id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `${teacher.name} requested a ${leaveData.type} day leave for ${leaveData.startDate}.`
      })

      setLeaveSuccess(true)
      setTimeout(() => {
        setShowLeaveModal(false)
        setLeaveSuccess(false)
        setLeaveData({
          type: 'full',
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().format('YYYY-MM-DD'),
          reason: ''
        })
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Background Location Tracking
  useEffect(() => {
    let interval: any;
    if (todayRecord && !todayRecord.check_out_time) {
      interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng);
            const radius = schoolSettings.radius || 100;
            const isOutside = dist > radius;

            // Update live location for admin
            await supabase.from('attendance').update({
              last_lat: latitude,
              last_lng: longitude
            }).eq('id', todayRecord.id);

            // Detect Movement
            const { data: movement } = await supabase
              .from('staff_movements')
              .select('*')
              .eq('attendance_id', todayRecord.id)
              .is('return_time', null)
              .maybeSingle();

            if (isOutside && !movement) {
              // Mark as Exit
              await supabase.from('staff_movements').insert({
                attendance_id: todayRecord.id,
                teacher_id: teacher.id,
                exit_lat: latitude,
                exit_lng: longitude,
                is_outside: true
              });

              await supabase.from('notifications').insert({
                user_id: teacher.user_id,
                type: 'temporary_exit',
                title: 'Staff Outside School',
                message: `${teacher.name} has moved outside school boundaries at ${dayjs().format('hh:mm A')}.`
              });
            } else if (!isOutside && movement) {
              // Mark as Return
              await supabase.from('staff_movements').update({
                return_time: new Date().toISOString(),
                return_lat: latitude,
                return_lng: longitude,
                is_outside: false
              }).eq('id', movement.id);

              await supabase.from('notifications').insert({
                user_id: teacher.user_id,
                type: 'staff_returned',
                title: 'Staff Returned',
                message: `${teacher.name} returned to school at ${dayjs().format('hh:mm A')}.`
              });
            }
          }, null, { enableHighAccuracy: true });
        }
      }, 60000); // Check every 1 minute
    }
    return () => clearInterval(interval);
  }, [todayRecord]);

  const presentCount = history.filter(a => ['present', 'late', 'half_day'].includes(a.status)).length
  const lateCount = history.filter(a => a.status === 'late').length
  const leaveCount = leaves.filter(l => l.status === 'approved').length

  return (
    <div className="flex flex-col h-[calc(100dvh-57px)] bg-[#F9FAFC] text-zinc-900 dark:text-zinc-100 overflow-hidden relative font-sans">
      
      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 max-w-md mx-auto w-full space-y-5">
          
          {/* --- ATTENDANCE TAB --- */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              
              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                 <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</p>
                    <p className="text-xl font-black text-emerald-700 leading-none">{presentCount}</p>
                 </div>
                 <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mb-1">Late</p>
                    <p className="text-xl font-black text-amber-700 leading-none">{lateCount}</p>
                 </div>
                 <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mb-1">Leaves</p>
                    <p className="text-xl font-black text-blue-700 leading-none">{leaveCount}</p>
                 </div>
              </div>
              
              {showInstallBtn && (
                <button 
                  onClick={handleInstall}
                  className="w-full bg-white dark:bg-zinc-900 border border-violet-100 p-4 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-95 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 animate-shimmer" />
                  <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200 shrink-0 group-hover:scale-110 transition-transform">
                    <Download size={22} strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Install App</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Install the app for faster attendance access</p>
                  </div>
                  <div className="ml-auto w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} strokeWidth={3} />
                  </div>
                </button>
              )}

              {/* Sleek Clock Card */}
              <div className="bg-violet-600 rounded-3xl p-5 text-white shadow-lg shadow-violet-200">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <CalendarIcon size={14} className="text-violet-200" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-violet-100">{dayjs().format('ddd, DD MMM')}</p>
                    </div>
                    <Badge className="bg-white dark:bg-zinc-900/20 text-white border-none text-[9px] font-bold uppercase">Live Time</Badge>
                 </div>
                 <p className="text-4xl font-bold tracking-tighter">
                    {dayjs().format('hh:mm')}
                    <span className="text-lg font-bold ml-1 opacity-80">{dayjs().format('A')}</span>
                 </p>
              </div>

              <Card className="border-none shadow-sm rounded-[32px] bg-white dark:bg-zinc-900 overflow-hidden ring-1 ring-zinc-100">
                <CardContent className="p-0">
                  
                  {step === 'init' && (
                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                        <MapPin size={32} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-zinc-800 uppercase tracking-tight">Daily Check-in</h2>
                        <p className="text-[11px] text-zinc-400 font-medium px-4 leading-relaxed">
                          Verify location and snap a selfie to mark attendance.
                        </p>
                      </div>
                      <button
                        onClick={handleMarkAttendance}
                        disabled={loading}
                        className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={16} strokeWidth={3} />}
                        {loading ? 'VERIFYING...' : 'CHECK-IN NOW'}
                      </button>
                    </div>
                  )}

                  {step === 'camera' && (
                    <div className="p-6 flex flex-col items-center space-y-6">
                      <div className="w-full aspect-square bg-zinc-950 rounded-[32px] overflow-hidden relative border-4 border-zinc-50 shadow-inner">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                           <div className="w-4/5 h-4/5 border-2 border-white rounded-full border-dashed" />
                        </div>
                      </div>
                      <button
                        onClick={captureSelfie}
                        className="w-16 h-16 bg-white dark:bg-zinc-900 border-[6px] border-violet-600 rounded-full flex items-center justify-center text-violet-600 shadow-xl active:scale-90 transition-all"
                      >
                        <Camera size={24} strokeWidth={3} />
                      </button>
                    </div>
                  )}

                  {step === 'preview' && (
                    <div className="p-6 flex flex-col items-center space-y-6">
                      <div className="w-full aspect-square bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden border-4 border-zinc-50 shadow-xl">
                        <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => { setStep('camera'); setTimeout(startCamera, 100); }}
                          className="flex-1 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl text-xs font-bold transition-colors"
                        >
                          RETAKE
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="flex-[2] h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-bold transition-all"
                        >
                          {loading ? <Loader2 size={18} className="animate-spin" /> : 'SUBMIT'}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 'done' && (
                    <div className="flex flex-col items-center">
                       <div className={cn(
                         "w-full p-3 flex items-center justify-center gap-2",
                         todayRecord?.status === 'late' ? "bg-amber-500" : "bg-green-500"
                       )}>
                          {todayRecord?.status === 'late' ? <AlertTriangle size={16} strokeWidth={3} className="text-white" /> : <CheckCircle size={16} strokeWidth={3} className="text-white" />}
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white">
                            {todayRecord?.status === 'late' ? 'Late Check-in' : 'Attendance Verified'}
                          </p>
                       </div>
                       
                       <div className="p-6 flex flex-col items-center space-y-4 w-full">
                          
                          {/* Live Tracking Status */}
                          {!todayRecord?.check_out_time && (
                            <div className="w-full bg-violet-50 border border-violet-100 p-3 rounded-2xl flex items-center justify-center gap-2 animate-pulse">
                               <MapPin size={14} className="text-violet-600" />
                               <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Live Location Tracking Active</p>
                            </div>
                          )}

                          <div className="flex justify-between w-full px-4">
                            <div className="text-center flex-1">
                               <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mb-0.5">Checked In</p>
                               <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</p>
                            </div>
                            {todayRecord?.check_out_time && (
                              <div className="text-center flex-1">
                                 <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest mb-0.5">Checked Out</p>
                                 <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{dayjs(todayRecord?.check_out_time).format('hh:mm A')}</p>
                              </div>
                            )}
                          </div>

                          {todayRecord?.selfie_url && (
                            <div className="w-40 aspect-square bg-white dark:bg-zinc-900 p-1 rounded-[32px] border border-zinc-100 dark:border-zinc-800/50 shadow-md">
                              <img 
                                src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                                alt="Selfie" 
                                className="w-full h-full object-cover rounded-[28px]"
                              />
                            </div>
                          )}

                          {!todayRecord?.check_out_time ? (
                            <button
                              onClick={handleCheckOut}
                              disabled={loading}
                              className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                            >
                              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={16} strokeWidth={3} />}
                              {loading ? 'VERIFYING...' : 'CHECK-OUT NOW'}
                            </button>
                          ) : (
                            <div className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl text-center">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Shift Completed</p>
                              {todayRecord.early_exit && (
                                <p className="text-[10px] font-bold text-amber-600 uppercase mt-1">Flagged: Early Exit</p>
                              )}
                            </div>
                          )}

                          <Badge className="bg-zinc-50 dark:bg-zinc-950 text-zinc-400 border-none text-[8px] font-bold tracking-widest">DIGITAL LOG: {todayRecord?.id.slice(0,8)}</Badge>
                       </div>
                    </div>
                  )}

                  {error && (
                    <div className="m-4 p-3 bg-red-50 text-red-600 rounded-2xl text-[10px] flex items-center gap-2 border border-red-100">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <p className="font-bold uppercase tracking-tight">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leave & Half-Day Quick Actions */}
              <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-zinc-100 dark:border-zinc-800/50 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-800 tracking-tight">Quick Actions</h3>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Need a leave or half-day?</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      setLeaveData(prev => ({ ...prev, type: 'full' }));
                      setShowLeaveModal(true);
                    }}
                    className="flex flex-col items-center gap-3 p-4 rounded-[24px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50/50 hover:bg-amber-50 hover:border-amber-100 transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 shadow-sm group-hover:text-amber-500 transition-colors">
                      <CalendarIcon size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-tight">Full Leave</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">Application</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setLeaveData(prev => ({ ...prev, type: 'half' }));
                      setShowLeaveModal(true);
                    }}
                    className="flex flex-col items-center gap-3 p-4 rounded-[24px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50/50 hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-400 shadow-sm group-hover:text-blue-500 transition-colors">
                      <Clock size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-zinc-800 uppercase tracking-tight">Half Day</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">Request</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-[24px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Clock size={16} /></div>
                  <div><p className="text-[8px] text-zinc-300 font-bold uppercase mb-0.5">Shift</p><p className="text-[11px] font-bold text-zinc-800">Active</p></div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-[24px] border border-zinc-100 dark:border-zinc-800/50 shadow-sm flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    todayRecord?.status === 'late' ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
                  )}>
                    <CalendarIcon size={16} />
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-300 font-bold uppercase mb-0.5">Status</p>
                    <p className="text-[11px] font-bold text-zinc-800 capitalize">{todayRecord?.status || 'Pending'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
              
              {/* My Leaves Section */}
              <div className="space-y-3">
                 <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest px-1">My Leave Applications</h2>
                 {leaves.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                       <p className="text-[10px] text-zinc-400 font-bold uppercase">No leave history</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                       {leaves.map(leave => (
                          <div key={leave.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm space-y-3">
                             <div className="flex justify-between items-start">
                                <div>
                                   <p className="text-sm font-bold text-zinc-800">{dayjs(leave.start_date).format('DD MMM')} {leave.type === 'full' ? `- ${dayjs(leave.end_date).format('DD MMM')}` : ''}</p>
                                   <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">{leave.type} Day Leave</p>
                                </div>
                                <Badge className={cn(
                                   "border-none text-[9px] font-bold uppercase px-2 py-0.5",
                                   leave.status === 'pending' ? "bg-amber-100 text-amber-600" :
                                   leave.status === 'approved' ? "bg-emerald-100 text-emerald-600" :
                                   "bg-red-100 text-red-600"
                                )}>
                                   {leave.status}
                                </Badge>
                             </div>
                             <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl">
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed italic line-clamp-2">"{leave.reason}"</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-2" />

              <div className="space-y-3 pb-4">
                 <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest px-1">Attendance Activity</h2>
                 {historyLoading ? (
                   <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-violet-200" size={32} /></div>
                 ) : history.length === 0 ? (
                   <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800"><p className="text-xs text-zinc-400 font-bold">No records found</p></div>
                 ) : (
                   <div className="space-y-2">
                     {history.map(item => (
                       <div key={item.id} className="bg-white dark:bg-zinc-900 p-3 rounded-[24px] border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50 overflow-hidden">
                             {item.selfie_url ? (
                               <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover grayscale-[0.2]" alt="S" />
                             ) : <User size={16} className="text-zinc-300 m-3" />}
                           </div>
                           <div>
                             <p className="text-xs font-bold text-zinc-800 leading-tight">{dayjs(item.date).format('DD MMM YYYY')}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[9px] text-zinc-400 font-bold uppercase">{dayjs(item.check_in_time).format('hh:mm A')}</p>
                                <span className={cn(
                                   "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                   item.status === 'present' ? "bg-emerald-50 text-emerald-600" :
                                   item.status === 'late' ? "bg-amber-50 text-amber-600" :
                                   item.status === 'half_day' ? "bg-violet-50 text-violet-600" :
                                   "bg-red-50 text-red-600"
                                )}>{item.status}</span>
                             </div>
                           </div>
                         </div>
                         <div className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">Verified</div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-500">
              <Card className="border-none shadow-sm rounded-[32px] bg-white dark:bg-zinc-900 overflow-hidden text-center relative ring-1 ring-zinc-100">
                <div className="h-20 bg-gradient-to-tr from-violet-600 to-indigo-600" />
                <div className="relative -mt-8 mb-4">
                  <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-full mx-auto p-1 shadow-md">
                    <div className="w-full h-full bg-violet-100 rounded-full flex items-center justify-center text-violet-600"><User size={40} /></div>
                  </div>
                </div>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">{teacher.name}</h2>
                    <p className="text-[9px] text-violet-600 font-bold uppercase tracking-widest mt-1">{teacher.subject} Specialist</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-left">
                    {[
                      { icon: Badge, label: 'Salary', value: `₹${teacher.monthly_salary.toLocaleString('en-IN')}` },
                      { icon: CalendarIcon, label: 'Joined', value: dayjs(teacher.created_at).format('MMM YYYY') },
                      { icon: Mail, label: 'Email', value: teacher.email }
                    ].map((row, i) => (
                      <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-between border border-zinc-100 dark:border-zinc-800/50/50">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{row.label}</p>
                        <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-2">
                    <button 
                      onClick={() => setShowLeaveModal(true)}
                      className="w-full h-12 rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Plus size={16} /> Apply for Leave
                    </button>
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full h-12 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                      {isLoggingOut ? 'Logging out...' : 'Sign Out Account'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* --- LEAVE MODAL --- */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
              {leaveSuccess ? (
                <div className="p-12 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                   <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                      <CheckCircle size={48} strokeWidth={2.5} />
                   </div>
                   <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Application Submitted!</h2>
                   <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">Your leave request has been sent to your admin successfully. ✅</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Apply for Leave</h2>
                    <button onClick={() => setShowLeaveModal(false)} className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center text-zinc-400"><X size={18} /></button>
                  </div>
                  <form onSubmit={handleApplyLeave} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl">
                        <button 
                          type="button"
                          onClick={() => setLeaveData({ ...leaveData, type: 'full' })}
                          className={cn(
                            "h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                            leaveData.type === 'full' ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-sm" : "text-zinc-500 dark:text-zinc-400"
                          )}
                        >Full Day</button>
                        <button 
                          type="button"
                          onClick={() => setLeaveData({ ...leaveData, type: 'half' })}
                          className={cn(
                            "h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                            leaveData.type === 'half' ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-sm" : "text-zinc-500 dark:text-zinc-400"
                          )}
                        >Half Day</button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                          {leaveData.type === 'half' ? 'Date' : 'Start Date'}
                        </label>
                        <input 
                          type="date" 
                          required
                          value={leaveData.startDate}
                          onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })}
                          className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                        />
                    </div>

                    {leaveData.type === 'full' && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">End Date</label>
                          <input 
                            type="date" 
                            required
                            value={leaveData.endDate}
                            onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })}
                            className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl px-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                          />
                      </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Reason</label>
                        <textarea 
                          required
                          placeholder="Explain your reason..."
                          value={leaveData.reason}
                          onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
                          className="w-full h-24 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-violet-100 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Application'}
                    </button>
                    {error && <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-tight">{error}</p>}
                  </form>
                </>
              )}
           </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* --- FIXED BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800/50 z-50">
        <nav className="flex justify-around items-center px-4 h-16">
          {[
            { id: 'history', label: 'Log', icon: HistoryIcon },
            { id: 'attendance', label: 'Home', icon: Home },
            { id: 'profile', label: 'Me', icon: User },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center w-20 gap-0.5 transition-all duration-300 ${
                activeTab === tab.id ? 'text-violet-600' : 'text-zinc-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'bg-violet-50' : ''}`}>
                 <tab.icon size={20} strokeWidth={activeTab === tab.id ? 3 : 2} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

    </div>
  )
}
