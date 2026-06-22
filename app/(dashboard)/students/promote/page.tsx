'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CLASSES, ACADEMIC_YEARS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Check, Users, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/calculations'
import { useSession } from '@/lib/session-context'
import { cn } from '@/lib/utils'

// Helper function to calculate next year (e.g. "2025-26" -> "2026-27")
function getNextAcademicYear(currentYear: string) {
  try {
    const parts = currentYear.split('-')
    if (parts.length === 2) {
      const start = parseInt(parts[0])
      const end = parseInt(parts[1])
      if (!isNaN(start) && !isNaN(end)) {
        return `${start + 1}-${(end + 1).toString().padStart(2, '0')}`
      }
    }
  } catch (e) {
    console.error("Error parsing year", e)
  }
  return '2026-27' // Fallback
}

export default function PromoteStudentsPage() {
  const router = useRouter()
  const { academicYear: sessionYear } = useSession()
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass] = useState('')
  
  // Auto-calculate next year based on current session
  const [nextYear, setNextYear] = useState('')

  useEffect(() => {
    if (sessionYear) {
      setNextYear(getNextAcademicYear(sessionYear))
    }
  }, [sessionYear])

  const [students, setStudents] = useState<any[]>([])
  const [bulkFee, setBulkFee] = useState('')

  const fetchStudents = useCallback(async () => {
    if (!fromClass) {
      setStudents([])
      return
    }
    setFetching(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('student_fee_summary')
      .select('*')
      .eq('class', fromClass)
      .eq('status', 'active')
      .eq('academic_year', sessionYear) // ONLY fetch from current session
      .eq('user_id', user?.id)
      .order('name')
    
    setStudents((data || []).map(s => ({ ...s, selected: true })))
    setFetching(false)
  }, [fromClass, sessionYear])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  function handleFeeChange(studentId: string, fee: string) {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, nextFee: fee } : s))
  }

  function toggleStudent(studentId: string) {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, selected: !s.selected } : s))
  }

  function toggleAll() {
    const allSelected = students.every(s => s.selected)
    setStudents(prev => prev.map(s => ({ ...s, selected: !allSelected })))
  }

  function applyBulkFee() {
    if (!bulkFee) return
    setStudents(prev => prev.map(s => s.selected ? { ...s, nextFee: bulkFee } : s))
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/students')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  async function handlePromote() {
    const selectedStudents = students.filter(s => s.selected)
    if (!toClass) return setError('Class select karein jaha bhejna hai')
    if (!nextYear) return setError('Naya session year likhein')
    if (selectedStudents.length === 0) return setError('Promote karne ke liye bache select karein')

    const confirm = window.confirm(`Kya aap pakka in ${selectedStudents.length} bacho ko ${toClass} (${nextYear}) me bhejna chahte hain?`)
    if (!confirm) return

    setLoading(true)
    setError('')
    const supabase = createClient()

    try {
      for (const student of selectedStudents) {
        const nFee = Number(student.nextFee || 0)

        // 1. Check if the student is already promoted/exists in the target year
        // We check by name, guardian_name and academic_year
        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('name', student.name)
          .eq('guardian_name', student.guardian_name)
          .eq('academic_year', nextYear)
          .maybeSingle()

        if (existing) {
            console.log(`Student ${student.name} already exists in ${nextYear}, skipping...`)
            continue;
        }

        // 2. INSERT a new record instead of updating the existing one.
        // This ensures that the record for the previous year (sessionYear) 
        // remains safe and untouched for historical purposes.
        const { error: insertError } = await supabase
          .from('students')
          .insert({
            user_id: student.user_id,
            name: student.name,
            class: toClass,
            mobile: student.mobile,
            email: student.email,
            guardian_name: student.guardian_name,
            address: student.address,
            total_fee: nFee,
            previous_dues: student.remaining_fee, // Carry forward the remaining balance
            status: 'active',
            academic_year: nextYear,
            diary_page_number: student.diary_page_number
          })

        if (insertError) throw insertError
      }

      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Kuch galat hua, dobara try karein.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 space-y-4 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Promotion Successful!</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Bache safaltapurvak {toClass} ({nextYear}) me bhej diye gaye hain.</p>
        <p className="text-sm text-zinc-400">Wapas list me jaa rahe hain...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-32 md:pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/students" className="p-2 rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 transition">
          <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Agli Class Me Bhejein (Promote)</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Bacho ko nayi class aur naye session me transfer karein</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label>Kaunsi Class Ke Bache? (From)</Label>
              <select
                value={fromClass}
                onChange={e => setFromClass(e.target.value)}
                className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Class</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-center pb-2 hidden md:flex">
              <ArrowRight className="w-6 h-6 text-zinc-300" />
            </div>

            <div className="space-y-1.5">
              <Label>Kis Class Me Bhejna Hai? (To)</Label>
              <select
                value={toClass}
                onChange={e => setToClass(e.target.value)}
                className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Class</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Naya Session (Next Year)</Label>
              <select
                value={nextYear}
                onChange={e => setNextYear(e.target.value)}
                className="w-full h-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select Year</option>
                {ACADEMIC_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {fromClass && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              {fromClass} ke Bache ({students.length})
            </h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                    placeholder="Sabki Fees" 
                    type="number" 
                    value={bulkFee}
                    onChange={e => setBulkFee(e.target.value)}
                    className="h-10 flex-1 sm:w-32 sm:flex-none"
                />
                <button 
                    onClick={applyBulkFee}
                    className="h-10 px-4 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-800 transition whitespace-nowrap"
                >
                    Sab Par Lagayein
                </button>
            </div>
          </div>

          {/* Desktop View Table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950">
                      <th className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={students.length > 0 && students.every(s => s.selected)}
                          onChange={toggleAll}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Bache ka Naam</th>
                      <th className="text-right p-4 text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Pichla Baki</th>
                      <th className="text-left p-4 text-zinc-500 dark:text-zinc-400 font-medium w-40 whitespace-nowrap">Naye Saal Ki Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetching ? (
                      <tr>
                          <td colSpan={4} className="p-8 text-center">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-violet-600" />
                          </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-zinc-400">
                          Is class me {sessionYear} session ke koi bache nahi mile
                        </td>
                      </tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className={cn("border-b border-zinc-50 transition-colors", !s.selected && "opacity-60 bg-zinc-50 dark:bg-zinc-950/50")}>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={s.selected}
                              onChange={() => toggleStudent(s.id)}
                              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{s.name}</td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <span className={s.remaining_fee > 0 ? 'text-red-500 font-medium' : 'text-zinc-400'}>
                              {formatCurrency(s.remaining_fee)}
                            </span>
                          </td>
                          <td className="p-4 min-w-32">
                            <Input
                              type="number"
                              placeholder="Fees likhein"
                              value={s.nextFee || ''}
                              onChange={e => handleFeeChange(s.id, e.target.value)}
                              disabled={!s.selected}
                              className="h-9"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center gap-2 px-1 pb-1">
              <input
                type="checkbox"
                id="select-all-mobile"
                checked={students.length > 0 && students.every(s => s.selected)}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <label htmlFor="select-all-mobile" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer">
                Sabko Select Karein
              </label>
            </div>

            {fetching ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              </div>
            ) : students.length === 0 ? (
              <p className="p-8 text-center text-zinc-400 text-sm bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                Bache nahi mile.
              </p>
            ) : (
              students.map(s => (
                <Card key={s.id} className={cn("overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all", !s.selected && "opacity-60 border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/30")}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 items-start">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={s.selected}
                            onChange={() => toggleStudent(s.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          />
                        </div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">{s.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Pichla Baki</p>
                        <p className={cn("text-xs font-bold", s.remaining_fee > 0 ? "text-red-500" : "text-zinc-400")}>
                          {formatCurrency(s.remaining_fee)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-zinc-50">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 mb-1.5 block">Naye Saal Ki Fees</Label>
                      <Input
                        type="number"
                        placeholder="Fees likhein"
                        value={s.nextFee || ''}
                        onChange={e => handleFeeChange(s.id, e.target.value)}
                        disabled={!s.selected}
                        className="h-10 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:bg-zinc-900 transition-all disabled:opacity-50"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/students"
              className="h-12 px-6 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950 transition"
            >
              Wapas Jao
            </Link>
            <button
              onClick={handlePromote}
              disabled={loading || students.length === 0}
              className="h-12 px-8 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Promoting...
                </>
              ) : (
                'Promote Karein'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
