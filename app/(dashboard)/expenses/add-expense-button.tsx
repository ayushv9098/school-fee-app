'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

const CATEGORIES = ['Salary', 'Fuel', 'Electricity', 'Rent', 'Maintenance', 'Gas', 'Other']

export default function AddExpenseButton() {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Salary')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amt = Number(amount)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!amt || amt <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Authentication error. Please log in again.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      title: title.trim(),
      amount: amt,
      category,
      date,
      note: note.trim() || null,
    })

    if (error) {
      console.error('Expense Insert Error:', error.message, error)
      setError(error.message || 'Something went wrong — please try again')
      setLoading(false)
      return
    }

    // Reset fields
    setOpen(false)
    setTitle('')
    setAmount('')
    setCategory('Salary')
    setDate(new Date().toISOString().split('T')[0])
    setNote('')
    setError('')
    setLoading(false)

    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:block">Add Expense</span>
        <span className="sm:hidden">Add</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-semibold text-zinc-900">Add Expense</h2>
              <button
                onClick={() => {
                  setOpen(false)
                  setError('')
                }}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Teacher Salary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={e => e.currentTarget.blur()}
                  className="h-11 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="Any note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setError('')
                  }}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
