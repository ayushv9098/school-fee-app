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
  ChevronRight, Sparkles, Check, X, ArrowRight, Mail
} from 'lucide-react'
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
      .limit(15)
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
      setError('GPS services are unavailable on this device.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        if (!schoolSettings?.lat || !schoolSettings?.lng) {
          setError('Admin has not configured the school location.')
          setLoading(false)
          return
        }

        const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng)
        setDistance(dist)
        const radius = schoolSettings.radius || 100
        
        if (dist > radius) {
          setError(`You are ${Math.round(dist)}m away. Attendance is only permitted within ${radius}m of school.`)
          setLoading(false)
          return
        }

        setStep('camera')
        setTimeout(startCamera, 100)
        setLoading(false)
      },
      (err) => {
        setError('Location Access Denied. Please enable GPS and try again.')
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.')
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

      const { error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, blob)

      if (uploadError) throw new Error('Photo upload failed. Please try again.')

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

      if (dbError) throw new Error('Failed to save record. Check connection.')
      
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FE] text-zinc-900 pb-28">
      
      {/* --- PREMIUM HEADER --- */}
      <header className="bg-white/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-zinc-100/50 shadow-[0_2px_15px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200 ring-2 ring-white">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-800 leading-none mb-1">{teacher.name}</h1>
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest leading-none flex items-center gap-1">
               <Sparkles size={8} className="text-violet-500 fill-violet-500" /> Professional
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-violet-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-violet-100/50">
              <div className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-violet-700 uppercase tracking-tight">Active Session</span>
           </div>
        </div>
      </header>

      <div className="flex-1 p-5 max-w-lg mx-auto w-full space-y-6">
        
        {/* --- ATTENDANCE TAB --- */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Clock Section */}
            <div className="flex flex-col items-center justify-center text-center space-y-1 py-2">
               <div className="bg-white/50 border border-white px-4 py-1 rounded-full shadow-sm mb-2">
                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                    {dayjs().format('dddd, DD MMMM')}
                  </p>
               </div>
               <p className="text-5xl font-black tracking-tighter text-zinc-900 drop-shadow-sm">
                 {dayjs().format('hh:mm')}
                 <span className="text-xl font-bold text-violet-600 ml-1 uppercase">{dayjs().format('A')}</span>
               </p>
            </div>

            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] bg-white overflow-hidden ring-1 ring-zinc-100">
              <CardContent className="p-8 flex flex-col items-center text-center space-y-7">
                
                {step === 'init' && (
                  <>
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-[35px] flex items-center justify-center text-violet-600 rotate-12 transition-transform hover:rotate-0 duration-500">
                        <Navigation size={48} strokeWidth={1.5} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center text-violet-500 animate-bounce">
                        <MapPin size={20} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight">Ready to Check-in?</h2>
                      <p className="text-sm text-zinc-400 font-medium px-6 leading-relaxed">
                        Verify your location and capture a quick selfie to start your workday.
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAttendance}
                      disabled={loading}
                      className="group relative w-full h-16 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[25px] text-base font-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={24} className="animate-spin text-violet-400" />
                          <span className="tracking-tight italic text-zinc-300">Securing Link...</span>
                        </div>
                      ) : (
                        <>
                          <span>CHECK-IN NOW</span>
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </>
                )}

                {step === 'camera' && (
                  <>
                    <div className="relative w-full">
                      <div className="w-full aspect-square bg-zinc-950 rounded-[45px] overflow-hidden relative shadow-2xl ring-4 ring-white border-8 border-zinc-50">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        
                        {/* Camera Overlays */}
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-full" />
                        </div>
                        <div className="absolute top-6 left-0 right-0 flex justify-center">
                           <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                             Face Recognition Active
                           </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-4">
                      <button
                        onClick={captureSelfie}
                        className="w-20 h-20 bg-white border-[6px] border-violet-600 rounded-full flex items-center justify-center text-violet-600 shadow-2xl shadow-violet-200 active:scale-90 transition-all ring-8 ring-violet-50"
                      >
                        <Camera size={32} strokeWidth={2.5} />
                      </button>
                      <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tap to Snap</p>
                    </div>
                  </>
                )}

                {step === 'preview' && (
                  <>
                    <div className="relative w-full">
                      <div className="w-full aspect-square bg-white rounded-[45px] overflow-hidden border-8 border-zinc-50 shadow-2xl ring-4 ring-white">
                        <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-violet-600 rounded-[25px] shadow-xl flex items-center justify-center text-white border-4 border-white">
                         <Sparkles size={28} />
                      </div>
                    </div>
                    
                    <div className="space-y-4 w-full pt-2">
                       <div>
                          <h3 className="text-xl font-black text-zinc-900 tracking-tight">Looks Sharp!</h3>
                          <p className="text-xs font-bold text-zinc-400">Review your check-in photo</p>
                       </div>
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => { setStep('camera'); setTimeout(startCamera, 100); }}
                          className="flex-1 h-14 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-[22px] text-sm font-black transition-colors"
                        >
                          RETAKE
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="flex-[2] h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-[22px] text-sm font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-violet-100"
                        >
                          {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
                          CONFIRM & POST
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {step === 'done' && (
                  <>
                    <div className="relative">
                      <div className="w-20 h-20 bg-green-50 rounded-[30px] flex items-center justify-center text-green-500 shadow-inner">
                        <CheckCircle size={40} strokeWidth={2.5} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-ping" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Attendance Verified</h2>
                      <p className="text-xs text-zinc-400 font-bold uppercase">
                        TIMESTAMP: <span className="text-violet-600">{dayjs(todayRecord?.check_in_time).format('hh:mm:ss A')}</span>
                      </p>
                    </div>
                    {todayRecord?.selfie_url && (
                      <div className="group relative w-64 aspect-square bg-white p-2 rounded-[40px] border border-zinc-100 shadow-2xl transition-transform hover:scale-105 duration-500">
                        <img 
                          src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                          alt="Verified" 
                          className="w-full h-full object-cover rounded-[32px] brightness-95 group-hover:brightness-100 transition-all"
                        />
                        <div className="absolute top-6 right-6">
                           <div className="bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white uppercase tracking-tighter">
                             Verified Selfie
                           </div>
                        </div>
                      </div>
                    )}
                    <div className="pt-2">
                       <Badge className="bg-zinc-900 text-white border-none py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                         Checked In • Today
                       </Badge>
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-5 rounded-[25px] text-[11px] flex items-center gap-3 w-full text-left border border-red-100/50 shadow-sm animate-in zoom-in-95">
                    <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                    <p className="font-black leading-tight tracking-tight">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[30px] shadow-sm border border-zinc-100/50 flex flex-col gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <Clock size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.1em] mb-1">Log Status</p>
                  <p className="text-base font-black text-zinc-900">Active</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-[30px] shadow-sm border border-zinc-100/50 flex flex-col gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                  <CalendarIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.1em] mb-1">Today</p>
                  <p className="text-base font-black text-zinc-900">Present</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
            <div className="flex items-center justify-between px-2 pt-2">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">Attendance Log</h2>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Review your records</p>
              </div>
              <button 
                onClick={fetchHistory} 
                className="w-10 h-10 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-violet-600 shadow-sm active:rotate-180 transition-transform duration-500"
              >
                <Clock size={18} />
              </button>
            </div>
            
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 size={40} className="animate-spin text-violet-200" />
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">Retrieving History...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-zinc-200 shadow-inner p-10">
                <div className="w-20 h-20 bg-zinc-50 rounded-[30px] flex items-center justify-center mx-auto mb-6">
                   <Clock className="text-zinc-200" size={32} />
                </div>
                <h3 className="text-lg font-black text-zinc-800 tracking-tight">Empty Log</h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed px-4">You haven't marked any attendance yet. Start today!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item.id} className="group bg-white p-4 rounded-[30px] border border-zinc-100/80 flex items-center justify-between shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-[22px] bg-zinc-50 flex items-center justify-center text-zinc-200 overflow-hidden border border-zinc-100 shadow-inner">
                          {item.selfie_url ? (
                            <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" alt="S" />
                          ) : <User size={20} />}
                        </div>
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-violet-600 rounded-lg flex items-center justify-center text-white border-2 border-white shadow-sm scale-75">
                           <Check size={10} strokeWidth={4} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-800 tracking-tight">{dayjs(item.date).format('DD MMM YYYY')}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                           <Clock size={10} className="text-violet-400" /> {dayjs(item.check_in_time).format('hh:mm A')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter border border-emerald-100/50">Verified</span>
                       <ChevronRight size={16} className="text-zinc-200" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 pb-10">
            <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-[45px] bg-white overflow-hidden text-center relative ring-1 ring-zinc-100">
              <div className="h-32 bg-zinc-900" />
              <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
                 <div className="absolute inset-0 bg-violet-600 opacity-80" />
                 <div className="absolute -top-20 -left-20 w-64 h-64 bg-fuchsia-500 rounded-full blur-3xl opacity-50" />
                 <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50" />
              </div>

              <div className="relative -mt-14 mb-5">
                <div className="w-28 h-28 bg-white rounded-[40px] mx-auto p-2 shadow-2xl shadow-violet-900/20">
                  <div className="w-full h-full bg-zinc-50 rounded-[32px] flex items-center justify-center text-zinc-300 shadow-inner">
                    <User size={56} strokeWidth={1} />
                  </div>
                </div>
                <div className="absolute bottom-1 right-1/2 translate-x-[50px]">
                   <div className="w-8 h-8 bg-green-500 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
                      <Sparkles size={14} className="fill-white" />
                   </div>
                </div>
              </div>

              <CardContent className="p-8 pt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tighter leading-none mb-1">{teacher.name}</h2>
                  <div className="inline-flex bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-100/50">
                    {teacher.subject} Specialist
                  </div>
                </div>
                
                <div className="space-y-3 pt-4">
                  <div className="p-5 bg-[#F8F9FE] rounded-[30px] flex items-center justify-between border border-zinc-100/50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-zinc-400 shadow-sm">
                          <Badge className="bg-violet-600 text-white rounded-lg p-1 px-1.5 text-[8px]">₹</Badge>
                       </div>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monthly Salary</p>
                    </div>
                    <p className="text-lg font-black text-zinc-900">₹{teacher.monthly_salary.toLocaleString('en-IN')}</p>
                  </div>

                  <div className="p-5 bg-[#F8F9FE] rounded-[30px] flex items-center justify-between border border-zinc-100/50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-zinc-400 shadow-sm">
                          <CalendarIcon size={18} className="text-zinc-300" />
                       </div>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Joined On</p>
                    </div>
                    <p className="text-sm font-black text-zinc-800">{dayjs(teacher.created_at).format('MMM YYYY')}</p>
                  </div>

                  <div className="p-5 bg-[#F8F9FE] rounded-[30px] border border-zinc-100/50 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-zinc-400 shadow-sm">
                          <Mail size={18} className="text-zinc-300" />
                       </div>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Identity</p>
                    </div>
                    <p className="text-sm font-bold text-zinc-600 truncate pl-14">{teacher.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* --- PREMIUM DOCK (BOTTOM NAV) --- */}
      <div className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[35px] px-8 py-3 flex justify-between items-center shadow-[0_15px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
          {[
            { id: 'history', label: 'LOG', icon: HistoryIcon },
            { id: 'attendance', label: 'START', icon: Navigation },
            { id: 'profile', label: 'ME', icon: User },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 relative ${
                activeTab === tab.id ? 'text-white scale-110' : 'text-zinc-500'
              }`}
            >
              <div className={`p-2.5 rounded-[22px] transition-all duration-500 ${
                activeTab === tab.id ? 'bg-violet-600 shadow-lg shadow-violet-600/40 text-white' : ''
              }`}>
                <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'animate-in zoom-in-75' : ''} />
              </div>
              <span className={`text-[8px] font-black tracking-[0.15em] transition-opacity ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute -bottom-1 w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
