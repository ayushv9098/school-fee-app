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
  ChevronRight, Sparkles, Check, X, ArrowRight, Mail, Home
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
      const { error: dbError } = await supabase.from('attendance').insert({
        teacher_id: teacher.id,
        admin_user_id: teacher.user_id, 
        admin_id: teacher.user_id, 
        date: dayjs().format('YYYY-MM-DD'),
        check_in_time: new Date().toISOString(),
        selfie_url: filePath,
        status: 'present'
      })
      if (dbError) throw new Error('Database Fail')
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-57px)] bg-[#F9FAFC] text-zinc-900 overflow-hidden relative">
      
      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 max-w-md mx-auto w-full space-y-5">
          
          {/* --- ATTENDANCE TAB --- */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              
              {/* Sleek Clock Card */}
              <div className="bg-violet-600 rounded-3xl p-5 text-white shadow-lg shadow-violet-200">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <CalendarIcon size={14} className="text-violet-200" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-violet-100">{dayjs().format('ddd, DD MMM')}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-none text-[9px] font-bold uppercase">Live Time</Badge>
                 </div>
                 <p className="text-4xl font-mono font-black tracking-tighter">
                    {dayjs().format('hh:mm')}
                    <span className="text-lg font-bold ml-1 opacity-80">{dayjs().format('A')}</span>
                 </p>
              </div>

              <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden ring-1 ring-zinc-100">
                <CardContent className="p-0">
                  
                  {step === 'init' && (
                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                        <MapPin size={32} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-base font-black text-zinc-800 uppercase tracking-tight">Daily Check-in</h2>
                        <p className="text-[11px] text-zinc-400 font-medium px-4 leading-relaxed">
                          Verify location and snap a selfie to mark attendance.
                        </p>
                      </div>
                      <button
                        onClick={handleMarkAttendance}
                        disabled={loading}
                        className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                        className="w-16 h-16 bg-white border-[6px] border-violet-600 rounded-full flex items-center justify-center text-violet-600 shadow-xl active:scale-90 transition-all"
                      >
                        <Camera size={24} strokeWidth={3} />
                      </button>
                    </div>
                  )}

                  {step === 'preview' && (
                    <div className="p-6 flex flex-col items-center space-y-6">
                      <div className="w-full aspect-square bg-white rounded-[32px] overflow-hidden border-4 border-zinc-50 shadow-xl">
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
                          className="flex-[2] h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-xs font-black transition-all"
                        >
                          {loading ? <Loader2 size={18} className="animate-spin" /> : 'SUBMIT'}
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 'done' && (
                    <div className="flex flex-col items-center">
                       <div className="w-full p-3 bg-green-500 text-white flex items-center justify-center gap-2">
                          <CheckCircle size={16} strokeWidth={3} />
                          <p className="text-[10px] font-black uppercase tracking-widest">Attendance Verified</p>
                       </div>
                       
                       <div className="p-6 flex flex-col items-center space-y-4 w-full">
                          <div className="text-center">
                             <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest mb-0.5">Recorded At</p>
                             <p className="text-xl font-black text-zinc-900 tracking-tight">{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</p>
                          </div>

                          {todayRecord?.selfie_url && (
                            <div className="w-40 aspect-square bg-white p-1 rounded-[32px] border border-zinc-100 shadow-md">
                              <img 
                                src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                                alt="Selfie" 
                                className="w-full h-full object-cover rounded-[28px]"
                              />
                            </div>
                          )}
                          <Badge className="bg-zinc-50 text-zinc-400 border-none text-[8px] font-black tracking-widest">DIGITAL LOG: {todayRecord?.id.slice(0,8)}</Badge>
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

              {/* Status Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-[24px] border border-zinc-100 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Clock size={16} /></div>
                  <div><p className="text-[8px] text-zinc-300 font-black uppercase mb-0.5">Shift</p><p className="text-[11px] font-black text-zinc-800">Active</p></div>
                </div>
                <div className="bg-white p-3.5 rounded-[24px] border border-zinc-100 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><CalendarIcon size={16} /></div>
                  <div><p className="text-[8px] text-zinc-300 font-black uppercase mb-0.5">Status</p><p className="text-[11px] font-black text-zinc-800">Present</p></div>
                </div>
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-500">
              <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">Recent Activity</h2>
              {historyLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-violet-200" size={32} /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-zinc-200"><p className="text-xs text-zinc-400 font-bold">No records found</p></div>
              ) : (
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-[24px] border border-zinc-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden">
                          {item.selfie_url ? (
                            <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover grayscale-[0.2]" alt="S" />
                          ) : <User size={16} className="text-zinc-300 m-3" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-800 leading-tight">{dayjs(item.date).format('DD MMM YYYY')}</p>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">{dayjs(item.check_in_time).format('hh:mm A')}</p>
                        </div>
                      </div>
                      <div className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-tighter">Verified</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-500">
              <Card className="border-none shadow-sm rounded-[32px] bg-white overflow-hidden text-center relative ring-1 ring-zinc-100">
                <div className="h-20 bg-gradient-to-tr from-violet-600 to-indigo-600" />
                <div className="relative -mt-8 mb-4">
                  <div className="w-20 h-20 bg-white rounded-full mx-auto p-1 shadow-md">
                    <div className="w-full h-full bg-violet-100 rounded-full flex items-center justify-center text-violet-600"><User size={40} /></div>
                  </div>
                </div>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-zinc-900 tracking-tight leading-none">{teacher.name}</h2>
                    <p className="text-[9px] text-violet-600 font-black uppercase tracking-widest mt-1">{teacher.subject} Specialist</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-left">
                    {[
                      { icon: Badge, label: 'Salary', value: `₹${teacher.monthly_salary.toLocaleString('en-IN')}` },
                      { icon: CalendarIcon, label: 'Joined', value: dayjs(teacher.created_at).format('MMM YYYY') },
                      { icon: Mail, label: 'Email', value: teacher.email }
                    ].map((row, i) => (
                      <div key={i} className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between border border-zinc-100/50">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{row.label}</p>
                        <p className="text-[10px] font-black text-zinc-900 truncate max-w-[150px]">{row.value}</p>
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

      {/* --- FIXED BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 z-50">
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
              <span className={`text-[9px] font-black tracking-widest uppercase ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

    </div>
  )
}
