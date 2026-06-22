'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportResult {
  imported: number
  skipped: number
}

export default function ImportStudents() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  async function handleImport() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const supabase = createClient()

      // Step 1: Current user ka token lo
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please login first')
        setLoading(false)
        return
      }

      const token = session.access_token
      const userEmail = session.user.email

      // Step 2: Student Management API call karo
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STUDENT_MANAGEMENT_URL}/api/export-students`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }
      )

      if (!response.ok) {
        const err = await response.json()
        setError(err.error || 'Failed to fetch students')
        setLoading(false)
        return
      }

      const { students } = await response.json()

      if (!students || students.length === 0) {
        setError('No students found in Student Management System')
        setLoading(false)
        return
      }

      // Step 3: Fee database mein upsert karo
      const { data: { user } } = await supabase.auth.getUser()

      let imported = 0
      let skipped = 0

      for (const student of students) {
        const { error: insertError } = await supabase
          .from('students')
          .upsert({
            name: student.name,
            class: student.class || '',
            mobile: student.mobile || '',
            guardian_name: student.guardian_name || '',
            address: student.address || '',
            total_fee: student.total_fee || 0,
            academic_year: student.academic_year || '2025-26',
            user_id: user?.id,
          }, {
            onConflict: 'name,user_id'
          })

        if (insertError) {
          skipped++
        } else {
          imported++
        }
      }

      setResult({ imported, skipped })

    } catch (err) {
      setError('Something went wrong — please try again')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 rounded-xl gap-4">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Import from Student Management</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Import your students from the other system</p>
        </div>
        <button
          onClick={handleImport}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50 w-full sm:w-auto"
        >
          {loading
            ? 'Importing...'
            : <><Download className="w-4 h-4" />Import Students</>
          }
        </button>
      </div>

      {/* Success */}
      {result && (
        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Import Successful!</p>
            <p className="text-sm text-green-700">
              {result.imported} students imported
              {result.skipped > 0 && `, ${result.skipped} skipped (already exist)`}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Import Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}