'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, LogOut, School } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Profile</h1>
        <p className="text-sm text-zinc-500">Your account information</p>
      </div>

      {/* School Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <School className="w-4 h-4 text-violet-600" />
            School Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Ayushman Educational Academy</p>
              <p className="text-sm text-zinc-500">Kundiya Dhaga Road, Semli Bari</p>
              <p className="text-sm text-zinc-500">📞 9098293521</p>
            </div>
          </div>
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
            <Label>Account ID</Label>
            <div className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <User className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400 truncate">{user?.id || '...'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Member Since</Label>
            <div className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 bg-zinc-50">
              <span className="text-sm text-zinc-700">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : '...'}
              </span>
            </div>
          </div>
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