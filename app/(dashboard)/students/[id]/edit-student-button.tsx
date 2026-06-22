'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CLASSES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, X } from 'lucide-react'
import { ContactPicker } from '@/components/contact-picker'
import { toast } from 'sonner'

interface Props {
  student: {
    id: string
    name: string
    class: string
    mobile: string
    email: string
    guardian_name: string
    address: string
    total_fee: number
    previous_dues: number
    status: string
    academic_year: string
    diary_page_number: string
  }
}

export default function EditStudentButton({ student }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: student.name || '',
    class: student.class || '',
    mobile: student.mobile || '',
    email: student.email || '',
    guardian_name: student.guardian_name || '',
    address: student.address || '',
    total_fee: String(student.total_fee || ''),
    previous_dues: String(student.previous_dues || '0'),
    status: student.status || 'active',
    academic_year: student.academic_year || '',
    diary_page_number: student.diary_page_number || '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Name required hai')
    if (!form.class) return setError('Class select karo')

    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('students')
      .update({
        name: form.name.trim(),
        class: form.class,
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        guardian_name: form.guardian_name.trim(),
        address: form.address.trim(),
        total_fee: Number(form.total_fee) || 0,
        previous_dues: Number(form.previous_dues) || 0,
        status: form.status,
        academic_year: form.academic_year.trim(),
        diary_page_number: form.diary_page_number.trim(),
      })
      .eq('id', student.id)

    if (updateError) {
      console.error('Update Student Error:', updateError)
      setError(`Database Error: ${updateError.message}`)
      toast.error('Student update nahi ho paaya', {
        description: updateError.message
      })
      setLoading(false)
      return
    }

    toast.success('Student data update ho gaya!')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 transition"
      >
        <Pencil className="w-4 h-4" />
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Edit Student</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:bg-zinc-800 transition"
              >
                <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    name="name"
                    placeholder="Student name"
                    value={form.name}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  <select
                    name="class"
                    value={form.class}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Mobile</Label>
                  <div className="relative">
                    <Input
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
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="parent@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Guardian Name</Label>
                <Input
                  name="guardian_name"
                  placeholder="Guardian name"
                  value={form.guardian_name}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Total Fee (Current Year)</Label>
                  <Input
                    name="total_fee"
                    type="number"
                    placeholder="Total fee amount"
                    value={form.total_fee}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Previous Dues (Arrears)</Label>
                  <Input
                    name="previous_dues"
                    type="number"
                    placeholder="Previous balance"
                    value={form.previous_dues}
                    onChange={handleChange}
                    className="h-11 text-amber-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Academic Year</Label>
                  <Input
                    name="academic_year"
                    placeholder="2025-26"
                    value={form.academic_year}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Student Status</Label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="alumni">Alumni / Pass-out</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Diary Page Number</Label>
                <Input
                  name="diary_page_number"
                  placeholder="Page number"
                  value={form.diary_page_number}
                  onChange={handleChange}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Address</Label>
                <textarea
                  name="address"
                  placeholder="Student address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}