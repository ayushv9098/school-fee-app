'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ContactPicker } from '@/components/contact-picker'

import { useSession } from '@/lib/session-context'

export default function AddStudentPage() {
  const router = useRouter()
  const { academicYear: sessionYear } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    class: '',
    mobile: '',
    email: '',
    guardian_name: '',
    address: '',
    total_fee: '',
    previous_dues: '0',
    academic_year: sessionYear || '2025-26',
    diary_page_number: '',
    is_free: false,
  })

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      return setError('Name is required')
    }

    if (!form.class) {
      return setError('Please select a class')
    }

    if (!form.is_free && (!form.total_fee || Number(form.total_fee) <= 0))
       return setError('Please enter a valid fee')

    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('students').insert({
      name: form.name.trim(),
      class: form.class,
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      guardian_name: form.guardian_name.trim(),
      address: form.address.trim(),
      total_fee: form.is_free ? 0 : Number(form.total_fee),
      previous_dues: Number(form.previous_dues) || 0,
      academic_year: form.academic_year,
      diary_page_number: form.diary_page_number.trim(),
      user_id: user?.id,
    })

    if (error) {
      console.error(error)
      setError('Something went wrong — please try again')
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
          <Link
            href="/students"
            className="p-2 rounded-xl hover:bg-zinc-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>

          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              Add Student
            </h1>
            <p className="text-sm text-zinc-500">
              Add a new student
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Student Information
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name + Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Student name"
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
                    <option value="">Select Class</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile</Label>
                  <div className="relative">
                    <Input
                      id="mobile"
                      name="mobile"
                      placeholder="Mobile number"
                      value={form.mobile}
                      onChange={handleChange}
                      className="h-11 pr-10"
                    />
                    <ContactPicker 
                      onSelect={(phone) => setForm(prev => ({ ...prev, mobile: phone }))} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="parent@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Guardian Name */}
              <div className="space-y-1.5">
                <Label htmlFor="guardian_name">
                  Guardian Name
                </Label>
                <Input
                  id="guardian_name"
                  name="guardian_name"
                  placeholder="Guardian name"
                  value={form.guardian_name}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="total_fee">Total Fee (Current Year) *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_free"
                        checked={form.is_free}
                        onChange={e => setForm(prev => ({ 
                          ...prev, 
                          is_free: e.target.checked,
                          total_fee: e.target.checked ? '0' : prev.total_fee
                        }))}
                        className="w-4 h-4 accent-violet-600"
                      />
                      <label htmlFor="is_free" className="text-sm text-zinc-600">Free (no fees)</label>
                    </div>
                    <Input
                      id="total_fee"
                      name="total_fee"
                      type="number"
                      placeholder="Total fee amount"
                      value={form.total_fee}
                      onChange={handleChange}
                      disabled={form.is_free}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="previous_dues">Previous Dues (Arrears)</Label>
                  <Input
                    id="previous_dues"
                    name="previous_dues"
                    type="number"
                    placeholder="Old balance (if any)"
                    value={form.previous_dues}
                    onChange={handleChange}
                    className="h-11 mt-[26px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="academic_year">
                    Academic Year
                  </Label>
                  <Input
                    id="academic_year"
                    name="academic_year"
                    placeholder="2025-26"
                    value={form.academic_year}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="diary_page_number">
                    Diary Page Number
                  </Label>
                  <Input
                    id="diary_page_number"
                    name="diary_page_number"
                    placeholder="Page number"
                    value={form.diary_page_number}
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
                  placeholder="Student address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
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
                  {loading ? 'Saving...' : 'Add Student'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}