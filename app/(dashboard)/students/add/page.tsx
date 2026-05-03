'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    class: '',
    mobile: '',
    guardian_name: '',
    address: '',
    total_fee: '',
    academic_year: '2025-26',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Name required hai')
    if (!form.class) return setError('Class select karo')
    if (!form.total_fee || Number(form.total_fee) <= 0) return setError('Valid fee daalo')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('students').insert({
      name: form.name.trim(),
      class: form.class,
      mobile: form.mobile.trim(),
      guardian_name: form.guardian_name.trim(),
      address: form.address.trim(),
      total_fee: Number(form.total_fee),
      academic_year: form.academic_year,
    })
    if (error) {
      setError('Kuch galat hua — dobara try karo')
      setLoading(false)
      return
    }
    router.push('/students')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/students" className="p-2 rounded-xl hover:bg-zinc-100 transition">
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Add Student</h1>
            <p className="text-sm text-zinc-500">Naya student add karo</p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Student ka naam"
                    value={form.name}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="class">Class *</Label>
                  <select
                    id="class"
                    name="class"
                    value={form.class}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Class select karo</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    name="mobile"
                    placeholder="Mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guardian_name">Guardian Name</Label>
                  <Input
                    id="guardian_name"
                    name="guardian_name"
                    placeholder="Guardian ka naam"
                    value={form.guardian_name}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="total_fee">Total Fee *</Label>
                  <Input
                    id="total_fee"
                    name="total_fee"
                    type="number"
                    placeholder="Total fee amount"
                    value={form.total_fee}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    name="academic_year"
                    placeholder="2025-26"
                    value={form.academic_year}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  name="address"
                  placeholder="Student ka address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/students"
                  className="h-11 flex items-center justify-center rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition sm:flex-1"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50 sm:flex-1"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                    : 'Student Add Karo'
                  }
                </button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}