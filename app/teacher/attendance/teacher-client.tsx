'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, MapPin, CheckCircle, AlertTriangle, Loader2, Navigation, History, User, Clock, Calendar as CalendarIcon, LogOut, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'

interface Props {
  teacher: any
  schoolSettings: any
  todayRecord: any
}

export default function TeacherAttendanceClient({ teacher, schoolSettings, todayRecord }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<'attendance' | 'history' | 'profile'>('attendance')
  const [step, setStep] = useState(todayRecord ? 'done' : 'init')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [distance, setDistance] = useState<number | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
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
      .limit(20)
    setHistory(data || [])
    setHistoryLoading(false)
  }

  // Distance Calculation (Haversine)
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
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        if (!schoolSettings?.lat || !schoolSettings?.lng) {
          setError('School location not set by admin')
          setLoading(false)
          return
        }

        const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng)
        setDistance(dist)
        const radius = schoolSettings.radius || 100
        if (dist > radius) {
          setError(`You are not in school premises. Distance: ${Math.round(dist)}m (Allowed: ${radius}m)`)
          setLoading(false)
          return
        }

        setStep('camera')
        setTimeout(startCamera, 100)
        setLoading(false)
      },
      (err) => {
        setError('GPS Error: ' + err.message)
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Could not access camera')
    }
  }

  function captureSelfie() {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      const dataUrl = canvasRef.current.toDataURL('image/jpeg')
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

      const { error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, blob)

      if (uploadError) throw new Error('Photo Upload Failed: ' + uploadError.message)

      const { error: dbError } = await supabase
        .from('attendance')
        .insert({
          teacher_id: teacher.id,
          admin_user_id: teacher.user_id, 
          admin_id: teacher.user_id, 
          date: dayjs().format('YYYY-MM-DD'),
          check_in_time: new Date().toISOString(),
          selfie_url: filePath,
          status: 'present'
        })

      if (dbError) throw new Error('Database Saving Failed: ' + dbError.message)
      
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 pb-24">
      
      {/* --- HEADER --- */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
            <User size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Teacher Portal</p>
            <h1 className="text-sm font-bold text-zinc-900">{teacher.name}</h1>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-100">
          Online
        </Badge>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full">
        
        {/* --- ATTENDANCE TAB --- */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Status Card */}
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
               <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 py-6 text-white text-center">
                  <p className="text-violet-100 text-xs font-medium uppercase tracking-widest mb-1">
                    {dayjs().format('dddd, DD MMMM')}
                  </p>
                  <p className="text-4xl font-mono font-black tracking-tighter">
                    {dayjs().format('hh:mm A')}
                  </p>
               </div>
              <CardContent className="p-6 flex flex-col items-center text-center space-y-6">
                
                {step === 'init' && (
                  <>
                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center text-violet-600">
                      <MapPin size={40} className="animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-zinc-900">Good Morning!</h2>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        Ready for work? Tap below to mark your attendance for today.
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAttendance}
                      disabled={loading}
                      className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-base font-bold transition flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-violet-100 active:scale-95"
                    >
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <Navigation size={22} />}
                      {loading ? 'Verifying GPS...' : 'Mark Attendance'}
                    </button>
                  </>
                )}

                {step === 'camera' && (
                  <>
                    <div className="w-full aspect-square bg-zinc-900 rounded-3xl overflow-hidden relative shadow-2xl">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-[6px] border-white/20 rounded-3xl pointer-events-none" />
                      <div className="absolute bottom-4 left-0 right-0 text-white/50 text-[10px] font-medium uppercase tracking-tighter">
                        Position your face inside the frame
                      </div>
                    </div>
                    <button
                      onClick={captureSelfie}
                      className="w-20 h-20 bg-white border-8 border-violet-100 rounded-full flex items-center justify-center text-violet-600 shadow-xl active:scale-90 transition-transform"
                    >
                      <Camera size={32} />
                    </button>
                    <p className="text-sm font-bold text-zinc-900">Tap to click photo</p>
                  </>
                )}

                {step === 'preview' && (
                  <>
                    <div className="w-full aspect-square bg-zinc-100 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                      <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-4 w-full pt-2">
                      <button
                        onClick={() => { setStep('camera'); setTimeout(startCamera, 100); }}
                        className="flex-1 h-14 bg-zinc-100 text-zinc-600 rounded-2xl text-sm font-bold transition"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-green-100"
                      >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                        Confirm & Submit
                      </button>
                    </div>
                  </>
                )}

                {step === 'done' && (
                  <>
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle size={32} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-zinc-900">Attendance Completed</h2>
                      <p className="text-xs text-zinc-500">
                        Recorded at: <span className="font-bold text-zinc-900 text-sm italic">{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</span>
                      </p>
                    </div>
                    {todayRecord?.selfie_url && (
                      <div className="w-full aspect-square bg-white p-2 rounded-3xl border border-zinc-100 shadow-inner">
                        <img 
                          src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                          alt="Today's Selfie" 
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs flex items-start gap-3 w-full text-left border border-red-100 shadow-sm animate-pulse">
                    <AlertTriangle className="flex-shrink-0" size={16} />
                    <p className="font-medium leading-relaxed">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Working</p>
                  <p className="text-sm font-bold text-zinc-900">Active</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase">Today</p>
                  <p className="text-sm font-bold text-zinc-900">Present</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Recent Activity</h2>
              <button onClick={fetchHistory} className="text-xs font-bold text-violet-600">Refresh</button>
            </div>
            
            {historyLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-violet-600 opacity-20" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200 shadow-inner">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Clock className="text-zinc-300" size={32} />
                </div>
                <p className="text-sm text-zinc-400 font-medium">Your attendance log is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-3xl border border-zinc-100 flex items-center justify-between shadow-sm active:scale-95 transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 overflow-hidden border border-zinc-100 shadow-inner">
                        {item.selfie_url ? (
                          <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover" alt="S" />
                        ) : <User size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{dayjs(item.date).format('DD MMM YYYY')}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">{dayjs(item.check_in_time).format('hh:mm A')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-tighter">Verified</span>
                       <ChevronRight size={14} className="text-zinc-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
            <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden text-center">
              <div className="h-28 bg-gradient-to-br from-violet-600 to-indigo-700" />
              <div className="-mt-12 mb-4">
                <div className="w-24 h-24 bg-white rounded-full mx-auto p-1.5 shadow-xl shadow-violet-900/10">
                  <div className="w-full h-full bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                    <User size={48} />
                  </div>
                </div>
              </div>
              <CardContent className="p-8 pt-0 space-y-2">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{teacher.name}</h2>
                <p className="text-sm text-violet-600 font-bold uppercase tracking-widest">{teacher.subject} Specialist</p>
                
                <div className="pt-8 grid grid-cols-1 gap-3">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Salary/Month</p>
                    <p className="text-base font-black text-zinc-900">₹{teacher.monthly_salary.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Join Date</p>
                    <p className="text-sm font-bold text-zinc-700">{dayjs(teacher.created_at).format('MMMM YYYY')}</p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between overflow-hidden">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex-shrink-0">Email</p>
                    <p className="text-sm font-medium text-zinc-900 truncate pl-4">{teacher.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-100 px-6 py-3 pb-8 z-40 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {[
          { id: 'history', label: 'Log', icon: History },
          { id: 'attendance', label: 'Check-in', icon: Navigation },
          { id: 'profile', label: 'Me', icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all relative ${
              activeTab === tab.id ? 'text-violet-600' : 'text-zinc-300'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-violet-100 text-violet-600' : ''}`}>
              <tab.icon size={tab.id === 'attendance' ? 24 : 20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}
