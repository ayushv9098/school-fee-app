'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/calculations'
import { Copy, Check } from 'lucide-react'

export default function DefaulterRow({ student, index }: { student: any; index: number }) {
  const [copied, setCopied] = useState(false)

  const message = `Dear Parent of ${student.name} (${student.class}), your fee payment of ${formatCurrency(student.remaining_fee)} is pending. Please pay at the earliest. — Ayushman Educational Academy`

  async function handleCopy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold text-red-600">
          {index + 1}
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">{student.name}</p>
          <p className="text-xs text-zinc-500">{student.class}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-bold text-red-500">{formatCurrency(student.remaining_fee)}</p>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            copied
              ? 'bg-green-100 text-green-700'
              : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
          }`}
        >
          {copied
            ? <><Check className="w-3 h-3" />Copied!</>
            : <><Copy className="w-3 h-3" />Remind</>
          }
        </button>
      </div>
    </div>
  )
}