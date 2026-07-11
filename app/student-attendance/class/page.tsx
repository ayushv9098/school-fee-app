'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Student {
  id: string
  name: string
  class: string
  guardian_name?: string
  status: string
}

export default function ClassAttendancePage() {
  const supabase = createClient()
  const [classes, setClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({}) // student_id -> status ('present', 'absent')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const todayDate = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Get unique classes from students
      const { data } = await supabase
        .from('students')
        .select('class')
        .eq('status', 'active')
      
      if (data) {
        const uniqueClasses = Array.from(new Set(data.map(d => d.class))).sort()
        setClasses(uniqueClasses)
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    
    async function fetchStudentsAndAttendance() {
      setLoading(true)
      
      // Get students for selected class
      const { data: stdData } = await supabase
        .from('students')
        .select('id, name, class, guardian_name, status')
        .eq('class', selectedClass)
        .eq('status', 'active')
        .order('name')
        
      setStudents(stdData || [])

      // Get today's attendance for this class's students
      if (stdData && stdData.length > 0) {
        const studentIds = stdData.map(s => s.id)
        const { data: attData } = await supabase
          .from('student_attendance')
          .select('student_id, status')
          .eq('date', todayDate)
          .eq('type', 'class')
          .in('student_id', studentIds)
          
        const attMap: Record<string, string> = {}
        attData?.forEach(record => {
          attMap[record.student_id] = record.status
        })
        setAttendance(attMap)
      }
      setLoading(false)
    }
    
    fetchStudentsAndAttendance()
  }, [selectedClass])

  const toggleAttendance = async (studentId: string, currentStatus: string | undefined) => {
    // If not marked, mark present. If present, mark absent. If absent, remove mark.
    let newStatus = 'present'
    if (currentStatus === 'present') newStatus = 'absent'
    else if (currentStatus === 'absent') newStatus = 'none'

    // Optimistic UI update
    setAttendance(prev => {
      const next = { ...prev }
      if (newStatus === 'none') delete next[studentId]
      else next[studentId] = newStatus
      return next
    })

    if (newStatus === 'none') {
      await supabase
        .from('student_attendance')
        .delete()
        .eq('student_id', studentId)
        .eq('date', todayDate)
        .eq('type', 'class')
    } else {
      await supabase
        .from('student_attendance')
        .upsert({
          student_id: studentId,
          date: todayDate,
          status: newStatus,
          type: 'class',
          marked_by: currentUser?.id
        }, {
          onConflict: 'student_id,date,type'
        })
    }
  }

  const markAllPresent = async () => {
    setSaving(true)
    const newAtt = { ...attendance }
    const toInsert = []

    for (const std of students) {
      if (newAtt[std.id] !== 'present') {
        newAtt[std.id] = 'present'
        toInsert.push({
          student_id: std.id,
          date: todayDate,
          status: 'present',
          type: 'class',
          marked_by: currentUser?.id
        })
      }
    }

    if (toInsert.length > 0) {
      setAttendance(newAtt)
      await supabase.from('student_attendance').upsert(toInsert, { onConflict: 'student_id,date,type' })
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/student-attendance">
            <button className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors">
              <ChevronLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Class Attendance</h1>
            <p className="text-sm text-zinc-500">{dayjs().format('dddd, DD MMMM YYYY')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Select Class</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full sm:max-w-[250px] h-10 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">-- Choose Class --</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {selectedClass && students.length > 0 && (
            <button 
              onClick={markAllPresent}
              disabled={saving}
              className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Mark All Present
            </button>
          )}
        </div>

        {/* Student List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={32} className="animate-spin text-violet-600" />
          </div>
        ) : selectedClass ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No active students found in this class.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((student, index) => {
                  const status = attendance[student.id]
                  return (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</p>
                          <p className="text-xs text-zinc-500">{student.guardian_name || 'No guardian info'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleAttendance(student.id, status)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                            status === 'present' 
                              ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500 scale-110' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
                          }`}
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        
                        <button 
                          onClick={() => toggleAttendance(student.id, status === 'absent' ? 'present' : 'present' /* logic in toggle overrides anyway but to trigger absent we need current to be present */)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                            status === 'absent' 
                              ? 'bg-rose-100 text-rose-600 border-2 border-rose-500 scale-110' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
                          }`}
                          onPointerDown={(e) => {
                             e.preventDefault();
                             toggleAttendance(student.id, 'present') // force toggle to absent by pretending it was present
                          }}
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500">
            Please select a class to view students.
          </div>
        )}

      </div>
    </div>
  )
}
