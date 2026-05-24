'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, MapPin, CheckCircle, AlertTriangle, Loader2, Navigation, History, User, Clock, Calendar as CalendarIcon } from 'lucide-react'
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

      console.log('📤 Uploading photo to storage...')
      const { error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, blob)

      if (uploadError) {
        console.error('❌ Upload Error:', uploadError)
        throw new Error('Photo Upload Failed: ' + uploadError.message)
      }

      console.log('📝 Inserting record into database...')
      const { error: dbError } = await supabase
        .from('attendance')
        .insert({
          teacher_id: teacher.id,
          admin_user_id: teacher.user_id, 
          admin_id: teacher.user_id, // Populating both just in case
          date: dayjs().format('YYYY-MM-DD'),
          check_in_time: new Date().toISOString(),
          selfie_url: filePath,
          status: 'present'
        })

      if (dbError) {
        console.error('❌ Database Error:', dbError)
        throw new Error('Database Saving Failed: ' + dbError.message)
      }
      
      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 pb-20">
      
      {/* Tabs */}
      <div className="flex bg-white border-b border-zinc-100 sticky top-[53px] z-20">
        {[
          { id: 'attendance', label: 'Attendance', icon: CheckCircle },
          { id: 'history', label: 'History', icon: History },
          { id: 'profile', label: 'Profile', icon: User },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === tab.id ? 'text-violet-600' : 'text-zinc-400'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 w-12 h-0.5 bg-violet-600 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-y-auto max-w-md mx-auto w-full">
        
        {/* --- ATTENDANCE TAB --- */}
        {activeTab === 'attendance' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center py-2">
              <p className="text-sm font-medium text-zinc-500">{dayjs().format('dddd, D MMMM YYYY')}</p>
              <p className="text-2xl font-mono font-bold text-zinc-900">{dayjs().format('hh:mm A')}</p>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-5">
                
                {step === 'init' && (
                  <>
                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                      <Navigation size={32} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900">Mark Your Attendance</h2>
                      <p className="text-xs text-zinc-500 px-4">Ensure you are inside the school premises to mark attendance.</p>
                    </div>
                    <button
                      onClick={handleMarkAttendance}
                      disabled={loading}
                      className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-violet-200"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                      {loading ? 'Verifying GPS...' : 'Check-in Now'}
                    </button>
                  </>
                )}

                {step === 'camera' && (
                  <>
                    <div className="w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden relative shadow-inner">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-violet-500/20 rounded-xl pointer-events-none" />
                    </div>
                    <button
                      onClick={captureSelfie}
                      className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                    >
                      <Camera size={18} />
                      Capture Photo
                    </button>
                  </>
                )}

                {step === 'preview' && (
                  <>
                    <div className="w-full aspect-square bg-zinc-100 rounded-xl overflow-hidden border border-zinc-100 shadow-sm">
                      <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => { setStep('camera'); setTimeout(startCamera, 100); }}
                        className="flex-1 h-11 bg-zinc-100 text-zinc-600 rounded-xl text-sm font-bold transition"
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2] h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-green-100"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Submit Attendance
                      </button>
                    </div>
                  </>
                )}

                {step === 'done' && (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle size={32} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900">Attendance Marked!</h2>
                      <p className="text-xs text-zinc-500">
                        Check-in at: <span className="font-bold text-zinc-900">{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</span>
                      </p>
                    </div>
                    {todayRecord?.selfie_url && (
                      <div className="w-full aspect-square bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                        <img 
                          src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                          alt="Today's Selfie" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-start gap-2 w-full text-left border border-red-100">
                    <AlertTriangle className="flex-shrink-0" size={14} />
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Recent Records</h2>
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-violet-600" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-zinc-200">
                <Clock className="mx-auto text-zinc-300 mb-2" size={32} />
                <p className="text-sm text-zinc-400">No records found yet</p>
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-xl border border-zinc-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 overflow-hidden border border-zinc-100">
                      {item.selfie_url ? (
                        <img src={supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl} className="w-full h-full object-cover" alt="S" />
                      ) : <User size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">{dayjs(item.date).format('DD MMM YYYY')}</p>
                      <p className="text-[11px] text-zinc-500">{dayjs(item.check_in).format('hh:mm A')}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-50">Present</Badge>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden text-center">
              <div className="h-20 bg-violet-600" />
              <div className="-mt-10 mb-4">
                <div className="w-20 h-20 bg-white rounded-full mx-auto p-1 shadow-sm">
                  <div className="w-full h-full bg-violet-100 rounded-full flex items-center justify-center text-violet-600">
                    <User size={40} />
                  </div>
                </div>
              </div>
              <CardContent className="p-6 pt-0 space-y-1">
                <h2 className="text-xl font-bold text-zinc-900">{teacher.name}</h2>
                <p className="text-sm text-zinc-500">{teacher.subject} Teacher</p>
                <div className="pt-6 grid grid-cols-2 gap-3 text-left">
                  <div className="p-3 bg-zinc-50 rounded-xl">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Monthly Salary</p>
                    <p className="text-sm font-bold text-zinc-900">₹{teacher.monthly_salary}</p>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-xl">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Status</p>
                    <p className="text-sm font-bold text-green-600">Active</p>
                  </div>
                </div>
                <div className="pt-3 p-3 bg-zinc-50 rounded-xl text-left">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Email Address</p>
                  <p className="text-sm font-medium text-zinc-900">{teacher.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Footer Branding */}
      <div className="text-center py-4">
        <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold">
          Ayushman Educational Academy
        </p>
      </div>

    </div>
  )
}
