'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react'
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
      toast.error('Failed to delete student', {
        description: error.message
      })
      setLoading(false)
      return
    }

    toast.success(`${studentName}'s record has been deleted.`)
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
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Delete Student</h2>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="p-1 rounded-md hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Are you sure you want to delete <b className="text-zinc-900 dark:text-zinc-100">{studentName}</b>? All their payments and records will be permanently deleted. This action cannot be undone.
              </p>

              <div className="space-y-2 pt-2">
                <label className="text-xs uppercase font-bold text-red-600/80 dark:text-red-400/80 block">
                  Type DELETE to confirm
                </label>
                <input 
                  type="text"
                  placeholder="DELETE"
                  onChange={(e) => {
                    const btn = document.getElementById('confirm-student-delete-btn') as HTMLButtonElement
                    if (btn) btn.disabled = e.target.value !== 'DELETE'
                  }}
                  className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 font-semibold tracking-widest uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="flex-1 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  id="confirm-student-delete-btn"
                  onClick={handleDelete}
                  disabled
                  className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
