'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Users, Bus, MapPin, ChevronLeft, ChevronRight, 
  KeySquare, Plus, UserCircle, X, Trash2, Search, Loader2, MessageCircle,
  GraduationCap, CheckCircle2, XCircle
} from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  name: string
  class: string
  address: string
  vehicle_id: string
  status: string
  vehicles?: {
    id: string
    name: string
    type: string
  }
}

interface AttendanceRecord {
  student_id: string
  date: string
  status: string
  type: string
}

interface Staff {
  id: string
  name: string
  email: string
  mobile: string
  role: string
}

interface Props {
  selectedDate: string
}

export default function StudentRecordsClient({ selectedDate }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'reports' | 'logins' | 'student-record'>('reports')
  
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceStaff, setAttendanceStaff] = useState<Staff[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({})
  const [expandedVehicleVillages, setExpandedVehicleVillages] = useState<Record<string, boolean>>({})
  const [recordClassFilter, setRecordClassFilter] = useState<string>('all')
  const [classStatusFilter, setClassStatusFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all')
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'all' | 'present' | 'absent'>('all')
  const [reportViewMode, setReportViewMode] = useState<'dashboard' | 'class-details' | 'vehicle-details'>('dashboard')

  useEffect(() => {
    async function fetchData() {
      setLoadingData(true)
      const sessionYear = localStorage.getItem('selectedAcademicYear') || '2025-26'
      
      const { data: rawStudents } = await supabase
        .from('students')
        .select('id, name, class, address, vehicle_id, status')
        .eq('status', 'active')
        .eq('academic_year', sessionYear)

      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, name, type')

      const mappedStudents = (rawStudents || []).map(std => ({
        ...std,
        vehicles: vehiclesData?.find(v => v.id === std.vehicle_id) || null
      }))
      setStudents(mappedStudents as Student[])

      const { data: attRecords } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('date', selectedDate)
      setAttendanceRecords(attRecords || [])

      const { data: staff } = await supabase
        .from('teachers')
        .select('*')
        .eq('role', 'attendance_staff')
        .eq('academic_year', sessionYear)
        .order('name')
      setAttendanceStaff(staff || [])

      setLoadingData(false)
    }
    fetchData()
  }, [selectedDate, supabase])

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' })

  // --- Student Search State ---
  const [searchQuery, setSearchQuery] = useState('')
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null)
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([])
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Student[]>([])

  const handleDateChange = (newDate: string) => {
    router.push(`/student-records?date=${newDate}`)
  }

  // --- Calculations for Daily Reports ---
  const classRecords = attendanceRecords.filter(r => r.type === 'class')
  const vehicleRecords = attendanceRecords.filter(r => r.type === 'vehicle')
  const classStatusMap = new Map(classRecords.map(r => [r.student_id, r.status]))
  const vehicleStatusMap = new Map(vehicleRecords.map(r => [r.student_id, r.status]))

  let totalPresentClass = 0
  let totalAbsentClass = 0
  let totalNotMarkedClass = 0
  const classBreakdown: Record<string, { present: number, absent: number, total: number, students: {id: string, name: string, status: string}[] }> = {}

  students.forEach(std => {
    const status = classStatusMap.get(std.id)
    if (status === 'present') totalPresentClass++
    else if (status === 'absent') totalAbsentClass++
    else totalNotMarkedClass++

    if (!classBreakdown[std.class]) {
      classBreakdown[std.class] = { present: 0, absent: 0, total: 0, students: [] }
    }
    classBreakdown[std.class].total++
    if (status === 'present') classBreakdown[std.class].present++
    if (status === 'absent') classBreakdown[std.class].absent++
    
    classBreakdown[std.class].students.push({
      id: std.id,
      name: std.name,
      status: status || 'unmarked'
    })
  })

  const vehicleStudents = students.filter(s => s.vehicle_id)
  let totalBoarded = 0
  let totalNotBoarded = 0 
  const vehicleBreakdown: Record<string, { 
    name: string, 
    boarded: number, 
    total: number, 
    villages: Record<string, { present: number, total: number, students: { id: string, name: string, status: string }[] }> 
  }> = {}
  const villageBreakdown: Record<string, number> = {}
  const flatVillageBreakdown: Record<string, {
    present: number,
    absent: number,
    total: number,
    students: { id: string, name: string, status: string }[]
  }> = {}

  vehicleStudents.forEach(std => {
    const status = vehicleStatusMap.get(std.id) || 'unmarked'
    const vName = std.vehicles?.name || 'Unknown Vehicle'
    const village = std.address?.trim() || 'Unknown'
    
    if (!vehicleBreakdown[std.vehicle_id]) {
      vehicleBreakdown[std.vehicle_id] = { name: vName, boarded: 0, total: 0, villages: {} }
    }
    
    if (!vehicleBreakdown[std.vehicle_id].villages[village]) {
      vehicleBreakdown[std.vehicle_id].villages[village] = { present: 0, total: 0, students: [] }
    }

    vehicleBreakdown[std.vehicle_id].total++
    vehicleBreakdown[std.vehicle_id].villages[village].total++

    // Flat village calculations
    if (!flatVillageBreakdown[village]) {
      flatVillageBreakdown[village] = { present: 0, absent: 0, total: 0, students: [] }
    }
    flatVillageBreakdown[village].total++

    if (status === 'present') {
      totalBoarded++
      vehicleBreakdown[std.vehicle_id].boarded++
      vehicleBreakdown[std.vehicle_id].villages[village].present++
      villageBreakdown[village] = (villageBreakdown[village] || 0) + 1
      flatVillageBreakdown[village].present++
    } else {
      totalNotBoarded++
      flatVillageBreakdown[village].absent++
    }

    vehicleBreakdown[std.vehicle_id].villages[village].students.push({
      id: std.id,
      name: std.name,
      status: status || 'unmarked'
    })

    flatVillageBreakdown[village].students.push({
      id: std.id,
      name: std.name,
      status
    })
  })

  // Custom class sorting logic
  const getClassOrder = (className: string) => {
    const normalized = className.trim().toLowerCase()
    if (normalized.includes('nursery') || normalized === 'nur') return -3
    if (normalized.includes('lkg')) return -2
    if (normalized.includes('ukg') || normalized === 'kg') return -1
    const match = normalized.match(/\d+/)
    if (match) return parseInt(match[0], 10)
    return 999
  }

  // --- Functions for IDs ---
  const handleCreateID = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const sessionYear = localStorage.getItem('selectedAcademicYear') || '2025-26'

      const res = await fetch('/api/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          subject: 'Attendance Manager',
          email: form.email,
          password: form.password,
          mobile: form.mobile || null,
          monthly_salary: 0,
          role: 'attendance_staff',
          user_id: user.id,
          academic_year: sessionYear
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create login')

      toast.success('Attendance Staff account created!')
      setModalOpen(false)
      setForm({ name: '', email: '', password: '', mobile: '' })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if(!confirm(`Are you sure you want to delete ${name}'s login?`)) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('teachers').delete().eq('id', id)
      if (error) throw error
      toast.success('Login deleted successfully')
      router.refresh()
    } catch (err: any) {
      toast.error('Failed to delete login: ' + err.message)
    }
  }

  // --- Functions for Student History Search ---
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    if (val.trim().length > 1) {
      const results = students.filter(s => 
        s.name.toLowerCase().includes(val.toLowerCase()) || 
        s.class.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5) // top 5 matches
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleSelectStudent = async (student: Student) => {
    setSearchQuery('')
    setSearchResults([])
    setSearchedStudent(student)
    setSearching(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('student_id', student.id)
        .order('date', { ascending: false })
        .limit(30) // last 30 records

      if (error) throw error
      setStudentHistory(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch history')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      
      {activeTab !== 'logins' && activeTab !== 'student-record' && (
        <div className="shrink-0 bg-zinc-50 dark:bg-zinc-950 px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          {/* Page Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Student Attendance</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">View daily attendance reports.</p>
              </div>
              <button
                onClick={() => setActiveTab('student-record')}
                className="w-fit flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                <Search size={16} />
                Student Record
              </button>
            </div>
            
            <button
              onClick={() => setActiveTab('logins')}
              className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-sm font-semibold px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition shadow-sm shrink-0"
            >
              <KeySquare size={16} />
              <span>Create ID</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

      {/* --- TAB CONTENT: DAILY REPORTS --- */}
      {activeTab === 'reports' && reportViewMode === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 w-fit">
            <button 
              onClick={() => handleDateChange(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <input 
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className="bg-transparent text-sm font-medium outline-none text-zinc-900 dark:text-zinc-100"
            />
            <button 
              onClick={() => handleDateChange(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))}
              disabled={selectedDate === dayjs().format('YYYY-MM-DD')}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Class Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Class Attendance</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setClassStatusFilter('all')
                    setReportViewMode('class-details')
                  }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between col-span-2 md:col-span-1"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Students</span>
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <Users size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{students.length}</p>
                </button>

                <button
                  onClick={() => {
                    setClassStatusFilter('present')
                    setReportViewMode('class-details')
                  }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Present</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{totalPresentClass}</p>
                </button>

                <button
                  onClick={() => {
                    setClassStatusFilter('absent')
                    setReportViewMode('class-details')
                  }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Absent</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">{totalAbsentClass}</p>
                </button>
              </div>

              <Card>
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                  <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Breakdown by Class {classStatusFilter !== 'all' && `(${classStatusFilter.toUpperCase()})`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto relative">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="text-left font-medium p-3 pl-5 text-zinc-500">Class</th>
                          <th className="text-right font-medium p-3 text-emerald-600">Present</th>
                          <th className="text-right font-medium p-3 text-rose-500">Absent</th>
                          <th className="text-right font-medium p-3 pr-5 text-zinc-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(classBreakdown)
                          .filter(([_, stats]) => {
                            if (classStatusFilter === 'all') return true
                            if (classStatusFilter === 'present') return stats.present > 0
                            if (classStatusFilter === 'absent') return stats.absent > 0
                            if (classStatusFilter === 'unmarked') {
                              const unmarked = stats.total - stats.present - stats.absent
                              return unmarked > 0
                            }
                            return true
                          })
                          .sort(([a], [b]) => getClassOrder(a) - getClassOrder(b))
                          .map(([cls, stats]) => (
                          <Fragment key={cls}>
                            <tr 
                              onClick={() => setExpandedClasses(p => ({...p, [cls]: !p[cls]}))}
                              className="border-t border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                            >
                              <td className="p-3 pl-5 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                <ChevronRight size={16} className={`text-zinc-400 transition-transform ${expandedClasses[cls] ? 'rotate-90' : ''}`} />
                                {cls}
                              </td>
                              <td className="p-3 text-right text-emerald-600 dark:text-emerald-500 font-semibold">{stats.present}</td>
                              <td className="p-3 text-right text-rose-600 dark:text-rose-500 font-semibold">{stats.absent}</td>
                              <td className="p-3 pr-5 text-right text-zinc-500">{stats.total}</td>
                            </tr>
                            {expandedClasses[cls] && (
                              <tr className="bg-zinc-50/50 dark:bg-zinc-900/20">
                                <td colSpan={4} className="p-0">
                                  <div className="px-5 py-2 divide-y divide-zinc-100 dark:divide-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800/50">
                                    {stats.students
                                      .filter(s => classStatusFilter === 'all' || s.status === classStatusFilter)
                                      .sort((a,b) => a.name.localeCompare(b.name))
                                      .map(s => (
                                      <button 
                                        key={s.id} 
                                        onClick={() => {
                                          const fullStudent = students.find(st => st.id === s.id)
                                          if (fullStudent) {
                                            handleSelectStudent(fullStudent)
                                            setActiveTab('student-record')
                                          }
                                        }}
                                        className="w-full py-2 flex justify-between items-center hover:opacity-70 transition-opacity text-left"
                                      >
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-6">{s.name}</span>
                                        <Badge variant="outline" className={
                                          s.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' :
                                          s.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:border-rose-800' :
                                          'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700'
                                        }>
                                          {s.status === 'present' ? 'Present' : s.status === 'absent' ? 'Absent' : 'Unmarked'}
                                        </Badge>
                                      </button>
                                    ))}
                                    {stats.students.filter(s => classStatusFilter === 'all' || s.status === classStatusFilter).length === 0 && (
                                      <div className="py-2 text-center text-sm text-zinc-500">No students.</div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                    {Object.keys(classBreakdown).length === 0 && (
                      <p className="text-center text-sm text-zinc-500 p-6">No data available.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Stats */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Transport Attendance</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setVehicleStatusFilter('all')
                    setReportViewMode('vehicle-details')
                  }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between col-span-2 md:col-span-1"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Transport</span>
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <Bus size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{vehicleStudents.length}</p>
                </button>

                <button
                  onClick={() => {
                    setVehicleStatusFilter('present')
                    setReportViewMode('vehicle-details')
                  }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Present</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{totalBoarded}</p>
                </button>

                <button
                  onClick={() => {
                    setVehicleStatusFilter('absent')
                    setReportViewMode('vehicle-details')
                  }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Absent</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-500">{totalNotBoarded}</p>
                </button>
              </div>

              <Card>
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                  <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Village Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 text-xs font-semibold uppercase">
                          <th className="p-3 pl-5 text-left">Village</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 pr-5 text-right">Today Present</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(flatVillageBreakdown)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([village, stats]) => (
                            <tr key={village} className="border-t border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <td className="p-3 pl-5 font-medium text-zinc-900 dark:text-zinc-100">{village}</td>
                              <td className="p-3 text-right text-zinc-500">{stats.total}</td>
                              <td className="p-3 pr-5 text-right text-emerald-600 dark:text-emerald-500 font-semibold">{stats.present}</td>
                            </tr>
                          ))}
                        {Object.keys(flatVillageBreakdown).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center text-sm text-zinc-500 py-6">No village records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      )}

      {/* Class Attendance Details View */}
      {activeTab === 'reports' && reportViewMode === 'class-details' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-350 pb-20">
          {/* Header */}
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
            <button 
              onClick={() => {
                setReportViewMode('dashboard')
                setClassStatusFilter('all')
              }}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-95 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Class Attendance: {
                  classStatusFilter === 'present' ? 'Present Today' :
                  classStatusFilter === 'absent' ? 'Absent Today' :
                  classStatusFilter === 'unmarked' ? 'Unmarked Students' :
                  'All Students'
                }
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
                Date: {dayjs(selectedDate).format('DD MMMM YYYY')}
              </p>
            </div>
          </div>

          {/* List of classes grouped as separate cards */}
          <div className="space-y-4 max-w-4xl">
            {Object.entries(classBreakdown)
              .filter(([_, stats]) => {
                if (classStatusFilter === 'all') return stats.total > 0
                if (classStatusFilter === 'present') return stats.present > 0
                if (classStatusFilter === 'absent') return stats.absent > 0
                if (classStatusFilter === 'unmarked') {
                  const unmarked = stats.total - stats.present - stats.absent
                  return unmarked > 0
                }
                return true
              })
              .sort(([a], [b]) => getClassOrder(a) - getClassOrder(b))
              .map(([cls, stats]) => {
                const list = stats.students.filter(s => classStatusFilter === 'all' || s.status === classStatusFilter)
                
                return (
                  <div key={cls} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
                    {/* Class Card Header */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                          <GraduationCap size={14} />
                        </div>
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Class {cls}</span>
                      </div>
                      <span className="text-sm font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 px-3 py-1 rounded-full border border-violet-200/50 dark:border-violet-800/30">
                        {stats.present} / {stats.total} Present
                      </span>
                    </div>
                    {/* List of matching students in this class */}
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {list.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                        <div 
                          key={s.id}
                          className="px-5 py-3 flex justify-between items-center hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors"
                        >
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{s.name}</span>
                          <Badge variant="outline" className={
                            s.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' :
                            s.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:border-rose-800' :
                            'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700'
                          }>
                            {s.status === 'present' ? 'Present' : s.status === 'absent' ? 'Absent' : 'Unmarked'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Vehicle Attendance Details View */}
      {activeTab === 'reports' && reportViewMode === 'vehicle-details' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-350 pb-20">
          {/* Header */}
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
            <button 
              onClick={() => {
                setReportViewMode('dashboard')
                setVehicleStatusFilter('all')
              }}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-95 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Transport Attendance: {
                  vehicleStatusFilter === 'present' ? 'Present Today' :
                  vehicleStatusFilter === 'absent' ? 'Absent Today' :
                  'All Transport'
                }
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">
                Date: {dayjs(selectedDate).format('DD MMMM YYYY')}
              </p>
            </div>
          </div>

          {/* List of villages grouped as separate cards */}
          <div className="space-y-4 max-w-4xl">
            {Object.entries(flatVillageBreakdown)
              .filter(([_, stats]) => {
                if (vehicleStatusFilter === 'all') return stats.total > 0
                if (vehicleStatusFilter === 'present') return stats.present > 0
                if (vehicleStatusFilter === 'absent') return (stats.total - stats.present) > 0
                return true
              })
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([villageName, stats]) => {
                const list = stats.students.filter(s => {
                  if (vehicleStatusFilter === 'all') return true
                  return s.status === vehicleStatusFilter
                })

                return (
                  <div key={villageName} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in duration-200">
                    {/* Village Card Header */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-450">
                          <MapPin size={16} />
                        </div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{villageName}</h3>
                      </div>
                      <div className="text-sm font-semibold shrink-0">
                        <span className="text-emerald-600">{stats.present}</span>
                        <span className="text-zinc-500"> / {stats.total} Present</span>
                      </div>
                    </div>

                    {/* Student List in this Village */}
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {list.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                        <button 
                          key={s.id}
                          onClick={() => {
                            const fullStudent = students.find(st => st.id === s.id)
                            if (fullStudent) {
                              handleSelectStudent(fullStudent)
                              setActiveTab('student-record')
                            }
                          }}
                          className="w-full p-3 px-5 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                        >
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{s.name}</span>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            s.status === 'present' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-950/40 dark:border-emerald-800/50' 
                              : 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-950/40 dark:border-rose-800/50'
                          }`}>
                            {s.status === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: STUDENT RECORD --- */}
      {activeTab === 'student-record' && (
        <div className="space-y-6 animate-in fade-in duration-300 min-h-[400px] pb-40">
          <button 
            onClick={() => { setActiveTab('reports'); setSearchedStudent(null); setStudentHistory([]) }}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
          >
            <ChevronLeft size={16} />
            Back to Reports
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Student Record</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Search by name to view individual attendance history.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative max-w-2xl z-20">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input 
                placeholder="Search student by name..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 bg-white dark:bg-zinc-900"
              />
              
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden z-30">
                  {searchResults.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                    >
                      <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{s.name}</p>
                      <p className="text-xs text-zinc-500">Class: {s.class} • {s.address || 'No address'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <select
              value={recordClassFilter}
              onChange={(e) => setRecordClassFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none w-full sm:w-48 text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">All Classes</option>
              {Array.from(new Set(students.map(s => s.class)))
                .sort((a, b) => getClassOrder(a) - getClassOrder(b))
                .map(c => <option key={c} value={c}>{c}</option>)
              }
            </select>
          </div>

          {!searchedStudent && (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto relative">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="text-left font-medium p-3 pl-5 text-zinc-500">S.No</th>
                        <th className="text-left font-medium p-3 text-zinc-500">Student Name</th>
                        <th className="text-left font-medium p-3 text-zinc-500">Class</th>
                        <th className="text-left font-medium p-3 text-zinc-500">Village / Address</th>
                        <th className="text-right font-medium p-3 pr-5 text-zinc-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students
                        .filter(s => recordClassFilter === 'all' || s.class === recordClassFilter)
                        .sort((a, b) => {
                           const classDiff = getClassOrder(a.class) - getClassOrder(b.class);
                           if (classDiff !== 0) return classDiff;
                           return a.name.localeCompare(b.name);
                        })
                        .map((s, index) => (
                        <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="p-3 pl-5 text-zinc-500">{index + 1}</td>
                          <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100">{s.name}</td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-400">{s.class}</td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">{s.address || '-'}</td>
                          <td className="p-3 pr-5 text-right">
                            <button 
                              onClick={() => handleSelectStudent(s)}
                              className="text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition"
                            >
                              View Record
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.filter(s => recordClassFilter === 'all' || s.class === recordClassFilter).length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center p-6 text-zinc-500">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {searchedStudent && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {searchedStudent.name}
                  </h3>
                  <p className="text-sm text-zinc-500">Class {searchedStudent.class} • {searchedStudent.vehicles?.name ? `Vehicle: ${searchedStudent.vehicles.name}` : 'No Vehicle Assigned'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                       const presentCount = studentHistory.filter(r => r.status === 'present').length;
                       const absentCount = studentHistory.filter(r => r.status === 'absent').length;
                       const msg = `Namaste! Aaj ki date tak aapke bachhe ${searchedStudent.name} (Class: ${searchedStudent.class}) ka attendance record is prakar hai:\n\nPresent: ${presentCount} days\nAbsent: ${absentCount} days\n\nSchool Administration`;
                       window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition shadow-sm font-medium"
                  >
                    <MessageCircle size={16} /> WhatsApp Report
                  </button>
                  <button
                    onClick={() => { setSearchedStudent(null); setStudentHistory([]) }}
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
                  >
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>

              {searching ? (
                <div className="p-12 flex justify-center border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                    <CardTitle className="text-sm font-medium">Attendance History (Last 30 records)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="text-left font-medium p-3 text-zinc-500">Date</th>
                            <th className="text-left font-medium p-3 text-zinc-500">Type</th>
                            <th className="text-left font-medium p-3 text-zinc-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentHistory.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-zinc-500">No attendance records found for this student.</td>
                            </tr>
                          ) : (
                            studentHistory.map((record, i) => (
                              <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                <td className="p-3 text-zinc-900 dark:text-zinc-100">{dayjs(record.date).format('DD MMM YYYY, dddd')}</td>
                                <td className="p-3 capitalize text-zinc-600 dark:text-zinc-400">{record.type}</td>
                                <td className="p-3">
                                  {record.status === 'present' ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Present</Badge>
                                  ) : (
                                    <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0">Absent</Badge>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: IDs --- */}
      {activeTab === 'logins' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit"
          >
            <ChevronLeft size={16} />
            Back to Student Records
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Attendance Logins</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage staff accounts that only have access to mark attendance.</p>
            </div>
            <button 
              onClick={() => {
                setForm({ name: '', email: '', password: '', mobile: '' })
                setModalOpen(true)
              }}
              className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Login
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {attendanceStaff.length === 0 ? (
              <div className="col-span-full p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500">
                No attendance logins created yet.
              </div>
            ) : (
              attendanceStaff.map(login => (
                <Card key={login.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{login.name}</p>
                        <p className="text-xs text-zinc-500">{login.email}</p>
                        {login.mobile && <p className="text-xs text-zinc-500 mt-0.5">{login.mobile}</p>}
                      </div>
                      <button 
                        onClick={() => handleDeleteStaff(login.id, login.name)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      </div>{/* end scrollable area */}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Create Attendance ID</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-md hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateID} className="p-4 space-y-4 overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <Label>Login Email</Label>
                  <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                  <Label>Login Password</Label>
                  <Input required type="text" minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="min 6 chars" />
                </div>
                <div>
                  <Label>Mobile Number (Optional)</Label>
                  <Input type="tel" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-10 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 h-10 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
