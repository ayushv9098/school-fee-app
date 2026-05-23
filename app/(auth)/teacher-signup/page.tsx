'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2 } from 'lucide-react'

function TeacherSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const teacherId = searchParams.get('teacher_id') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!teacherId) {
      setError('Invalid invite link. Missing teacher ID.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      console.log('🚀 Starting signup for:', emailParam)
      
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailParam,
        password,
      })

      if (signUpError) {
        console.error('❌ Supabase Auth Error:', signUpError)
        setError(signUpError.message)
        alert('Signup Error: ' + signUpError.message)
        setLoading(false)
        return
      }

      console.log('✅ Auth successful, user:', data.user?.id)

      if (data.user) {
        // frontend se update karne ke bajaye hum API call karenge (Service Role use karne ke liye)
        const linkRes = await fetch('/api/complete-teacher-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            teacherId: teacherId,
            role: 'teacher'
          })
        })

        const linkData = await linkRes.json()

        if (!linkRes.ok) {
          console.error('❌ Linking Failed:', linkData.error)
          alert('Account created but linking failed: ' + linkData.error)
          setLoading(false)
          return
        }

        console.log('✅ Teacher record linked successfully via API')

        // Handle Email Confirmation case
        if (data.user && !data.session) {
          alert('Account created! Please CHECK YOUR EMAIL for a confirmation link. Once verified, you can mark attendance. ✅')
          router.push('/login')
        } else {
          alert('Account created and verified! Redirecting... ✅')
          router.push('/teacher/attendance')
        }
        router.refresh()
      }
 else {
        alert('Signup failed: No user data returned from Supabase.')
      }
    } catch (err: any) {
      console.error('❌ Unexpected Catch Error:', err)
      alert('Unexpected Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-zinc-200 shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Teacher Sign Up</CardTitle>
        <CardDescription>Create your account to mark attendance</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={emailParam}
              disabled
              className="h-11 bg-zinc-100 text-zinc-500"
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
              required
              className="h-11"
            />
            <p className="text-xs text-zinc-400">Minimum 6 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !emailParam}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function TeacherSignupPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Ayushman Educational Academy</h1>
          <p className="text-sm text-zinc-500 mt-1">Teacher Portal</p>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        }>
          <TeacherSignupForm />
        </Suspense>

        <p className="text-center text-xs text-zinc-400 mt-6">
          © {new Date().getFullYear()} Designed & Developed by AV Infra
        </p>
      </div>
    </div>
  )
}
