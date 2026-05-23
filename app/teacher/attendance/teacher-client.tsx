'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Camera, MapPin, CheckCircle, AlertTriangle, Loader2, Navigation } from 'lucide-react'
import dayjs from 'dayjs'

interface Props {
  teacher: any
  schoolSettings: any
  todayRecord: any
}

export default function TeacherAttendanceClient({ teacher, schoolSettings, todayRecord }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(todayRecord ? 'done' : 'init')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [distance, setDistance] = useState<number | null>(null)
  const [selfie, setSelfie] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    // Step 1: GPS Check
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
          setError(`You are not in school premises. Current distance: ${Math.round(dist)} meters. (Allowed: ${radius}m)`)
          setLoading(false)
          return
        }

        // Step 2: Camera Step
        setStep('camera')
        startCamera()
        setLoading(false)
      },
      (err) => {
        setError('Could not get GPS location: ' + err.message)
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
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach(track => track.stop())
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      if (!selfie) return

      // Convert dataUrl to blob
      const res = await fetch(selfie)
      const blob = await res.blob()
      
      const fileName = `${teacher.id}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.jpg`
      const filePath = `selfies/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, blob)

      if (uploadError) throw uploadError

      // Save to Database
      const { error: dbError } = await supabase
        .from('attendance')
        .insert({
          teacher_id: teacher.id,
          admin_id: teacher.user_id,
          date: dayjs().format('YYYY-MM-DD'),
          check_in: new Date().toISOString(),
          selfie_url: filePath,
          status: 'present'
        })

      if (dbError) throw dbError

      setStep('done')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center p-6 sm:p-10">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900">Attendance</h1>
          <p className="text-zinc-500">{dayjs().format('dddd, D MMMM YYYY')}</p>
          <p className="text-3xl font-mono font-bold text-violet-600">{dayjs().format('hh:mm A')}</p>
        </div>

        <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            
            {step === 'init' && (
              <>
                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 animate-pulse">
                  <Navigation size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-zinc-900">Mark Attendance</h2>
                  <p className="text-sm text-zinc-500">Please ensure you are within school premises before clicking below.</p>
                </div>
                <button
                  onClick={handleMarkAttendance}
                  disabled={loading}
                  className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-lg font-bold transition flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <MapPin />}
                  {loading ? 'Verifying GPS...' : 'Mark Attendance'}
                </button>
              </>
            )}

            {step === 'camera' && (
              <>
                <div className="w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-4 border-violet-500/30 rounded-2xl pointer-events-none" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-zinc-900">Take a Selfie</h2>
                  <p className="text-sm text-zinc-500">Look at the camera and smile! 📸</p>
                </div>
                <button
                  onClick={captureSelfie}
                  className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-lg font-bold transition flex items-center justify-center gap-3"
                >
                  <Camera />
                  Capture Photo
                </button>
              </>
            )}

            {step === 'preview' && (
              <>
                <div className="w-full aspect-square bg-zinc-100 rounded-2xl overflow-hidden border-2 border-violet-100">
                  <img src={selfie!} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-zinc-900">Confirm Selfie</h2>
                  <p className="text-sm text-zinc-500">Does this look good?</p>
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => { setStep('camera'); startCamera(); }}
                    className="flex-1 h-14 bg-zinc-100 text-zinc-600 rounded-2xl font-bold transition"
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                    Submit
                  </button>
                </div>
              </>
            )}

            {step === 'done' && (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 scale-110">
                  <CheckCircle size={40} className="animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-zinc-900">Attendance Marked!</h2>
                  <p className="text-sm text-zinc-500">
                    Already marked today at {dayjs(todayRecord?.check_in).format('hh:mm A')}
                  </p>
                </div>
                {todayRecord?.selfie_url && (
                  <div className="w-full aspect-square bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200">
                    <img 
                      src={supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl} 
                      alt="Today's Selfie" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="pt-4 w-full">
                   <div className="bg-zinc-50 rounded-2xl p-4 flex items-center gap-3">
                      <MapPin className="text-zinc-400" size={18} />
                      <p className="text-xs text-zinc-500">Verified by School GPS Location</p>
                   </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 w-full text-left">
                <AlertTriangle className="flex-shrink-0" size={18} />
                <p>{error}</p>
              </div>
            )}

          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />

        <p className="text-center text-xs text-zinc-400">
          © 2026 Ayushman Educational Academy
        </p>

      </div>
    </div>
  )
}
