'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()
  return (
    <button 
      onClick={() => router.back()} 
      className="p-2 rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 transition"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
    </button>
  )
}
