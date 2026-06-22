'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2, Download, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function TeacherLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBtn(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', () => {
      setShowInstallBtn(false)
      setDeferredPrompt(null)
    })
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBtn(false)
    }
    setDeferredPrompt(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      if (data.user) {
        // Verify if the user is actually a teacher
        const { data: teacher, error: roleError } = await supabase
          .from('teachers')
          .select('role')
          .eq('auth_user_id', data.user.id)
          .maybeSingle()

        if (roleError || !teacher || teacher.role !== 'teacher') {
          // If not a teacher, logout and show error
          await supabase.auth.signOut()
          setError('This account is not registered as a teacher.')
          setLoading(false)
          return
        }

        router.push('/teacher/attendance')
        router.refresh()
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-200">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Ayushman Educational Academy</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium tracking-tight">Teacher Portal Login</p>
        </div>

        {showInstallBtn && (
          <button 
            onClick={handleInstall}
            className="w-full mb-6 bg-white dark:bg-zinc-900 border border-violet-100 p-4 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-95 group relative overflow-hidden text-sans"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 animate-shimmer" />
            <div className="w-11 h-11 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200 shrink-0 group-hover:scale-110 transition-transform">
              <Download size={20} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Install Official App</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">Faster access & offline attendance tracking</p>
            </div>
            <div className="ml-auto w-8 h-8 bg-violet-50 rounded-full flex items-center justify-center text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={14} strokeWidth={3} />
            </div>
          </button>
        )}

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-lg font-bold text-zinc-800">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium">Sign in to mark your daily attendance</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@school.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 focus:border-violet-500 font-medium px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 focus:border-violet-500 font-medium px-4"
                />
              </div>

              {error && (
                <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-3 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition shadow-lg shadow-violet-200 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In Now'}
                {!loading && <ArrowRight size={18} />}
              </button>

              <div className="text-center pt-4">
                <p className="text-xs text-zinc-400 font-medium">
                  Don't have an account?{' '}
                  <span className="text-violet-600 font-bold hover:underline cursor-help" title="Use the invite link sent by your school admin to sign up.">
                    Ask Admin for Invite
                  </span>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-zinc-400 mt-8 font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} Designed & Developed by AV Infra
        </p>
      </div>
    </div>
  )
}
