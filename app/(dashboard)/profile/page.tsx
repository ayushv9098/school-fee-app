'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, LogOut, School, Download, Save, Pencil, MapPin, Map as MapIcon, Navigation, AlertTriangle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { ContactPicker } from '@/components/contact-picker'

const LiveMap = dynamic(() => import('@/components/live-map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-400">Initializing Map...</div>
})

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [locationEditing, setLocationEditing] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [school, setSchool] = useState({
    school_name: '',
    address: '',
    mobile: '',
    instagram: '',
    lat: null as number | null,
    lng: null as number | null,
    radius: '' as number | '',
    school_start_time: '09:30',
    school_end_time: '15:40',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: settings } = await supabase
          .from('school_settings')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle()
        if (settings) {
          setSchool({
            school_name: settings.school_name || '',
            address: settings.address || '',
            mobile: settings.mobile || '',
            instagram: settings.instagram || '',
            lat: settings.lat || null,
            lng: settings.lng || null,
            radius: settings.radius || '',
            school_start_time: settings.school_start_time ? settings.school_start_time.slice(0, 5) : '09:30',
            school_end_time: settings.school_end_time ? settings.school_end_time.slice(0, 5) : '15:40',
          })
        } else {
          setEditing(true)
        }
      }
    })
  }, [])

  async function handleSaveSchool() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('school_settings').upsert({
      user_id: user?.id,
      ...school,
    }, { onConflict: 'user_id' })

    if (error) {
      alert('Error saving settings: ' + error.message)
    } else {
      alert('Settings saved successfully! ✅')
      setEditing(false)
      setLocationEditing(false)
    }
    setSaving(false)
  }

  async function handleSetLocation() {
    setLocationLoading(true)
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSchool(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }))
        setLocationLoading(false)
        setLocationEditing(true)
      },
      (error) => {
        let msg = 'Error getting location'
        if (error.code === 1) msg = 'Location permission denied. Please enable GPS and allow access.'
        else if (error.code === 2) msg = 'Location unavailable. Try again or enter manually.'
        else if (error.code === 3) msg = 'Location request timed out. Try again or enter manually.'
        alert(msg)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">

      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Profile</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Your account & school information</p>
      </div>

      {/* School Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <School className="w-4 h-4 text-violet-600" />
              School Information
            </CardTitle>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-50 transition"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label>School Name</Label>
            <Input
              placeholder="Enter school name"
              value={school.school_name}
              onChange={e => setSchool(prev => ({ ...prev, school_name: e.target.value }))}
              className="h-11"
              disabled={!editing}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              placeholder="Enter school address"
              value={school.address}
              onChange={e => setSchool(prev => ({ ...prev, address: e.target.value }))}
              className="h-11"
              disabled={!editing}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <div className="relative">
                <Input
                  placeholder="Mobile number"
                  value={school.mobile}
                  onChange={e => setSchool(prev => ({ ...prev, mobile: e.target.value }))}
                  className="h-11 pr-10"
                  disabled={!editing}
                />
                <ContactPicker 
                  onSelect={(phone) => setSchool(prev => ({ ...prev, mobile: phone }))} 
                  disabled={!editing}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Instagram</Label>
              <Input
                placeholder="@username"
                value={school.instagram}
                onChange={e => setSchool(prev => ({ ...prev, instagram: e.target.value }))}
                className="h-11"
                disabled={!editing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">School Entry Time</Label>
              <Input
                type="time"
                value={school.school_start_time}
                onChange={e => setSchool(prev => ({ ...prev, school_start_time: e.target.value }))}
                className="h-11 font-medium"
                disabled={!editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">School Exit Time</Label>
              <Input
                type="time"
                value={school.school_end_time}
                onChange={e => setSchool(prev => ({ ...prev, school_end_time: e.target.value }))}
                className="h-11 font-medium"
                disabled={!editing}
              />
            </div>
          </div>

          {editing && (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-11 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchool}
                disabled={saving}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : <><Save className="w-4 h-4" />Save</>
                }
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* School Location Card */}
      <Card className={!school.lat ? 'border-amber-200 bg-amber-50/30' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-600" />
              School Location (Attendance)
            </CardTitle>
            <div className="flex items-center gap-2">
              {school.lat && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-[10px] font-bold text-green-700 uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                  Active
                </div>
              )}
              {!locationEditing && (
                <button
                  onClick={() => setLocationEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-50 transition"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-5">
          {!school.lat && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800">Attendance Not Active</p>
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  Set school location so teachers can mark attendance. You can detect it automatically or type it manually.
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-800">Attendance Location Setup:</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Click <b>"Auto-Detect"</b> while you are at school, or <b>enter coordinates</b> manually from Google Maps.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${school.lat ? 'bg-violet-100 text-violet-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                  <Navigation className={`w-5 h-5 ${locationLoading ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mb-2">GPS Coordinates</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-zinc-400 font-bold uppercase">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 28.1234"
                        value={school.lat ?? ''}
                        onChange={e => setSchool(prev => ({ ...prev, lat: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        className="h-9 text-[11px] font-mono"
                        disabled={!locationEditing}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-zinc-400 font-bold uppercase">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 77.1234"
                        value={school.lng ?? ''}
                        onChange={e => setSchool(prev => ({ ...prev, lng: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        className="h-9 text-[11px] font-mono"
                        disabled={!locationEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSetLocation}
                disabled={locationLoading || !locationEditing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm disabled:opacity-50"
              >
                {locationLoading ? 'Detecting...' : (school.lat ? 'Detect My Location Again' : 'Auto-Detect My Location')}
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Allowed Attendance Range</Label>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">How far can teachers be from school?</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="100"
                    value={school.radius}
                    onChange={e => {
                      setSchool(prev => ({ ...prev, radius: e.target.value === '' ? '' : Number(e.target.value) }));
                    }}
                    className="h-9 text-xs w-20 text-center font-bold"
                    disabled={!locationEditing}
                  />
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">meters</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[100, 200, 500, 1000].map((m) => (
                  <button
                    key={m}
                    disabled={!locationEditing}
                    onClick={() => {
                      setSchool(prev => ({ ...prev, radius: m }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                      school.radius === m 
                        ? 'bg-violet-600 text-white border-violet-600' 
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:bg-zinc-950'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {m === 1000 ? '1 KM' : `${m} Meters`}
                  </button>
                ))}
              </div>

              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                Teachers must be within <strong>{school.radius || 100} meters</strong> from the GPS center to mark attendance. 
                If your school building is large, select <strong>200</strong> or <strong>500</strong>.
              </p>
            </div>
          </div>

          {school.lat && school.lng && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight flex items-center gap-1.5">
                <MapIcon className="w-3 h-3 text-violet-600" />
                Live School Map & Teacher Tracking
              </p>
              <div className="h-80 w-full bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative group shadow-inner">
                <LiveMap 
                  schoolLat={school.lat} 
                  schoolLng={school.lng} 
                  radius={Number(school.radius) || 100} 
                />
              </div>
            </div>
          )}

          {(editing || locationEditing) && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditing(false)
                  setLocationEditing(false)
                }}
                className="flex-1 h-12 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchool}
                disabled={saving || locationLoading}
                className="flex-[2] h-12 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" />Save All Settings</>}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-violet-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <Mail className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{user?.email || '...'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Member Since</Label>
            <div className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }) : '...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card className="border-red-100">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Sign Out</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign out of your account</p>
            </div>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Signing out...' : 'Confirm Logout'}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
