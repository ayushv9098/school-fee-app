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
  ChevronRight, Sparkles, Check, X, ArrowRight, Mail, LayoutGrid
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
      .limit(10)
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
      setError('GPS not available.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        if (!schoolSettings?.lat || !schoolSettings?.lng) {
          setError('School location missing.')
          setLoading(false)
          return
        }

        const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng)
        setDistance(dist)
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
        setError('Enable GPS and try again.')
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
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

      const { error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, blob)

      if (uploadError) throw new Error('Upload Error')

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

      if (dbError) throw new Error('Database Error')
      
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F9FAFC] text-zinc-900 pb-20 overflow-hidden">
      
      {/* --- SLEEK MINIMAL HEADER --- */}
      <header className="bg-white/70 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-zinc-200/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
            <User size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[13px] font-black tracking-tight text-zinc-800 leading-none">{teacher.name}</h1>
            <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Teacher ID: {teacher.id.slice(0, 6)}</p>
          </div>
        </div>
        <Badge className="bg-green-50 text-green-600 border-green-100 text-[10px] px-2.5 py-0.5 font-black uppercase">
          Online
        </Badge>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 max-w-lg mx-auto w-full space-y-5">
          
          {/* --- ATTENDANCE TAB --- */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* Compact Clock Pill */}
              <div className="flex justify-center">
                 <div className="bg-white border border-zinc-100 shadow-sm px-5 py-2 rounded-full flex items-center gap-3">
                    <div className="flex flex-col text-right">
                       <p className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter leading-none">{dayjs().format('dddd')}</p>
                       <p className="text-[10px] font-black text-zinc-900 uppercase leading-none mt-1">{dayjs().format('DD MMM')}</p>
                    </div>
                    <div className="w-px h-6 bg-zinc-100" />
                    <p className="text-xl font-black tracking-tighter text-zinc-900 leading-none">
                       {dayjs().format('hh:mm')}
                       <span className="text-xs font-bold text-violet-600 ml-0.5">{dayjs().format('A')}</span>
                    </p>
                 </div>
              </div>

              <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-[32px] bg-white overflow-hidden ring-1 ring-zinc-100">
                <CardContent className="p-0">
                  
                  {step === 'init' && (
                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                      <div className="w-20 h-20 bg-violet-50 rounded-[28px] flex items-center justify-center text-violet-600">
                        <Navigation size={38} strokeWidth={2} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-lg font-black text-zinc-900 tracking-tight">Mark Attendance</h2>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed px-4">
                          Secure location check and selfie required.
                        </p>
                      </div>
                      <button
                        onClick={handleMarkAttendance}
                        disabled={loading}
                        className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-violet-200"
                      >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={18} strokeWidth={3} />}
                        {loading ? 'WAITING...' : 'START CHECK-IN'}
                      </button>
                    </div>
                  )}

                  {step === 'camera' && (
                    <div className="p-6 flex flex-col items-center space-y-6">
                      <div className="w-full aspect-square bg-zinc-950 rounded-[32px] overflow-hidden relative border-4 border-zinc-50 shadow-2xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-4/5 h-4/5 border-2 border-white/30 rounded-full border-dashed" />
                        </div>
                      </div>
                      <button
                        onClick={captureSelfie}
                        className="w-16 h-16 bg-white border-[5px] border-violet-600 rounded-full flex items-center justify-center text-violet-600 shadow-2xl active:scale-90 transition-all"
                      >
                        <Camera size={28} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}

                  {step === 'preview' && (
                    <div className="p-6 flex flex-col items-center space-y-6">
                      <div className="w-full aspect-square bg-white rounded-[32px] overflow-hidden border-4 border-zinc-50 shadow-2xl">
                        <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => { setStep('camera'); setTimeout(startCamera, 100); }}
                          className="flex-1 h-12 bg-zinc-100 text-zinc-500 rounded-2xl text-xs font-black transition-colors"
                        >
                          RETAKE
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="flex-[2] h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-green-100"
                        >
                          {loading ? <Loader2 size={18} className="animate-spin" /> : 'SUBMIT ATTENDANCE'}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 'done' && (
                    <div className="flex flex-col items-center">
                       <div className="w-full p-4 bg-green-500 text-white flex flex-col items-center space-y-1">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                             <Check size={18} strokeWidth={4} />
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-widest">Marked Successfully</p>
                       </div>
                       
                       <div className="p-8 flex flex-col items-center space-y-6 w-full">
                          <div className="text-center">
                             <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-1">Time Captured</p>
                             <p className="text-2xl font-black text-zinc-900 tracking-tighter">{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</p>
                          </div>

                          {todayRecord?.selfie_url && (
                            <div className="relative w-48 aspect-square group">
                              <div className="absolute inset-0 bg-violet-600 rounded-[35px] rotate-6 scale-95 opacity-10 group-hover:rotate-0 transition-transform" />
                              <img 
                                src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                                alt="Verified" 
                                className="relative w-full h-full object-cover rounded-[35px] border-4 border-white shadow-xl shadow-zinc-200"
                              />
                            </div>
                          )}
                          
                          <Badge className="bg-zinc-900 text-white text-[9px] font-black py-1 px-4 rounded-full border-none tracking-widest uppercase">Verified Entry</Badge>
                       </div>
                    </div>
                  )}

                  {error && (
                    <div className="m-4 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] flex items-center gap-3 border border-red-100 animate-in zoom-in-95">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <p className="font-black uppercase tracking-tight">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-[24px] border border-zinc-100 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <Clock size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-300 font-black uppercase tracking-tighter mb-0.5">Work Status</p>
                    <p className="text-[11px] font-black text-zinc-800">Active</p>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-[24px] border border-zinc-100 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                    <CalendarIcon size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[8px] text-zinc-300 font-black uppercase tracking-tighter mb-0.5">Status</p>
                    <p className="text-[11px] font-black text-zinc-800">Present</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-500 pb-10">
              <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Recent Activity</h2>
              
              {historyLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-violet-200" size={32} /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-zinc-200 p-8">
                  <Clock className="text-zinc-200 mx-auto mb-4" size={32} />
                  <p className="text-xs text-zinc-400 font-bold italic">No attendance records found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-[24px] border border-zinc-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden shadow-inner">
                          {item.selfie_url ? (
                            <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover grayscale-[0.2]" alt="S" />
                          ) : <User size={16} className="text-zinc-300 m-3" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-black text-zinc-800 tracking-tight">{dayjs(item.date).format('DD MMM YYYY')}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                             <Clock size={10} /> {dayjs(item.check_in_time).format('hh:mm A')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter">Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-500 pb-10">
              <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-[40px] bg-white overflow-hidden text-center relative ring-1 ring-zinc-100">
                <div className="h-24 bg-gradient-to-tr from-violet-600 to-indigo-600" />
                <div className="relative -mt-10 mb-4">
                  <div className="w-20 h-20 bg-white rounded-[28px] mx-auto p-1 shadow-2xl shadow-violet-900/10">
                    <div className="w-full h-full bg-zinc-50 rounded-[22px] flex items-center justify-center text-zinc-300">
                      <User size={32} />
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 pt-0 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tighter">{teacher.name}</h2>
                    <p className="text-[10px] text-violet-600 font-black uppercase tracking-widest mt-0.5">{teacher.subject} Specialist</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-left">
                    {[
                      { icon: Badge, label: 'Monthly Salary', value: `₹${teacher.monthly_salary.toLocaleString('en-IN')}` },
                      { icon: CalendarIcon, label: 'Joined On', value: dayjs(teacher.created_at).format('MMM YYYY') },
                      { icon: Mail, label: 'Email Identity', value: teacher.email }
                    ].map((row, i) => (
                      <div key={i} className="p-3.5 bg-zinc-50 rounded-[20px] flex items-center justify-between border border-zinc-100/50">
                        <div className="flex items-center gap-3">
                           <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-zinc-300 shadow-sm"><row.icon size={14} /></div>
                           <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tight">{row.label}</p>
                        </div>
                        <p className="text-[11px] font-black text-zinc-900 truncate max-w-[150px]">{row.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* --- REIMAGINED BOTTOM DOCK --- */}
      <div className="fixed bottom-4 left-4 right-4 z-50">
        <nav className="bg-white/95 backdrop-blur-xl border border-zinc-200/50 rounded-[28px] px-6 py-2.5 flex justify-between items-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.02]">
          {[
            { id: 'history', label: 'Log', icon: HistoryIcon },
            { id: 'attendance', label: 'Home', icon: LayoutGrid },
            { id: 'profile', label: 'Me', icon: User },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${
                activeTab === tab.id ? 'text-violet-600 scale-110' : 'text-zinc-300'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all duration-300 ${
                activeTab === tab.id ? 'bg-violet-50' : ''
              }`}>
                <tab.icon size={22} strokeWidth={activeTab === tab.id ? 3 : 2} />
              </div>
              <span className={`text-[8px] font-black tracking-widest uppercase transition-opacity ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

    </div>
  )
}
