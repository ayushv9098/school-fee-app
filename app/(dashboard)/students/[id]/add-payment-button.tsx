'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/calculations'
import { PAYMENT_MODES } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

import { useSession } from '@/lib/session-context'

interface Props {
  studentId: string
  remainingFee: number
  isPaid: boolean
}

export default function AddPaymentButton({
  studentId,
  remainingFee,
  isPaid,
}: Props) {
  const router = useRouter()
  const { academicYear } = useSession()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [note, setNote] = useState('')

  // NEW FIELDS
  const [feeFor, setFeeFor] = useState('Current Month')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const amt = Number(amount)

    if (!amt || amt <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amt > remainingFee) {
      setError(`Maximum ${formatCurrency(remainingFee)} can be paid`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired — please login again')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('payments').insert({
      student_id: studentId,
      amount: amt,
      mode,
      note: note.trim(),

      // NEW FIELDS
      fee_for: feeFor,
      receipt_number: receiptNumber.trim() || null,
      payment_date: paymentDate,
      academic_year: academicYear, 
    })

    if (insertError) {
      console.error(insertError)
      setError(`Error: ${insertError.message || 'Saving failed'}`)
      setLoading(false)
      return
    }

    // Reset fields
    setOpen(false)
    setAmount('')
    setMode('Cash')
    setNote('')
    setFeeFor('Current Month')
    setReceiptNumber('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setError('')
    setLoading(false)

    router.refresh()
  }

  if (isPaid) {
    return (
      <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-xl">
        Fully Paid!
      </span>
    )
  }

  return (
    <>
      {/* Trigger Button */}
     <button
  id="add-payment-trigger"
  onClick={() => setOpen(true)}
  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
>
        <Plus className="w-4 h-4" />
        <span>Add Payment</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">
                  Add Payment
                </h2>
                <p className="text-sm text-zinc-500">
                  Remaining: {formatCurrency(remainingFee)}
                </p>
              </div>

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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Amount — spinner-free */}
              <div className="space-y-1.5">
                <Label>Amount *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={`Max: ${formatCurrency(remainingFee)}`}
                  value={amount}
                  onChange={(e) => {
                    // Allow only digits
                    const numericValue = e.target.value.replace(/[^0-9]/g, '')
                    setAmount(numericValue)
                  }}
                  className="h-11"
                  autoFocus
                />
              </div>

              {/* Fee For */}
              <div className="space-y-1.5">
                <Label>Fee For</Label>
                <select
                  value={feeFor}
                  onChange={(e) => setFeeFor(e.target.value)}
                  className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="Current Month">Current Month</option>
                  <option value="Previous Dues">Previous Dues</option>
                  <option value="Admission Fee">Admission Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Receipt Number */}
              <div className="space-y-1.5">
                <Label>Receipt Number</Label>
                <Input
                  placeholder="e.g. RCPT-00125"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="Any note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Buttons */}
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
                  {loading ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}