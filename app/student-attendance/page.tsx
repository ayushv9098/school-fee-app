'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Bus, Users, CheckCircle2, XCircle, Loader2, MapPin, ChevronDown, ChevronLeft, ChevronRight, Info, X, Search, Plus, GraduationCap, Pencil, ClipboardList, FileDown, Clock, CalendarCheck } from 'lucide-react'
import { CLASSES } from '@/lib/constants'
import dayjs from 'dayjs'
import { pdf, Document, Page as PdfPage, Text, View, StyleSheet } from '@react-pdf/renderer'

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
  guardian_name?: string
  status: string
  mobile?: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  emergency_contact?: string
  email?: string
  diary_page_number?: string
  vehicle_id?: string | null
}

// PDF Styles for Attendance Report
const pdfStyles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff' },
  header: { marginBottom: 20, borderBottom: '2px solid #1E40AF', paddingBottom: 10 },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: '#1E40AF' },
  reportTitle: { fontSize: 13, marginTop: 4, color: '#1F2937', fontWeight: 'bold' },
  metaInfo: { fontSize: 9, color: '#4B5563', marginTop: 4 },
  table: { width: 'auto', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomColor: '#E5E7EB', borderBottomWidth: 1, minHeight: 28, alignItems: 'center' },
  alternateRow: { backgroundColor: '#F9FAFB' },
  tableHeader: { backgroundColor: '#F3F4F6', borderBottomColor: '#D1D5DB', borderBottomWidth: 1 },
  tableCell: { fontSize: 8, padding: 4 },
  headerCell: { fontSize: 9, fontWeight: 'bold', color: '#374151' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #E5E7EB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#9CA3AF' }
})

// PDF Component for Attendance Report
const AttendanceReportPDF = ({ recordData, recordType, recordSelection, recordMonth, schoolName }: any) => {
  const formattedMonth = dayjs(recordMonth).format('MMMM YYYY')
  const reportTitle = `${recordType === 'class' ? 'Class' : 'Vehicle'} Attendance Report - ${recordSelection}`
  
  return (
    <Document>
      <PdfPage size="A4" orientation="landscape" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.schoolName}>{schoolName}</Text>
          <Text style={pdfStyles.reportTitle}>{reportTitle}</Text>
          <Text style={pdfStyles.metaInfo}>Month: {formattedMonth}  |  Generated on: {dayjs().format('DD MMMM YYYY')}</Text>
        </View>

        <View style={pdfStyles.table}>
          {/* Header */}
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '5%' }]}>Sr No</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '20%' }]}>Student Name</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '8%', textAlign: 'center' }]}>Total Days</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '8%', textAlign: 'center', color: '#059669' }]}>Present</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '8%', textAlign: 'center', color: '#DC2626' }]}>Absent</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '10%', textAlign: 'center' }]}>% Attendance</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '21%' }]}>Absent Dates (Days)</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.headerCell, { width: '20%' }]}>Present Dates (Days)</Text>
          </View>

          {/* Rows */}
          {recordData.map((s: any, i: number) => {
            const absentList = s.absentDates?.map((d: string) => dayjs(d).format('DD')).join(', ') || 'None'
            const presentList = s.presentDates?.map((d: string) => dayjs(d).format('DD')).join(', ') || 'None'
            return (
              <View key={s.id} style={[pdfStyles.tableRow, i % 2 === 1 ? pdfStyles.alternateRow : {}]}>
                <Text style={[pdfStyles.tableCell, { width: '5%' }]}>{i + 1}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{s.name}</Text>
                <Text style={[pdfStyles.tableCell, { width: '8%', textAlign: 'center' }]}>{s.total}</Text>
                <Text style={[pdfStyles.tableCell, { width: '8%', textAlign: 'center', color: '#059669', fontWeight: 'bold' }]}>{s.present}</Text>
                <Text style={[pdfStyles.tableCell, { width: '8%', textAlign: 'center', color: '#DC2626', fontWeight: 'bold' }]}>{s.absent}</Text>
                <Text style={[pdfStyles.tableCell, { width: '10%', textAlign: 'center', fontWeight: 'bold' }]}>{s.percentage}%</Text>
                <Text style={[pdfStyles.tableCell, { width: '21%', color: '#DC2626', fontSize: 7.5 }]}>{absentList}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', color: '#059669', fontSize: 7.5 }]}>{presentList}</Text>
              </View>
            )
          })}
        </View>

        <View style={pdfStyles.footer}>
          <Text>Ayushman Educational Academy Attendance System</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </View>
      </PdfPage>
    </Document>
  )
}

export default function StudentAttendanceDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [todayDate, setTodayDate] = useState(dayjs().format('YYYY-MM-DD'))

  const [activeSection, setActiveSection] = useState<'class' | 'vehicle'>('class')
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Class state
  const [classes, setClasses] = useState<string[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [classAttendance, setClassAttendance] = useState<Record<string, string>>({})

  // Vehicle state
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [vehicleAttendance, setVehicleAttendance] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Student | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [todayAttendance, setTodayAttendance] = useState<any[]>([])
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignSearch, setAssignSearch] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)
  const [tempAssignedIds, setTempAssignedIds] = useState<Set<string>>(new Set())

  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'remaining'>('all')
  const [viewMode, setViewMode] = useState<'dashboard' | 'details'>('dashboard')
  const [detailsSearch, setDetailsSearch] = useState('')
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string | null>(null)

  const classStudents = useMemo(() => selectedClass ? allStudents.filter(s => s.class === selectedClass) : [], [allStudents, selectedClass])
  const vehicleStudents = useMemo(() => selectedVehicle ? allStudents.filter(s => s.vehicle_id === selectedVehicle) : [], [allStudents, selectedVehicle])

  useEffect(() => {
    setStatusFilter('all')
    setSelectedVillageFilter(null)
  }, [activeSection, selectedClass, selectedVehicle])

  // Quick Add Student State
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', class: '', guardian_name: '', address: '', mobile: '', vehicle_id: '' })
  const [addingStudent, setAddingStudent] = useState(false)

  // Edit Student State
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', name: '', class: '', guardian_name: '', address: '', mobile: '', vehicle_id: '' })
  const [editingStudent, setEditingStudent] = useState(false)

  // Records Modal State
  const [recordsOpen, setRecordsOpen] = useState(false)
  const [recordType, setRecordType] = useState<'class' | 'vehicle'>('class')
  const [recordSelection, setRecordSelection] = useState('')
  const [recordData, setRecordData] = useState<any[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [recordMonth, setRecordMonth] = useState(dayjs().format('YYYY-MM'))
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [studentDayRecords, setStudentDayRecords] = useState<any[]>([])
  const [schoolName, setSchoolName] = useState('School Attendance Report')
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?")
    if (!confirmLogout) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getSessionYear = (user: any) => {
    if (user?.user_metadata?.role === 'attendance_staff') {
      return user.user_metadata.academic_year || '2025-26'
    }
    return localStorage.getItem('selectedAcademicYear') || '2025-26'
  }

  // Init: fetch user, classes, vehicles
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)
      
      // Fetch school settings
      let ownerId = user.id
      if (user?.user_metadata?.role === 'attendance_staff') {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle()
        if (teacher?.user_id) {
          ownerId = teacher.user_id
        }
      }

      supabase.from('school_settings').select('school_name').eq('user_id', ownerId).maybeSingle().then(({ data }) => {
        if (data?.school_name) setSchoolName(data.school_name)
      })

      const sessionYear = user?.user_metadata?.role === 'attendance_staff'
        ? user.user_metadata.academic_year || '2025-26'
        : localStorage.getItem('selectedAcademicYear') || '2025-26'

      const [studentsRes, vehiclesRes, todayAttendanceRes] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', ownerId).eq('status', 'active').eq('academic_year', sessionYear).order('name'),
        supabase.from('vehicles').select('id, name, type').eq('user_id', ownerId).order('name'),
        supabase.from('student_attendance').select('*').eq('date', todayDate)
      ])

      console.log("init studentsRes:", studentsRes)
      console.log("init vehiclesRes:", vehiclesRes)
      console.log("init todayAttendanceRes:", todayAttendanceRes)

      if (todayAttendanceRes.error) {
        alert("init todayAttendanceRes error: " + todayAttendanceRes.error.message)
      }

      if (studentsRes.data) {
        setAllStudents(studentsRes.data as Student[])
        const unique = Array.from(new Set(studentsRes.data.map(d => d.class)))
        unique.sort((a, b) => {
          const idxA = CLASSES.indexOf(a)
          const idxB = CLASSES.indexOf(b)
          if (idxA === -1) return 1
          if (idxB === -1) return -1
          return idxA - idxB
        })
        setClasses(unique)
      }
      setVehicles(vehiclesRes.data || [])
      setTodayAttendance(todayAttendanceRes.data || [])
      setLoading(false)
    }
    init()
  }, [])

  // Fetch today's attendance when date changes
  useEffect(() => {
    if (!currentUser) return
    async function fetchTodayAttendance() {
      console.log("fetchTodayAttendance date parameter:", todayDate)
      const { data, error } = await supabase.from('student_attendance').select('*').eq('date', todayDate)
      console.log("fetchTodayAttendance response data:", data, "error:", error)
      if (error) {
        alert("fetchTodayAttendance error: " + error.message)
      }
      setTodayAttendance(data || [])
    }
    fetchTodayAttendance()
  }, [todayDate, currentUser])

  // Clear dirty state on selection change
  useEffect(() => {
    setClassAttendance({})
  }, [selectedClass])

  useEffect(() => {
    setVehicleAttendance({})
  }, [selectedVehicle])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.name || !addForm.class) {
      alert("Name and Class are required")
      return
    }
    setAddingStudent(true)
    const sessionYear = getSessionYear(currentUser)
    
    const { data, error } = await supabase.from('students').insert({
      name: addForm.name.trim(),
      class: addForm.class,
      guardian_name: addForm.guardian_name.trim(),
      address: addForm.address.trim(),
      mobile: addForm.mobile.trim(),
      vehicle_id: addForm.vehicle_id || null,
      total_fee: 0,
      academic_year: sessionYear,
      user_id: currentUser?.id
    }).select().single()

    if (error) {
      alert("Error adding student: " + error.message)
    } else {
      setAddForm({ name: '', class: '', guardian_name: '', address: '', mobile: '', vehicle_id: '' })
      setAddStudentOpen(false)
      
      // Update local state without reload to make it seamless
      if (data) {
        setAllStudents(prev => [...prev, data as Student].sort((a, b) => a.name.localeCompare(b.name)))
        if (!classes.includes(data.class)) {
          setClasses(prev => {
            const newClasses = [...prev, data.class]
            newClasses.sort((a, b) => CLASSES.indexOf(a) - CLASSES.indexOf(b))
            return newClasses
          })
        }
        
      }
      alert("Student added successfully!")
    }
    setAddingStudent(false)
  }

  const openEditModal = (student: Student) => {
    setEditForm({
      id: student.id,
      name: student.name,
      class: student.class,
      guardian_name: student.guardian_name || '',
      address: student.address || '',
      mobile: student.mobile || '',
      vehicle_id: student.vehicle_id || ''
    })
    setEditStudentOpen(true)
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.name || !editForm.class) {
      alert("Name and Class are required")
      return
    }
    setEditingStudent(true)
    
    const { error } = await supabase.from('students').update({
      name: editForm.name.trim(),
      class: editForm.class,
      guardian_name: editForm.guardian_name.trim(),
      address: editForm.address.trim(),
      mobile: editForm.mobile.trim(),
      vehicle_id: editForm.vehicle_id || null,
    }).eq('id', editForm.id)

    if (error) {
      alert("Error updating student: " + error.message)
    } else {
      setEditStudentOpen(false)
      
      const updateList = (list: Student[]) => 
        list.map(s => s.id === editForm.id 
          ? { ...s, name: editForm.name.trim(), class: editForm.class, guardian_name: editForm.guardian_name.trim(), address: editForm.address.trim(), mobile: editForm.mobile.trim(), vehicle_id: editForm.vehicle_id || null } as Student 
          : s
        ).sort((a, b) => a.name.localeCompare(b.name))
      
      setAllStudents(prev => updateList(prev))
      
      alert("Student updated successfully!")
    }
    setEditingStudent(false)
  }

  const fetchRecords = async (type: 'class' | 'vehicle', selection: string) => {
    setLoadingRecords(true)
    setExpandedStudent(null)
    let studentsToProcess = type === 'class' 
      ? allStudents.filter(s => s.class === selection)
      : allStudents.filter(s => s.vehicle_id === selection)

    const studentIds = studentsToProcess.map(s => s.id)
    
    if (studentIds.length === 0) {
      setRecordData([])
      setLoadingRecords(false)
      return
    }

    // Calculate total working days in the month (excluding Sundays)
    const startOfMonth = dayjs(recordMonth).startOf('month')
    const daysInMonth = startOfMonth.daysInMonth()
    let totalMonthWorkingDays = 0
    for (let i = 1; i <= daysInMonth; i++) {
      const d = startOfMonth.date(i)
      if (d.day() !== 0) { // 0 is Sunday
        totalMonthWorkingDays++
      }
    }

    const monthStart = dayjs(recordMonth).startOf('month').format('YYYY-MM-DD')
    const monthEnd = dayjs(recordMonth).endOf('month').format('YYYY-MM-DD')

    const { data } = await supabase
      .from('student_attendance')
      .select('student_id, status, date')
      .eq('type', type)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .in('student_id', studentIds)

    const records = data || []
    
    const stats = studentsToProcess.map(student => {
      const studentRecs = records.filter(r => r.student_id === student.id)
      const present = studentRecs.filter(r => r.status === 'present').length
      const absent = studentRecs.filter(r => r.status === 'absent').length
      const absentDates = studentRecs.filter(r => r.status === 'absent').map(r => r.date).sort()
      const presentDates = studentRecs.filter(r => r.status === 'present').map(r => r.date).sort()
      const percentage = totalMonthWorkingDays > 0 ? Math.round((present / totalMonthWorkingDays) * 100) : 0
      return { ...student, present, absent, total: totalMonthWorkingDays, percentage, absentDates, presentDates }
    }).sort((a, b) => a.percentage - b.percentage)

    setRecordData(stats)
    setLoadingRecords(false)
  }

  const downloadRecordsPDF = async () => {
    if (recordData.length === 0) return
    setPdfLoading(true)
    
    // Resolve selection display name (e.g. resolve vehicle name from vehicle ID)
    const selectionName = recordType === 'vehicle'
      ? (vehicles.find(v => v.id === recordSelection)?.name || recordSelection)
      : recordSelection

    try {
      const blob = await pdf(
        <AttendanceReportPDF
          recordData={recordData}
          recordType={recordType}
          recordSelection={selectionName}
          recordMonth={recordMonth}
          schoolName={schoolName}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const filename = `${recordType}-${selectionName.replace(/\s+/g, '_')}-attendance-${recordMonth}.pdf`
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("PDF generation error:", err)
      alert("Error generating PDF. Please try again.")
    } finally {
      setPdfLoading(false)
    }
  }

  useEffect(() => {
    if (recordsOpen && recordSelection) {
      fetchRecords(recordType, recordSelection)
    } else {
      setRecordData([])
    }
  }, [recordType, recordSelection, recordsOpen, recordMonth])

  const toggleAtt = async (
    studentId: string,
    currentStatus: string | undefined,
    type: 'class' | 'vehicle',
    forceAbsent = false
  ) => {
    let newStatus = 'present'
    if (forceAbsent) {
      newStatus = currentStatus === 'absent' ? 'none' : 'absent'
    } else {
      newStatus = currentStatus === 'present' ? 'none' : 'present'
    }

    const setFn = type === 'class' ? setClassAttendance : setVehicleAttendance
    setFn(prev => {
      const next = { ...prev }
      if (newStatus === 'none') delete next[studentId]
      else next[studentId] = newStatus
      return next
    })

    setTodayAttendance(prev => {
      const index = prev.findIndex(a => a.student_id === studentId && a.type === type)
      if (newStatus === 'none') {
        if (index > -1) {
          return prev.filter((_, idx) => idx !== index)
        }
      } else {
        if (index > -1) {
          const updated = [...prev]
          updated[index] = { ...updated[index], status: newStatus }
          return updated
        } else {
          return [...prev, { student_id: studentId, date: todayDate, status: newStatus, type }]
        }
      }
      return prev
    })
  }

  const markAllPresent = async (type: 'class' | 'vehicle') => {
    const students = type === 'class' ? classStudents : vehicleStudents
    const att = type === 'class' ? classAttendance : vehicleAttendance
    const setFn = type === 'class' ? setClassAttendance : setVehicleAttendance
    const newAtt = { ...att }

    for (const std of students) {
      if (newAtt[std.id] !== 'present') {
        newAtt[std.id] = 'present'
      }
    }
    setFn(newAtt)

    setTodayAttendance(prev => {
      let updated = [...prev]
      for (const std of students) {
        const index = updated.findIndex(a => a.student_id === std.id && a.type === type)
        if (index > -1) {
          updated[index] = { ...updated[index], status: 'present' }
        } else {
          updated.push({ student_id: std.id, date: todayDate, status: 'present', type })
        }
      }
      return updated
    })
  }

  const submitAttendance = async (type: 'class' | 'vehicle') => {
    setSaving(true)
    const students = type === 'class' ? classStudents : vehicleStudents
    const att = type === 'class' ? effectiveClassAtt : effectiveVehicleAtt
    
    // We need to fetch the current DB state to see what needs deleting
    const { data: dbAtt } = await supabase.from('student_attendance')
      .select('student_id')
      .eq('date', todayDate)
      .eq('type', type)
      .in('student_id', students.map(s => s.id))
      
    const dbStudentIds = new Set(dbAtt?.map(r => r.student_id) || [])
    
    const toInsert: any[] = []
    const toDelete: string[] = []

    for (const std of students) {
      const status = att[std.id]
      if (status) {
        toInsert.push({ student_id: std.id, date: todayDate, status, type })
      } else if (dbStudentIds.has(std.id)) {
        toDelete.push(std.id)
      }
    }

    if (toDelete.length > 0) {
      const { error } = await supabase.from('student_attendance').delete()
        .eq('date', todayDate)
        .eq('type', type)
        .in('student_id', toDelete)
      if (error) alert('Error deleting records: ' + error.message)
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('student_attendance').upsert(toInsert, { onConflict: 'student_id,date,type' })
      if (error) alert('Error saving records: ' + error.message)
    }

    // Refresh today's attendance state from database
    const { data: updatedAtt } = await supabase.from('student_attendance').select('*').eq('date', todayDate)
    setTodayAttendance(updatedAtt || [])

    // Clear local dirty overrides
    if (type === 'class') setClassAttendance({})
    else setVehicleAttendance({})
    
    setSaving(false)
    alert('Attendance successfully saved!')
  }

  const saveAssignments = async () => {
    if (!selectedVehicle) return
    setSavingAssign(true)
    const newIds = Array.from(tempAssignedIds)
    const oldIds = vehicleStudents.map(s => s.id)

    const toRemove = oldIds.filter(id => !newIds.includes(id))
    const toAdd = newIds.filter(id => !oldIds.includes(id))

    if (toRemove.length > 0) {
      await supabase.from('students').update({ vehicle_id: null }).in('id', toRemove)
    }
    if (toAdd.length > 0) {
      await supabase.from('students').update({ vehicle_id: selectedVehicle }).in('id', toAdd)
    }

    // Refresh vehicle students locally
    setAllStudents(prev => prev.map(s => {
      if (toRemove.includes(s.id)) return { ...s, vehicle_id: null }
      if (toAdd.includes(s.id)) return { ...s, vehicle_id: selectedVehicle }
      return s
    }))
    
    setSavingAssign(false)
    setAssignModalOpen(false)
  }

  // Stats & Filters Calculations
  const totalClassStds = allStudents.length
  const mySchoolTodayAttendance = todayAttendance.filter(a => allStudents.some(s => s.id === a.student_id))

  const schoolPresent = mySchoolTodayAttendance.filter(a => a.type === 'class' && a.status === 'present').length
  const schoolAbsent = mySchoolTodayAttendance.filter(a => a.type === 'class' && a.status === 'absent').length
  const schoolNotMarked = totalClassStds - schoolPresent - schoolAbsent

  const totalVehicleStds = allStudents.filter(s => s.vehicle_id).length
  const vehiclePresent = mySchoolTodayAttendance.filter(a => a.type === 'vehicle' && a.status === 'present').length
  const vehicleAbsent = mySchoolTodayAttendance.filter(a => a.type === 'vehicle' && a.status === 'absent').length
  const vehicleNotMarked = totalVehicleStds - vehiclePresent - vehicleAbsent

  const effectiveClassAtt = useMemo(() => {
    const map = todayAttendance.reduce((acc, a) => {
      if (a.type === 'class') acc[a.student_id] = a.status
      return acc
    }, {} as Record<string, string>)
    return { ...map, ...classAttendance }
  }, [classAttendance, todayAttendance])

  const effectiveVehicleAtt = useMemo(() => {
    const map = todayAttendance.reduce((acc, a) => {
      if (a.type === 'vehicle') acc[a.student_id] = a.status
      return acc
    }, {} as Record<string, string>)
    return { ...map, ...vehicleAttendance }
  }, [vehicleAttendance, todayAttendance])

  const totalVehicleStudents = vehicleStudents.length
  const totalVehiclePresent = Object.values(effectiveVehicleAtt).filter(s => s === 'present').length

  const villageBreakdown = vehicleStudents.reduce((acc, std) => {
    const loc = std.address?.trim() || 'Unknown'
    if (!acc[loc]) {
      acc[loc] = { total: 0, present: 0 }
    }
    acc[loc].total += 1
    const status = effectiveVehicleAtt[std.id]
    if (status === 'present') {
      acc[loc].present += 1
    }
    return acc
  }, {} as Record<string, { total: number, present: number }>)

  const allVehicleVillageBreakdown = allStudents.filter(s => s.vehicle_id).reduce((acc, std) => {
    const loc = std.address?.trim() || 'Unknown'
    if (!acc[loc]) {
      acc[loc] = { total: 0, present: 0 }
    }
    acc[loc].total += 1
    const status = effectiveVehicleAtt[std.id]
    if (status === 'present') {
      acc[loc].present += 1
    }
    return acc
  }, {} as Record<string, { total: number, present: number }>)

  const displayedClassStudents = (selectedClass ? classStudents : allStudents).filter(student => {
    const status = effectiveClassAtt[student.id]
    if (statusFilter === 'present') return status === 'present'
    if (statusFilter === 'absent') return status === 'absent'
    if (statusFilter === 'remaining') return !status
    return true
  })

  const displayedVehicleStudents = (selectedVehicle ? vehicleStudents : allStudents.filter(s => s.vehicle_id)).filter(student => {
    const status = effectiveVehicleAtt[student.id]
    if (statusFilter === 'present') return status === 'present'
    if (statusFilter === 'absent') return status === 'absent'
    if (statusFilter === 'remaining') return !status
    return true
  }).filter(student => {
    if (selectedVillageFilter) {
      return (student.address?.trim() || 'Unknown') === selectedVillageFilter
    }
    return true
  })

  const searchedClassStudents = displayedClassStudents.filter(student => {
    if (!detailsSearch.trim()) return true
    const query = detailsSearch.toLowerCase()
    return (
      student.name.toLowerCase().includes(query) ||
      student.class.toLowerCase().includes(query) ||
      student.mobile?.toLowerCase().includes(query) ||
      student.guardian_name?.toLowerCase().includes(query) ||
      (student.address && student.address.toLowerCase().includes(query))
    )
  })

  const searchedVehicleStudents = displayedVehicleStudents.filter(student => {
    if (!detailsSearch.trim()) return true
    const query = detailsSearch.toLowerCase()
    return (
      student.name.toLowerCase().includes(query) ||
      student.class.toLowerCase().includes(query) ||
      student.mobile?.toLowerCase().includes(query) ||
      student.guardian_name?.toLowerCase().includes(query) ||
      (student.address && student.address.toLowerCase().includes(query))
    )
  })

  const renderStudentRow = (student: Student, index: number, att: Record<string, string>, type: 'class' | 'vehicle') => {
    const status = att[student.id]
    return (
      <div key={student.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{student.name}</p>
              <button 
                onClick={() => setSelectedProfile(student)}
                className="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 p-1 rounded-md transition-colors"
                title="View Full Profile"
              >
                <Info size={14} />
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {type === 'class'
                ? (student.guardian_name || 'No guardian info')
                : `Class: ${student.class} • ${student.address || 'N/A'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAtt(student.id, status, type, false)}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              status === 'present'
                ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500 scale-110'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            <CheckCircle2 size={20} />
          </button>
          <button
            onClick={() => toggleAtt(student.id, status, type, true)}
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
  }

  if (viewMode === 'details') {
    const currentStudents = activeSection === 'class' ? searchedClassStudents : searchedVehicleStudents
    const prefix = activeSection === 'class' ? 'School' : 'Vehicle'
    let title = statusFilter === 'present' 
      ? `${prefix} Attendance: Present Today` 
      : statusFilter === 'absent' 
      ? `${prefix} Attendance: Absent Today` 
      : statusFilter === 'remaining' 
      ? `${prefix} Attendance: Remaining` 
      : `${prefix} Attendance: Total Students`

    if (selectedClass) {
      title = `Class ${selectedClass} Students`
    } else if (selectedVehicle) {
      const vName = vehicles.find(v => v.id === selectedVehicle)?.name || 'Vehicle'
      title = `${vName.toUpperCase()} Vehicle Students`
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => {
              setViewMode('dashboard')
              setDetailsSearch('')
              setSelectedClass('')
              setSelectedVehicle('')
              setStatusFilter('all')
            }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold truncate">{title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Total: {currentStudents.length} Students</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
          {/* Status Filters for Details View */}
          {(selectedClass || selectedVehicle) && (() => {
            const currentFullStudents = activeSection === 'class' ? classStudents : vehicleStudents
            const currentFullAttMap = activeSection === 'class' ? effectiveClassAtt : effectiveVehicleAtt
            const presentCount = currentFullStudents.filter(s => currentFullAttMap[s.id] === 'present').length
            const absentCount = currentFullStudents.filter(s => currentFullAttMap[s.id] === 'absent').length
            const remainingCount = currentFullStudents.length - presentCount - absentCount
            
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total Students Card */}
                <button 
                  onClick={() => setStatusFilter('all')}
                  className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between ${
                    statusFilter === 'all' 
                      ? 'border-violet-600 dark:border-violet-400 ring-2 ring-violet-600/20 dark:ring-violet-400/20 scale-[1.02]' 
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Students</span>
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <Users size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{currentFullStudents.length}</p>
                </button>

                {/* Present Card */}
                <button 
                  onClick={() => setStatusFilter('present')}
                  className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between ${
                    statusFilter === 'present' 
                      ? 'border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-600/20 dark:ring-emerald-400/20 scale-[1.02]' 
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Present</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</p>
                </button>

                {/* Absent Card */}
                <button 
                  onClick={() => setStatusFilter('absent')}
                  className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between ${
                    statusFilter === 'absent' 
                      ? 'border-rose-600 dark:border-rose-455 ring-2 ring-rose-600/20 dark:ring-rose-455/20 scale-[1.02]' 
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Absent</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-455">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-455">{absentCount}</p>
                </button>

                {/* Remaining Card */}
                <button 
                  onClick={() => setStatusFilter('remaining')}
                  className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between ${
                    statusFilter === 'remaining' 
                      ? 'border-amber-600 dark:border-amber-455 ring-2 ring-amber-600/20 dark:ring-amber-455/20 scale-[1.02]' 
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Remaining</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Clock size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-455">{remainingCount}</p>
                </button>
              </div>
            )
          })()}
          {/* Action header card for class details */}
          {selectedClass && currentStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <p className="text-sm text-zinc-500 font-medium">
                Marking attendance for Class <b>{selectedClass}</b>.
              </p>
              <button
                onClick={() => markAllPresent('class')}
                disabled={saving}
                className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Mark All Present
              </button>
            </div>
          )}

          {/* Action header card for vehicle details */}
          {selectedVehicle && currentStudents.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <p className="text-sm text-zinc-500 font-medium">
                  Marking attendance for this vehicle.
                </p>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setTempAssignedIds(new Set(vehicleStudents.map(s => s.id)))
                      setAssignSearch('')
                      setAssignModalOpen(true)
                    }}
                    className="h-10 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Users size={16} className="mr-2" />
                    Manage Students
                  </button>
                  <button
                    onClick={() => markAllPresent('vehicle')}
                    disabled={saving}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Mark All Present
                  </button>
                </div>
              </div>

              {/* Vehicle summary breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-500">Total Assigned</p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalVehicleStudents}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-500">Present Today</p>
                    <p className="text-3xl font-bold text-emerald-600">{totalVehiclePresent}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-sm font-semibold text-zinc-500 mb-3 flex items-center gap-1"><MapPin size={14}/> Village/Area</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {Object.entries(villageBreakdown).map(([village, stats]) => {
                      const isSelected = selectedVillageFilter === village
                      return (
                        <button
                          key={village}
                          onClick={() => setSelectedVillageFilter(isSelected ? null : village)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300'
                          }`}
                        >
                          <span>{village}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400'
                          }`}>
                            {stats.present}/{stats.total}
                          </span>
                        </button>
                      )
                    })}
                    {selectedVillageFilter && (
                      <button
                        onClick={() => setSelectedVillageFilter(null)}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              placeholder="Search by name, mobile, class, guardian, address..."
              value={detailsSearch}
              onChange={e => setDetailsSearch(e.target.value)}
              className="w-full h-11 pl-9 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {detailsSearch && (
              <button
                onClick={() => setDetailsSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* List of students */}
          {currentStudents.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-12 text-center text-zinc-500">
              No students found matching your criteria.
            </div>
          ) : activeSection === 'vehicle' ? (
            // Grouped by Village for Vehicles (Separate Cards)
            (() => {
              const studentsByVillage = currentStudents.reduce((acc, student) => {
                const village = student.address?.trim() || 'Unknown Village'
                if (!acc[village]) acc[village] = []
                acc[village].push(student)
                return acc
              }, {} as Record<string, Student[]>)

              const sortedVillages = Object.keys(studentsByVillage).sort((a, b) => {
                if (a === 'Unknown Village') return 1
                if (b === 'Unknown Village') return -1
                return a.localeCompare(b)
              })

              return (
                <div className="space-y-4">
                  {sortedVillages.map(village => {
                    const list = studentsByVillage[village]
                    const scopeStudents = selectedVehicle 
                      ? vehicleStudents 
                      : allStudents.filter(s => s.vehicle_id)
                    
                    const villageScopeStudents = scopeStudents.filter(s => (s.address?.trim() || 'Unknown Village') === village)
                    const villagePresent = villageScopeStudents.filter(s => effectiveVehicleAtt[s.id] === 'present').length
                    const villageTotal = villageScopeStudents.length

                    return (
                      <div key={village} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        {/* Village Section Header */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-rose-100/70 dark:bg-rose-950/50 flex items-center justify-center text-rose-700 dark:text-rose-300">
                              <MapPin size={14} />
                            </div>
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{village}</span>
                          </div>
                          <span className="text-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
                            {villagePresent} / {villageTotal} Present
                          </span>
                        </div>
                        {/* List of students in this village */}
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {list.map((s, idx) => renderStudentRow(s, idx, effectiveVehicleAtt, 'vehicle'))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          ) : (
            // Grouped by Class for School (Separate Cards)
            (() => {
              const studentsByClass = currentStudents.reduce((acc, student) => {
                const cls = student.class || 'Unknown Class'
                if (!acc[cls]) acc[cls] = []
                acc[cls].push(student)
                return acc
              }, {} as Record<string, Student[]>)

              const sortedClasses = Object.keys(studentsByClass).sort((a, b) => {
                const idxA = CLASSES.indexOf(a)
                const idxB = CLASSES.indexOf(b)
                if (idxA === -1) return 1
                if (idxB === -1) return -1
                return idxA - idxB
              })

              return (
                <div className="space-y-4">
                  {sortedClasses.map(cls => {
                    const list = studentsByClass[cls]
                    const classScopeStudents = allStudents.filter(s => s.class === cls)
                    const classPresent = classScopeStudents.filter(s => effectiveClassAtt[s.id] === 'present').length
                    const classTotal = classScopeStudents.length

                    return (
                      <div key={cls} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        {/* Class Section Header */}
                        <div className="bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                              <GraduationCap size={14} />
                            </div>
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Class {cls}</span>
                          </div>
                          <span className="text-sm font-semibold bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 px-3 py-1 rounded-full border border-violet-200/50 dark:border-violet-800/30">
                            {classPresent} / {classTotal} Present
                          </span>
                        </div>
                        {/* List of students in this class */}
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {list.map((s, idx) => renderStudentRow(s, idx, effectiveClassAtt, 'class'))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()
          )}

          {/* Submit Attendance Button */}
          {((selectedClass && activeSection === 'class') || (selectedVehicle && activeSection === 'vehicle')) && currentStudents.length > 0 && (
            <div className="flex justify-center pt-4">
              <button 
                onClick={() => submitAttendance(activeSection)}
                disabled={saving}
                className={`w-full sm:w-auto px-8 py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50 ${
                  activeSection === 'class' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                Submit {activeSection === 'class' ? 'Class' : 'Transport'} Attendance
              </button>
            </div>
          )}
        </main>

        {/* Profile Info Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Info size={18} className="text-violet-600" />
                  Student Profile
                </h3>
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedProfile.name}</p>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Class: {selectedProfile.class}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Guardian Name</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.guardian_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Mobile</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.mobile || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Emergency Contact</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.emergency_contact || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Blood Group</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.blood_group || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Date of Birth</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.date_of_birth ? dayjs(selectedProfile.date_of_birth).format('DD MMM YYYY') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Gender</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{selectedProfile.gender || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-zinc-500 mb-1">Address</p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.address || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
                <button
                  onClick={() => {
                    const p = selectedProfile
                    setSelectedProfile(null)
                    openEditModal(p)
                  }}
                  className="flex-1 h-10 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Pencil size={14} />
                  Edit Profile
                </button>
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="flex-1 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Student Modal */}
        {editStudentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <form onSubmit={handleEditStudent} className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Pencil size={18} className="text-emerald-600" />
                  Edit Student Info
                </h3>
                <button 
                  type="button"
                  onClick={() => setEditStudentOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Student Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Class <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={editForm.class}
                      onChange={e => setEditForm({...editForm, class: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Class</option>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Vehicle</label>
                    <select
                      value={editForm.vehicle_id}
                      onChange={e => setEditForm({...editForm, vehicle_id: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-555"
                    >
                      <option value="">None (Walk-in)</option>
                      {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={editForm.guardian_name}
                    onChange={e => setEditForm({...editForm, guardian_name: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-555"
                    placeholder="Enter guardian name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-555"
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Village / Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-555 resize-none h-20"
                    placeholder="Enter address or village"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditStudentOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editingStudent}
                  className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {editingStudent ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Student
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assign Students Modal */}
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" />
                  Assign Students to {vehicles.find(v => v.id === selectedVehicle)?.name}
                </h3>
                <button 
                  onClick={() => setAssignModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search students by name, class, or village..."
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="overflow-y-auto p-4 flex-1">
                <div className="grid gap-2">
                  {allStudents
                    .filter(s => 
                      s.name.toLowerCase().includes(assignSearch.toLowerCase()) || 
                      s.class.toLowerCase().includes(assignSearch.toLowerCase()) || 
                      (s.address && s.address.toLowerCase().includes(assignSearch.toLowerCase()))
                    )
                    .map(s => {
                      const isSelected = tempAssignedIds.has(s.id)
                      return (
                        <label 
                          key={s.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(tempAssignedIds)
                              if (e.target.checked) newSet.add(s.id)
                              else newSet.delete(s.id)
                              setTempAssignedIds(newSet)
                            }}
                            className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
                            <p className="text-xs text-zinc-500">Class: {s.class} {s.address ? `• ${s.address}` : ''}</p>
                          </div>
                          {s.vehicle_id && s.vehicle_id !== selectedVehicle && (
                            <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md">
                              In another vehicle
                            </span>
                          )}
                        </label>
                      )
                    })}
                </div>
              </div>

              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAssignments}
                  disabled={savingAssign}
                  className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {savingAssign ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Assignments ({tempAssignedIds.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* Top Bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Attendance Portal
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{dayjs().format('dddd, DD MMMM YYYY')}</p>
          </div>
          <button
            onClick={() => { setRecordsOpen(true); setRecordSelection('') }}
            className="w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl transition-colors shadow-sm"
          >
            <ClipboardList size={16} />
            Records
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setAddStudentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800/50"
          >
            <Plus size={16} />
            Quick Add Student
          </button>
          {currentUser && (
            <button 
              onClick={handleLogout}
              className="w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 rounded-xl transition-colors border border-red-200 dark:border-red-900/20"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>      </div>

      {/* Date Selector Row */}
      <div className="px-4 md:px-8 pt-4 flex justify-start">
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 w-fit shadow-sm">
          <button
            onClick={() => setTodayDate(dayjs(todayDate).subtract(1, 'day').format('YYYY-MM-DD'))}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-90"
          >
            <ChevronLeft size={18} className="text-zinc-500 dark:text-zinc-400" />
          </button>
          <div className="relative flex items-center gap-1.5">
            <CalendarCheck size={16} className="text-violet-650 dark:text-violet-400" />
            <input
              type="date"
              value={todayDate}
              onChange={e => setTodayDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">
              {dayjs(todayDate).format('DD MMM YYYY')}
            </span>
          </div>
          <button
            onClick={() => setTodayDate(dayjs(todayDate).add(1, 'day').format('YYYY-MM-DD'))}
            disabled={todayDate === dayjs().format('YYYY-MM-DD')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight size={18} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="px-4 md:px-8 py-4">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSection('class')}
            className={`flex-1 flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeSection === 'class'
                ? 'bg-white dark:bg-zinc-900 text-violet-600 shadow-sm'
                : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Users size={18} />
            Class
          </button>
          <button
            onClick={() => setActiveSection('vehicle')}
            className={`flex-1 flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold rounded-xl transition-all ${
              activeSection === 'vehicle'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm'
                : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Bus size={18} />
            Vehicle
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8">
        <div className="max-w-4xl space-y-6">

          {/* ===== CLASS SECTION ===== */}
          {activeSection === 'class' && (
            <>
              {/* Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => { setStatusFilter('all'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Students</span>
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <Users size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalClassStds}</p>
                </button>

                <button 
                  onClick={() => { setStatusFilter('present'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Present</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{schoolPresent}</p>
                </button>

                <button 
                  onClick={() => { setStatusFilter('absent'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Absent</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-455">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-455">{schoolAbsent}</p>
                </button>

                <button 
                  onClick={() => { setStatusFilter('remaining'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Remaining</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Clock size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-455">{schoolNotMarked}</p>
                </button>
              </div>

              {/* Class Breakdown Scroll list */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Class Breakdown (Click to filter):</p>
                <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                  {classes.map(c => {
                    const classStds = allStudents.filter(s => s.class === c)
                    const present = todayAttendance.filter(a => a.type === 'class' && a.status === 'present' && classStds.some(s => s.id === a.student_id)).length
                    const isSelected = selectedClass === c
                    return (
                      <button 
                        key={c}
                        onClick={() => {
                          setSelectedClass(c)
                          setStatusFilter('all')
                          setViewMode('details')
                        }}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        <span>{c}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400'
                        }`}>
                          {present}/{classStds.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Select Class</label>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="w-full sm:max-w-[250px] h-10 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Choose Class</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {selectedClass && classStudents.length > 0 && (
                  <button
                    onClick={() => markAllPresent('class')}
                    disabled={saving}
                    className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Mark All Present
                  </button>
                )}
              </div>

              {loading && selectedClass ? (
                <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-violet-600" /></div>
              ) : selectedClass ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  {displayedClassStudents.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No active students found in this class or matching filter.</div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {displayedClassStudents.map((s, i) => renderStudentRow(s, i, effectiveClassAtt, 'class'))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500">
                  Please select a class to view students.
                </div>
              )}
              
              {selectedClass && classStudents.length > 0 && !loading && (
                <div className="flex justify-center pt-4 pb-8">
                  <button 
                    onClick={() => submitAttendance('class')}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    Submit Class Attendance
                  </button>
                </div>
              )}
            </>
          )}

          {/* ===== VEHICLE SECTION ===== */}
          {activeSection === 'vehicle' && (
            <>
              {/* Vehicle Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => { setStatusFilter('all'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Students</span>
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                      <Bus size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalVehicleStds}</p>
                </button>

                <button 
                  onClick={() => { setStatusFilter('present'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Present</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{vehiclePresent}</p>
                </button>

                <button 
                  onClick={() => { setStatusFilter('absent'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Absent</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-450">
                      <XCircle size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-455">{vehicleAbsent}</p>
                </button>

                <button 
                  onClick={() => { setStatusFilter('remaining'); setViewMode('details'); }}
                  className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Remaining</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-450">
                      <Clock size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-455">{vehicleNotMarked}</p>
                </button>
              </div>

              {/* Vehicle Breakdown Scroll list */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Vehicle Breakdown (Click to filter):</p>
                <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                  {vehicles.map(v => {
                    const vehicleStds = allStudents.filter(s => s.vehicle_id === v.id)
                    const present = todayAttendance.filter(a => a.type === 'vehicle' && a.status === 'present' && vehicleStds.some(s => s.id === a.student_id)).length
                    const isSelected = selectedVehicle === v.id
                    return (
                      <button 
                        key={v.id}
                        onClick={() => {
                          setSelectedVehicle(v.id)
                          setStatusFilter('all')
                          setViewMode('details')
                        }}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        <span>{v.name}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400'
                        }`}>
                          {present}/{vehicleStds.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Village Breakdown Scroll list (across all vehicles) */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Village Breakdown (Click to filter):</p>
                <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                  {Object.entries(allVehicleVillageBreakdown).map(([village, stats]) => {
                    const isSelected = selectedVillageFilter === village
                    return (
                      <button 
                        key={village}
                        onClick={() => setSelectedVillageFilter(isSelected ? null : village)}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300'
                        }`}
                      >
                        <span>{village}</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-655 dark:text-zinc-400'
                        }`}>
                          {stats.present}/{stats.total}
                        </span>
                      </button>
                    )
                  })}
                  {selectedVillageFilter && (
                    <button 
                      onClick={() => setSelectedVillageFilter(null)}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Select Vehicle</label>
                  <select
                    value={selectedVehicle}
                    onChange={e => setSelectedVehicle(e.target.value)}
                    className="w-full sm:max-w-[300px] h-10 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {selectedVehicle && (
                    <button
                      onClick={() => {
                        setTempAssignedIds(new Set(vehicleStudents.map(s => s.id)))
                        setAssignSearch('')
                        setAssignModalOpen(true)
                      }}
                      className="h-10 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Users size={16} className="mr-2" />
                      Manage Students
                    </button>
                  )}
                  {selectedVehicle && vehicleStudents.length > 0 && (
                    <button
                      onClick={() => markAllPresent('vehicle')}
                      disabled={saving}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Mark All Present
                    </button>
                  )}
                </div>
              </div>

              {/* Vehicle Summary */}
              {selectedVehicle && vehicleStudents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-500">Total Assigned</p>
                      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{totalVehicleStudents}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-500">Present Today</p>
                      <p className="text-3xl font-bold text-emerald-600">{totalVehiclePresent}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-500 mb-3 flex items-center gap-1"><MapPin size={14}/> Village/Area</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {Object.entries(villageBreakdown).map(([village, stats]) => {
                        const isSelected = selectedVillageFilter === village
                        return (
                          <button
                            key={village}
                            onClick={() => setSelectedVillageFilter(isSelected ? null : village)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300'
                            }`}
                          >
                            <span>{village}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-655 dark:text-zinc-400'
                            }`}>
                              {stats.present}/{stats.total}
                            </span>
                          </button>
                        )
                      })}
                      {selectedVillageFilter && (
                        <button
                          onClick={() => setSelectedVillageFilter(null)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {loading && selectedVehicle ? (
                <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-emerald-600" /></div>
              ) : selectedVehicle ? (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  {displayedVehicleStudents.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No students are assigned to this vehicle yet or matching filter.</div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {displayedVehicleStudents.map((s, i) => renderStudentRow(s, i, effectiveVehicleAtt, 'vehicle'))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500">
                  Please select a vehicle to view students.
                </div>
              )}

              {selectedVehicle && vehicleStudents.length > 0 && !loading && (
                <div className="flex justify-center pt-4 pb-8">
                  <button 
                    onClick={() => submitAttendance('vehicle')}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                    Submit Transport Attendance
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Profile Info Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Info size={18} className="text-violet-600" />
                Student Profile
              </h3>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedProfile.name}</p>
                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Class: {selectedProfile.class}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Guardian Name</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.guardian_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Mobile</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Emergency Contact</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.emergency_contact || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Blood Group</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.blood_group || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Date of Birth</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.date_of_birth ? dayjs(selectedProfile.date_of_birth).format('DD MMM YYYY') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Gender</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{selectedProfile.gender || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-zinc-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedProfile.address || '-'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3">
              <button
                onClick={() => {
                  const p = selectedProfile
                  setSelectedProfile(null)
                  openEditModal(p)
                }}
                className="flex-1 h-10 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Pencil size={14} />
                Edit Profile
              </button>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="flex-1 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Assign Students to {vehicles.find(v => v.id === selectedVehicle)?.name}
              </h3>
              <button 
                onClick={() => setAssignModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search students by name, class, or village..."
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              <div className="grid gap-2">
                {allStudents
                  .filter(s => 
                    s.name.toLowerCase().includes(assignSearch.toLowerCase()) || 
                    s.class.toLowerCase().includes(assignSearch.toLowerCase()) || 
                    (s.address && s.address.toLowerCase().includes(assignSearch.toLowerCase()))
                  )
                  .map(s => {
                    const isSelected = tempAssignedIds.has(s.id)
                    return (
                      <label 
                        key={s.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(tempAssignedIds)
                            if (e.target.checked) newSet.add(s.id)
                            else newSet.delete(s.id)
                            setTempAssignedIds(newSet)
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
                          <p className="text-xs text-zinc-500">Class: {s.class} {s.address ? `• ${s.address}` : ''}</p>
                        </div>
                        {s.vehicle_id && s.vehicle_id !== selectedVehicle && (
                          <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md">
                            In another vehicle
                          </span>
                        )}
                      </label>
                    )
                  })}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAssignments}
                disabled={savingAssign}
                className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {savingAssign ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Assignments ({tempAssignedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Student Modal */}
      {addStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleAddStudent} className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus size={18} className="text-emerald-600" />
                Quick Add Student
              </h3>
              <button 
                type="button"
                onClick={() => setAddStudentOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Student Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={e => setAddForm({...addForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Class <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={addForm.class}
                    onChange={e => setAddForm({...addForm, class: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Vehicle</label>
                  <select
                    value={addForm.vehicle_id}
                    onChange={e => setAddForm({...addForm, vehicle_id: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None (Walk-in)</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={addForm.guardian_name}
                  onChange={e => setAddForm({...addForm, guardian_name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={addForm.mobile}
                  onChange={e => setAddForm({...addForm, mobile: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="10-digit number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Village / Address</label>
                <textarea
                  value={addForm.address}
                  onChange={e => setAddForm({...addForm, address: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                  placeholder="Enter address or village"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAddStudentOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingStudent}
                className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {addingStudent ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleEditStudent} className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Pencil size={18} className="text-emerald-600" />
                Edit Student Info
              </h3>
              <button 
                type="button"
                onClick={() => setEditStudentOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Student Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Class <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={editForm.class}
                    onChange={e => setEditForm({...editForm, class: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Vehicle</label>
                  <select
                    value={editForm.vehicle_id}
                    onChange={e => setEditForm({...editForm, vehicle_id: e.target.value})}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">None (Walk-in)</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={editForm.guardian_name}
                  onChange={e => setEditForm({...editForm, guardian_name: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={editForm.mobile}
                  onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="10-digit number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Village / Address</label>
                <textarea
                  value={editForm.address}
                  onChange={e => setEditForm({...editForm, address: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-20"
                  placeholder="Enter address or village"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditStudentOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editingStudent}
                className="px-6 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {editingStudent ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records Modal */}
      {recordsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ClipboardList size={18} className="text-blue-600" />
                Attendance Records
              </h3>
              <button 
                onClick={() => setRecordsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 bg-white dark:bg-zinc-900">
              {/* Type Toggle + Class/Vehicle Select */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => { setRecordType('class'); setRecordSelection('') }}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${recordType === 'class' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Class
                  </button>
                  <button
                    onClick={() => { setRecordType('vehicle'); setRecordSelection('') }}
                    className={`flex-1 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${recordType === 'vehicle' ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Vehicle
                  </button>
                </div>

                <select
                  value={recordSelection}
                  onChange={e => setRecordSelection(e.target.value)}
                  className="w-full sm:w-64 h-10 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select {recordType === 'class' ? 'Class' : 'Vehicle'}</option>
                  {recordType === 'class' 
                    ? classes.map(c => <option key={c} value={c}>{c}</option>)
                    : vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type})</option>)
                  }
                </select>

                {recordSelection && recordData.length > 0 && (
                  <button
                    onClick={downloadRecordsPDF}
                    disabled={pdfLoading}
                    className="w-full sm:w-auto h-10 px-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                  >
                    {pdfLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FileDown size={14} />
                    )}
                    Download PDF Report
                  </button>
                )}
              </div>

              {/* Month Selector */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setRecordMonth(dayjs(recordMonth).subtract(1, 'month').format('YYYY-MM'))}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-600 dark:text-zinc-400"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 min-w-[140px] text-center">
                  {dayjs(recordMonth).format('MMMM YYYY')}
                </span>
                <button
                  onClick={() => setRecordMonth(dayjs(recordMonth).add(1, 'month').format('YYYY-MM'))}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-600 dark:text-zinc-400"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-zinc-50 dark:bg-zinc-950/50">
              {loadingRecords ? (
                <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-blue-600" /></div>
              ) : recordSelection && recordData.length > 0 ? (
                <div className="space-y-2">
                  {recordData.map((s, i) => (
                    <div key={s.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      {/* Student Row */}
                      <button
                        onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-500">{i + 1}</div>
                          <div className="text-left">
                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{s.name}</p>
                            <p className="text-xs text-zinc-500">{s.guardian_name || s.class}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-600 font-bold">{s.present}P</span>
                            <span className="text-zinc-300 dark:text-zinc-600">|</span>
                            <span className="text-rose-600 font-bold">{s.absent}A</span>
                            <span className="text-zinc-300 dark:text-zinc-600">|</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${s.percentage >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : s.percentage >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {s.percentage}%
                            </span>
                          </div>
                          <ChevronRight size={16} className={`text-zinc-400 transition-transform ${expandedStudent === s.id ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {expandedStudent === s.id && (
                        <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                          {/* Summary Bar */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                              <p className="text-lg font-bold text-blue-600">{s.total}</p>
                              <p className="text-[10px] text-blue-500 font-medium uppercase">Total Days</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                              <p className="text-lg font-bold text-emerald-600">{s.present}</p>
                              <p className="text-[10px] text-emerald-500 font-medium uppercase">Present</p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2">
                              <p className="text-lg font-bold text-rose-600">{s.absent}</p>
                              <p className="text-[10px] text-rose-500 font-medium uppercase">Absent</p>
                            </div>
                          </div>

                          {/* Absent Dates */}
                          {s.absentDates && s.absentDates.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-rose-600 mb-1.5 uppercase tracking-wider">❌ Absent on these dates:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {s.absentDates.map((d: string) => (
                                  <span key={d} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs font-medium rounded-md border border-rose-100 dark:border-rose-800/50">
                                    {dayjs(d).format('DD MMM')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Present Dates */}
                          {s.presentDates && s.presentDates.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-emerald-600 mb-1.5 uppercase tracking-wider">✅ Present on these dates:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {s.presentDates.map((d: string) => (
                                  <span key={d} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-md border border-emerald-100 dark:border-emerald-800/50">
                                    {dayjs(d).format('DD MMM')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {s.total === 0 && (
                            <p className="text-xs text-zinc-400 text-center py-2">No attendance data for this month.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : recordSelection ? (
                <div className="text-center p-12 text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  No records found for this selection.
                </div>
              ) : (
                <div className="text-center p-12 text-zinc-500">
                  Please select a {recordType === 'class' ? 'class' : 'vehicle'} to view records.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
