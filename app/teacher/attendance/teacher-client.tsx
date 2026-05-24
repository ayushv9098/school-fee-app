'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, MapPin, CheckCircle, AlertTriangle, Loader2, Navigation, History, User, Clock, Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
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
      setError('GPS not supported')
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
          setError(`You are not in school premises. Distance: ${Math.round(dist)}m`)
          setLoading(false)
          return
        }

        setStep('camera')
        setTimeout(startCamera, 50)
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

      if (uploadError) throw new Error('Upload Fail: ' + uploadError.message)

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

      if (dbError) throw new Error('Database Fail: ' + dbError.message)
      
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 pb-20">
      
      {/* --- SLEEK HEADER --- */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-violet-100">
            <User size={16} />
          </div>
          <div>
            <h1 className="text-xs font-bold text-zinc-900 leading-none mb-0.5">{teacher.name}</h1>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none">Teacher</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-700 text-[10px] px-2 py-0 border-none hover:bg-green-100">
          Online
        </Badge>
      </div>

      <div className="flex-1 p-3 max-w-md mx-auto w-full space-y-4">
        
        {/* --- ATTENDANCE TAB --- */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
               <div className="bg-violet-600 p-3 py-4 text-white text-center">
                  <p className="text-violet-200 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    {dayjs().format('dddd, DD MMMM')}
                  </p>
                  <p className="text-2xl font-mono font-black tracking-tight">
                    {dayjs().format('hh:mm A')}
                  </p>
               </div>
              <CardContent className="p-4 flex flex-col items-center text-center space-y-4">
                
                {step === 'init' && (
                  <>
                    <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center text-violet-600">
                      <Navigation size={28} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-zinc-900">Mark Haazri</h2>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Tap button below to record your arrival.
                      </p>
                    </div>
                    <button
                      onClick={handleMarkAttendance}
                      disabled={loading}
                      className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-100 active:scale-95"
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={18} />}
                      {loading ? 'GPS Check...' : 'Mark Attendance'}
                    </button>
                  </>
                )}

                {step === 'camera' && (
                  <>
                    <div className="w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden relative shadow-inner">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none" />
                    </div>
                    <button
                      onClick={captureSelfie}
                      className="w-14 h-14 bg-white border-4 border-violet-100 rounded-full flex items-center justify-center text-violet-600 shadow-xl active:scale-90 transition-transform"
                    >
                      <Camera size={24} />
                    </button>
                    <p className="text-xs font-bold text-zinc-400">Position face & tap button</p>
                  </>
                )}

                {step === 'preview' && (
                  <>
                    <div className="w-full aspect-video bg-zinc-100 rounded-xl overflow-hidden border-2 border-white shadow-md">
                      <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2 w-full pt-1">
                      <button
                        onClick={() => { setStep('camera'); setTimeout(startCamera, 50); }}
                        className="flex-1 h-11 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold transition"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-green-100"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Confirm & Submit
                      </button>
                    </div>
                  </>
                )}

                {step === 'done' && (
                  <>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle size={24} />
                    </div>
                    <div className="space-y-0.5">
                      <h2 className="text-sm font-bold text-zinc-900">Attendance Marked!</h2>
                      <p className="text-[10px] text-zinc-400">
                        Check-in at: <span className="font-bold text-zinc-800 uppercase">{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</span>
                      </p>
                    </div>
                    {todayRecord?.selfie_url && (
                      <div className="w-full max-w-[200px] aspect-square bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm">
                        <img 
                          src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                          alt="Selfie" 
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] flex items-start gap-2 w-full text-left border border-red-100">
                    <AlertTriangle className="flex-shrink-0" size={14} />
                    <p className="font-medium">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Clock size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] text-zinc-400 font-bold uppercase truncate">Working</p>
                  <p className="text-xs font-bold text-zinc-900 truncate">Active</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 flex-shrink-0">
                  <CalendarIcon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] text-zinc-400 font-bold uppercase truncate">Today</p>
                  <p className="text-xs font-bold text-zinc-900 truncate">Present</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in duration-500 pb-10">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">Your Haazri Log</h2>
              <button onClick={fetchHistory} className="text-[10px] font-bold text-violet-600">Sync</button>
            </div>
            
            {historyLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-violet-600 opacity-30" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-zinc-200">
                <Clock className="mx-auto text-zinc-200 mb-2" size={24} />
                <p className="text-[11px] text-zinc-400">Log is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(item => (
                  <div key={item.id} className="bg-white p-2.5 rounded-2xl border border-zinc-100 flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-300 overflow-hidden border border-zinc-100">
                        {item.selfie_url ? (
                          <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover" alt="S" />
                        ) : <User size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-800">{dayjs(item.date).format('DD MMM YYYY')}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">{dayjs(item.check_in_time).format('hh:mm A')}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-50 text-green-600 text-[8px] font-bold border-none h-5 px-2">P</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in duration-500 pb-10">
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden text-center">
              <div className="h-16 bg-gradient-to-r from-violet-600 to-indigo-600" />
              <div className="-mt-8 mb-3">
                <div className="w-16 h-16 bg-white rounded-full mx-auto p-1 shadow-md">
                  <div className="w-full h-full bg-violet-50 rounded-full flex items-center justify-center text-violet-600">
                    <User size={32} />
                  </div>
                </div>
              </div>
              <CardContent className="p-5 pt-0 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">{teacher.name}</h2>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{teacher.subject} Dept</p>
                </div>
                
                <div className="space-y-2 text-left">
                  <div className="p-3 bg-zinc-50 rounded-xl flex items-center justify-between border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Monthly Salary</p>
                    <p className="text-xs font-bold text-zinc-900">₹{teacher.monthly_salary.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl flex items-center justify-between border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Member Since</p>
                    <p className="text-xs font-bold text-zinc-800">{dayjs(teacher.created_at).format('MMM YYYY')}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase mb-0.5">Email</p>
                    <p className="text-xs font-medium text-zinc-600 truncate">{teacher.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* --- MINIMAL BOTTOM NAV --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-100 px-8 py-2 pb-6 z-40 flex justify-between items-center shadow-lg">
        {[
          { id: 'history', label: 'Log', icon: History },
          { id: 'attendance', label: 'Home', icon: Navigation },
          { id: 'profile', label: 'Me', icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id ? 'text-violet-600 scale-110' : 'text-zinc-300'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === tab.id ? 'bg-violet-50' : ''}`}>
              <tab.icon size={18} strokeWidth={activeTab === tab.id ? 3 : 2} />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}
