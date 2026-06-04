'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, LogOut, School, Download, Save, Pencil, MapPin, Map as MapIcon, Navigation, AlertTriangle } from 'lucide-react'
import ImportStudents from './import-students'
import { ContactPicker } from '@/components/contact-picker'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [school, setSchool] = useState({
    school_name: '',
    address: '',
    mobile: '',
    instagram: '',
    lat: null as number | null,
    lng: null as number | null,
    radius: 100,
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
            radius: settings.radius || 100,
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
    await supabase.from('school_settings').upsert({
      user_id: user?.id,
      ...school,
    }, { onConflict: 'user_id' })
    setSaving(false)
    setEditing(false)
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
        setEditing(true) // Open editing mode to save
      },
      (error) => {
        alert('Error getting location: ' + error.message)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true }
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
        <h1 className="text-lg font-semibold text-zinc-900">Profile</h1>
        <p className="text-sm text-zinc-500">Your account & school information</p>
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
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Entry Time</Label>
              <Input
                type="time"
                value={school.school_start_time}
                onChange={e => setSchool(prev => ({ ...prev, school_start_time: e.target.value }))}
                className="h-11 font-medium"
                disabled={!editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Exit Time</Label>
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
                className="flex-1 h-11 flex items-center justify-center rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
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
            {school.lat && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-[10px] font-bold text-green-700 uppercase tracking-wider">
                <div className="w-1 h-1 rounded-full bg-green-600 animate-pulse" />
                Active
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-5">
          {!school.lat && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800">Attendance Not Active</p>
                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                  You must set the school location before teachers can mark attendance. 
                  Please go to the school premises and click <strong>"Set Current GPS"</strong>.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-800">How to set your school location:</p>
            <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4">
              <li>Open this page while you are <strong>physically present</strong> at the school.</li>
              <li>Click <strong>"Set Current GPS"</strong> to save your current location.</li>
              <li>Teachers will only be able to mark attendance when they are inside this area.</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${school.lat ? 'bg-violet-100 text-violet-600' : 'bg-zinc-100 text-zinc-400'}`}>
                  <Navigation className={`w-5 h-5 ${locationLoading ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Current GPS Center</p>
                  <p className="text-[11px] font-mono text-zinc-500">
                    {school.lat ? `${school.lat.toFixed(6)}, ${school.lng?.toFixed(6)}` : 'Not set yet'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSetLocation}
                disabled={locationLoading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm w-full sm:w-auto ${
                  !school.lat 
                    ? 'bg-violet-600 text-white hover:bg-violet-700' 
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {locationLoading ? 'Getting Location...' : (school.lat ? 'Update GPS Location' : 'Set Current GPS')}
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-900">Allowed Attendance Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="100"
                    value={school.radius}
                    onChange={e => setSchool(prev => ({ ...prev, radius: Number(e.target.value) }))}
                    className="h-9 text-xs w-24 text-center font-bold"
                    disabled={!editing}
                  />
                  <span className="text-xs font-medium text-zinc-500">meters</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 bg-zinc-50 p-2 rounded-lg border border-dashed border-zinc-200">
                Teachers must be within <strong>{school.radius} meters</strong> from the GPS center to mark attendance. 
                If your school building is large, increase this to 200 or 300 meters.
              </p>
            </div>
          </div>

          {school.lat && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <MapIcon className="w-3.5 h-3.5 text-violet-600" />
                Location Preview (approx center)
              </p>
              <div className="aspect-video w-full bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 relative group">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${school.lat},${school.lng}&zoom=18`}
                  allowFullScreen
                ></iframe>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 backdrop-blur-[1px]">
                    <div className="text-center p-4">
                      <MapIcon className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-[10px] text-zinc-500">Tap below to see your school boundary on Map</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${school.lat},${school.lng}`} 
                        target="_blank" 
                        className="mt-3 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-violet-600 hover:bg-violet-50 transition shadow-sm inline-block"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {editing && (
            <button
              onClick={handleSaveSchool}
              disabled={saving}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition shadow-md"
            >
              {saving ? 'Saving...' : <><Save className="w-4 h-4" />Save All Settings</>}
            </button>
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
            <div className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <Mail className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-700">{user?.email || '...'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Member Since</Label>
            <div className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <span className="text-sm text-zinc-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                }) : '...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            Import Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ImportStudents />
        </CardContent>
      </Card>

      {/* Logout Card */}
      <Card className="border-red-100">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-zinc-900">Sign Out</p>
              <p className="text-sm text-zinc-500">Sign out of your account</p>
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
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
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