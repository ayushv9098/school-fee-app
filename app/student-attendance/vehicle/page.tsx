'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, CheckCircle2, XCircle, Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Vehicle {
  id: string
  name: string
  type: string
}

interface Student {
  id: string
  name: string
  class: string
  address?: string
  status: string
}

export default function VehicleAttendancePage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({}) // student_id -> status
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const todayDate = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data } = await supabase
        .from('vehicles')
        .select('id, name, type')
        .order('name')
      
      setVehicles(data || [])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedVehicle) return
    
    async function fetchStudentsAndAttendance() {
      setLoading(true)
      
      const { data: stdData } = await supabase
        .from('students')
        .select('id, name, class, address, status')
        .eq('vehicle_id', selectedVehicle)
        .eq('status', 'active')
        .order('name')
        
      setStudents(stdData || [])

      if (stdData && stdData.length > 0) {
        const studentIds = stdData.map(s => s.id)
        const { data: attData } = await supabase
          .from('student_attendance')
          .select('student_id, status')
          .eq('date', todayDate)
          .eq('type', 'vehicle')
          .eq('vehicle_id', selectedVehicle)
          
        const attMap: Record<string, string> = {}
        attData?.forEach(record => {
          attMap[record.student_id] = record.status
        })
        setAttendance(attMap)
      } else {
        setAttendance({})
      }
      setLoading(false)
    }
    
    fetchStudentsAndAttendance()
  }, [selectedVehicle])

  const toggleAttendance = async (studentId: string, currentStatus: string | undefined, forceAbsent = false) => {
    let newStatus = 'present'
    if (forceAbsent) {
      newStatus = currentStatus === 'absent' ? 'none' : 'absent'
    } else {
      newStatus = currentStatus === 'present' ? 'none' : 'present'
    }

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
        .eq('type', 'vehicle')
    } else {
      await supabase
        .from('student_attendance')
        .upsert({
          student_id: studentId,
          date: todayDate,
          status: newStatus,
          type: 'vehicle',
          vehicle_id: selectedVehicle,
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
          type: 'vehicle',
          vehicle_id: selectedVehicle,
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

  // Calculate summary
  const totalStudents = students.length
  const totalPresent = Object.values(attendance).filter(s => s === 'present').length
  
  const villageCount = students.reduce((acc, std) => {
    const loc = std.address?.trim() || 'Unknown'
    acc[loc] = (acc[loc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Vehicle Attendance</h1>
            <p className="text-sm text-zinc-500">{dayjs().format('dddd, DD MMMM YYYY')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Select Vehicle</label>
            <select 
              value={selectedVehicle} 
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full sm:max-w-[300px] h-10 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
              ))}
            </select>
          </div>

          {selectedVehicle && students.length > 0 && (
            <button 
              onClick={markAllPresent}
              disabled={saving}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Mark All Boarded
            </button>
          )}
        </div>

        {/* Summary Card */}
        {selectedVehicle && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
               <div>
                 <p className="text-sm font-semibold text-zinc-500">Total Assigned</p>
                 <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalStudents}</p>
               </div>
               <div className="text-right">
                 <p className="text-sm font-semibold text-emerald-500">Boarded Today</p>
                 <p className="text-3xl font-bold text-emerald-600">{totalPresent}</p>
               </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
               <p className="text-sm font-semibold text-zinc-500 mb-3 flex items-center gap-1"><MapPin size={14}/> Village/Area Summary</p>
               <div className="flex flex-wrap gap-2">
                 {Object.entries(villageCount).map(([village, count]) => (
                   <span key={village} className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-xs font-medium rounded-md">
                     {village}: <b className="text-zinc-900 dark:text-zinc-100">{count}</b>
                   </span>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Student List */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={32} className="animate-spin text-emerald-600" />
          </div>
        ) : selectedVehicle ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {students.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No students are assigned to this vehicle yet. Assign them from the admin dashboard.</div>
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
                          <p className="text-xs text-zinc-500">Class: {student.class} • Area: {student.address || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleAttendance(student.id, status, false)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                            status === 'present' 
                              ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500 scale-110' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
                          }`}
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        
                        <button 
                          onClick={() => toggleAttendance(student.id, status, true)}
                          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                            status === 'absent' 
                              ? 'bg-rose-100 text-rose-600 border-2 border-rose-500 scale-110' 
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
                          }`}
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
            Please select a vehicle to view students.
          </div>
        )}

      </div>
    </div>
  )
}
