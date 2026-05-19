'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, LogOut, School, Download, Save, Pencil } from 'lucide-react'
import ImportStudents from './import-students'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [school, setSchool] = useState({
    school_name: '',
    address: '',
    mobile: '',
    instagram: '',
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
              <Input
                placeholder="Mobile number"
                value={school.mobile}
                onChange={e => setSchool(prev => ({ ...prev, mobile: e.target.value }))}
                className="h-11"
                disabled={!editing}
              />
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
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900">Sign Out</p>
              <p className="text-sm text-zinc-500">Sign out of your account</p>
            </div>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
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