'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  studentId: string
  studentName: string
}

export default function DeleteStudentButton({ studentId, studentName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()

    // 1. Delete student (Cascade will handle payments)
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)

    if (error) {
      console.error('Delete Error:', error)
      toast.error('Student delete nahi ho paaya', {
        description: error.message
      })
      setLoading(false)
      return
    }

    toast.success(`${studentName} ka record delete kar diya gaya hai.`)
    setOpen(false)
    setLoading(false)
    
    // Redirect to students list
    router.push('/students')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50 transition"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Confirm Delete?</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Kya aap pakka <b>{studentName}</b> ko delete karna chahte hain? Inke saare payments aur records hamesha ke liye mit jayenge.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="h-11 w-full bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                  ) : (
                    'Haan, Delete Karo'
                  )}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="h-11 w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  Nahi, Wapas Jao
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
