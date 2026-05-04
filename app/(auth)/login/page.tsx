'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* School Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-violet-600 rounded-2xl mb-4">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Ayushman Educational Academy</h1>
          <p className="text-sm text-zinc-500 mt-1">Fee Management System</p>
        </div>

        {/* Card */}
        <Card className="border-zinc-200 shadow-sm rounded-2xl">
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
                className="w-full h-11 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Please wait...</>
                ) : isLogin ? 'Login In' : 'Create Account'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setName('')
                    setEmail('')
                    setPassword('')
                  }}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
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
          Shahdol, Madhya Pradesh
        </p>
      </div>
    </div>
  )
}