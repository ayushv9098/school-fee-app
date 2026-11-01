'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Warm up and prefetch target routes in advance for instant navigation
  useEffect(() => {
    router.prefetch('/dashboard')
    router.prefetch('/teacher/attendance')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Safety timeout in case navigation or network hangs unexpectedly
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 15000)

    const supabase = createClient()

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          clearTimeout(safetyTimeout)
          setError(signInError.message === 'Invalid login credentials' ? 'Invalid email or password' : signInError.message)
          setLoading(false)
          return
        }

        // Fast role determination
        let targetRoute = '/dashboard'
        const metaRole = data.user?.user_metadata?.role

        let finalRole = 'admin'
        if (metaRole === 'teacher') {
          targetRoute = '/teacher/attendance'
          finalRole = 'teacher'
        } else {
          try {
            const { data: teacher } = await Promise.race([
              supabase
                .from('teachers')
                .select('role')
                .eq('auth_user_id', data.user?.id)
                .maybeSingle(),
              new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 800))
            ])

            if (teacher?.role === 'teacher') {
              targetRoute = '/teacher/attendance'
              finalRole = 'teacher'
            } else if (teacher?.role === 'attendance_staff') {
              targetRoute = '/student-attendance'
              finalRole = 'attendance_staff'
            }
          } catch {
            targetRoute = '/dashboard'
          }
        }

        // Set role cookie for instant 0ms middleware verification
        if (typeof document !== 'undefined') {
          document.cookie = `user-role=${finalRole}; path=/; max-age=604800; SameSite=Lax`
        }

        // Navigate to target route immediately
        router.push(targetRoute)
        // Keep loading=true so button stays active with spinner and doesn't re-enable before transition
        return
      } else {
        if (!name.trim()) {
          clearTimeout(safetyTimeout)
          setError('Full name is required')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          clearTimeout(safetyTimeout)
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() }
          }
        })

        if (signUpError) {
          clearTimeout(safetyTimeout)
          setError(signUpError.message)
          setLoading(false)
          return
        }

        if (data?.user) {
          // If user exists already (Supabase returns empty identities)
          if (data.user.identities && data.user.identities.length === 0) {
            clearTimeout(safetyTimeout)
            setError('An account with this email already exists. Please log in.')
            setLoading(false)
            return
          }

          // Check if this email was invited as a teacher (via server API)
          try {
            const res = await fetch('/api/complete-teacher-signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                email: email.trim(),
                role: 'teacher'
              })
            })
            const resData = await res.json()
            if (resData?.linked) {
              alert('Teacher account linked! Redirecting to attendance... ✅')
              router.push('/teacher/attendance')
              return
            }
          } catch (linkErr) {
            console.error('Teacher link error:', linkErr)
          }

          router.push('/dashboard')
        } else {
          router.push('/dashboard')
        }
        // Keep loading=true while redirecting
        return
      }
    } catch (err: any) {
      clearTimeout(safetyTimeout)
      console.error('Auth submit error:', err)
      setError(err?.message || 'Failed to connect. Please check your internet connection.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Live Tech Grid Background */}
      <div className="tech-grid"></div>

      <div className="w-full max-w-md relative z-10">

        {/* School Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-md shadow-violet-500/10 mb-4 p-1.5 transition-transform hover:scale-105">
            <Image
              src="/logo-crest.png"
              alt="Ayushman Educational Academy Logo"
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Ayushman Educational Academy</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">School Management System</p>
        </div>

        {/* Card */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Register a new account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name - only signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={loading}
                    required
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11"
                />
                {!isLogin && (
                  <p className="text-xs text-zinc-400">Minimum 6 characters</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{isLogin ? 'Logging in...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{isLogin ? 'Log In' : 'Create Account'}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setName('')
                    setEmail('')
                    setPassword('')
                  }}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50"
                >
                  {isLogin
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Login In"
                  }
                </button>
              </div>

            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-400 mt-6">
        © 2026 built by AV Infratech
        </p>
      </div>
    </div>
  )
}
