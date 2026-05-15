'use client'

import { formatCurrency } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  totalPaid: number
  remainingFee: number
}

export default function PaidCard({ totalPaid, remainingFee }: Props) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          {remainingFee > 0 && (
            <button
              onClick={() => document.getElementById('add-payment-trigger')?.click()}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium border border-violet-200 hover:border-violet-400 px-2.5 py-1.5 rounded-lg transition flex-shrink-0"
            >
              + Add 
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}