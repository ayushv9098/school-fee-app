'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/calculations'
import { PAYMENT_MODES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, X } from 'lucide-react'

interface Props {
  studentId: string
  remainingFee: number
  isPaid: boolean
}

export default function AddPaymentButton({ studentId, remainingFee, isPaid }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [note, setNote] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amt = Number(amount)
    if (!amt || amt <= 0) return setError('Valid amount daalo')
    if (amt > remainingFee) return setError(`Maximum ${formatCurrency(remainingFee)} de sakte ho`)

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('payments').insert({
      student_id: studentId,
      amount: amt,
      mode,
      note: note.trim(),
    })

    if (error) {
      setError('Kuch galat hua — dobara try karo')
      setLoading(false)
      return
    }

    setOpen(false)
    setAmount('')
    setNote('')
    setLoading(false)
    router.refresh()
  }

  if (isPaid) {
    return (
      <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-xl">
        Fully Paid
      </span>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
      >
        <Plus className="w-4 h-4" />
        <span>Add Payment</span>
      </button>

      {/* Modal Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Payment Add Karo</h2>
                <p className="text-sm text-zinc-500">
                  Remaining: {formatCurrency(remainingFee)}
                </p>
              </div>
              <button
                onClick={() => { setOpen(false); setError('') }}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  placeholder={`Max: ${formatCurrency(remainingFee)}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="h-11"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value)}
                  className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {PAYMENT_MODES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="Koi note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="h-11"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError('') }}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin inline" />Saving...</>
                    : 'Payment Save Karo'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}