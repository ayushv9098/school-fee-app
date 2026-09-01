'use client'
import { CustomSelect } from '@/components/ui/custom-select'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomDateInput } from '@/components/ui/custom-date-input'
import { getDayType, getHolidayForDate, HolidayItem, isSunday, STANDARD_HOLIDAYS } from '@/lib/holidays'
import { CheckCircle2, XCircle, Users, Plus, Calendar, Download, Camera, Loader2, X, Pencil, Trash2, Copy, ChevronLeft, ChevronRight, RotateCcw, MapPin, Map, Clock, Home, LogOut, AlertTriangle, Sparkles, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const LiveMap = dynamic(() => import('@/components/live-map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-400">Initializing Map...</div>
})

interface Teacher {
  id: string
  name: string
  subject: string
  monthly_salary: number
  email: string
  auth_user_id?: string
}

interface AttendanceRecord {
  id: string
  teacher_id: string
  date: string
  check_in_time: string
  check_out_time?: string
  status: string
  selfie_url: string
  late_entry?: boolean
  early_exit?: boolean
  last_lat?: number
  last_lng?: number
  teachers?: {
    name: string
    subject: string
  }
}

interface Props {
  initialTeachers: Teacher[]
  todayAttendance: AttendanceRecord[]
  monthlyAttendance: AttendanceRecord[]
  pendingLeaves: any[]
  initialHolidays?: HolidayItem[]
  adminEmail: string
  adminId: string
  selectedDate: string
  selectedMonth: number
  selectedYear: number
  settings?: any
}

export default function AttendanceClient({ 
  initialTeachers, 
  todayAttendance, 
  monthlyAttendance, 
  pendingLeaves: initialPendingLeaves,
  initialHolidays = [],
  adminEmail, 
  adminId,
  selectedDate,
  selectedMonth,
  selectedYear,
  settings
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'holidays'>('attendance')
  const [loading, setLoading] = useState(false)
  const [pendingLeaves, setPendingLeaves] = useState(initialPendingLeaves)
  const [holidays, setHolidays] = useState<HolidayItem[]>(initialHolidays)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: dayjs().format('YYYY-MM-DD'), title: '', description: '' })
  const [savingHoliday, setSavingHoliday] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    subject: '',
    salary: '',
    email: '',
    mobile: '',
    address: '',
  })
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [movementHistory, setMovementHistory] = useState<any[]>([])
  const [trackingTeacher, setTrackingTeacher] = useState<any>(null)

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault()
    if (!newHoliday.title || !newHoliday.date) return
    setSavingHoliday(true)
    try {
      const { data, error } = await supabase.from('holidays').insert({
        user_id: adminId,
        date: newHoliday.date,
        title: newHoliday.title.trim(),
        description: newHoliday.description?.trim() || null
      }).select().single()

      if (error) throw error

      setHolidays(prev => [...prev.filter(h => h.date !== newHoliday.date), data].sort((a, b) => a.date.localeCompare(b.date)))
      setShowHolidayModal(false)
      setNewHoliday({ date: dayjs().format('YYYY-MM-DD'), title: '', description: '' })
      alert('Holiday added successfully! 🎉')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingHoliday(false)
    }
  }

  async function handleDeleteHoliday(holidayId: string) {
    if (!confirm('Are you sure you want to remove this holiday?')) return
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', holidayId)
      if (error) throw error
      setHolidays(prev => prev.filter(h => h.id !== holidayId))
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }


  const daysInMonth = dayjs().year(selectedYear).month(selectedMonth - 1).daysInMonth()
  const dates = Array.from({ length: daysInMonth }, (_, i) => dayjs().year(selectedYear).month(selectedMonth - 1).date(i + 1).format('YYYY-MM-DD'))

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const YEARS = Array.from({ length: 5 }, (_, i) => dayjs().year() - i)

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4')
    const monthName = MONTHS[selectedMonth - 1]
    const schoolName = settings?.school_name || 'School'
    const schoolAddress = settings?.address || ''
    
    // Header - School Info
    doc.setFillColor(124, 58, 237)
    doc.rect(0, 0, 297, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), 14, 12)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    if (schoolAddress) doc.text(schoolAddress, 14, 18)
    doc.text(`Monthly Attendance Register  •  ${monthName} ${selectedYear}`, 14, 24)
    
    // Right side info
    doc.setFontSize(9)
    doc.text(`Total Staff: ${initialTeachers.length}`, 260, 12)
    doc.text(`Generated: ${dayjs().format('DD MMM YYYY, hh:mm A')}`, 235, 18)
    
    doc.setTextColor(0, 0, 0)

    const tableHeaders = ['#', 'Teacher Name', 'Role', ...dates.map(d => dayjs(d).format('D')), 'P', 'A', 'L', 'H', 'LV', '%']
    const tableData = initialTeachers.map((teacher, idx) => {
      const records = monthlyAttendance.filter(a => a.teacher_id === teacher.id)
      const pCount = records.filter(a => a.status === 'present').length
      const aCount = records.filter(a => a.status === 'absent').length
      const lCount = records.filter(a => a.status === 'late').length
      const hCount = records.filter(a => a.status === 'half_day').length
      const lvCount = records.filter(a => a.status === 'on_leave').length
      const workingDays = dates.filter(d => getDayType(d, holidays).type === 'working').length
      const attendPercent = workingDays > 0 ? Math.round(((pCount + lCount + hCount) / workingDays) * 100) : 0
      
      const dayStatuses = dates.map(date => {
        const r = records.find(a => a.date === date)
        const dt = getDayType(date, holidays)
        if (!r) {
          if (dt.type === 'sunday') return 'S'
          if (dt.type === 'holiday') return 'H'
          return '-'
        }
        if (r.status === 'present') return 'P'
        if (r.status === 'absent') return 'A'
        if (r.status === 'late') return 'L'
        if (r.status === 'half_day') return 'H'
        if (r.status === 'on_leave') return 'LV'
        return '-'
      })

      return [idx + 1, teacher.name, teacher.subject || '-', ...dayStatuses, pCount, aCount, lCount, hCount, lvCount, `${attendPercent}%`]
    })

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 32,
      styles: { fontSize: 6, cellPadding: 1.5, lineColor: [220, 220, 220], lineWidth: 0.2 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 6, halign: 'center' },
      columnStyles: { 
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 18, fontSize: 5 }
      },
      bodyStyles: { halign: 'center' },
      didParseCell: function(data: any) {
        if (data.section === 'body' && data.column.index >= 3) {
          const val = data.cell.raw
          if (val === 'P') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold' }
          else if (val === 'A') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold' }
          else if (val === 'L') { data.cell.styles.textColor = [234, 88, 12] }
          else if (val === 'H') { data.cell.styles.textColor = [124, 58, 237]; data.cell.styles.fontStyle = 'bold' }
          else if (val === 'LV') { data.cell.styles.textColor = [37, 99, 235]; data.cell.styles.fontSize = 5 }
          else if (val === 'S') { data.cell.styles.textColor = [161, 161, 170]; data.cell.styles.fillColor = [250, 250, 250] }
        }
      },
      alternateRowStyles: { fillColor: [248, 247, 255] }
    })

    // Legend at bottom
    const finalY = (doc as any).lastAutoTable.finalY + 6
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text('P = Present  |  A = Absent  |  L = Late  |  H = Half Day / Holiday  |  LV = On Leave  |  S = Sunday  |  % = Attendance Percentage', 14, finalY)
    doc.text(`${schoolName}  •  Confidential Document`, 14, finalY + 5)

    doc.save(`Attendance_${monthName}_${selectedYear}.pdf`)
  }

  const handleExportSingleTeacherPDF = (teacher: Teacher) => {
    const doc = new jsPDF()
    const monthName = MONTHS[selectedMonth - 1]
    const schoolName = settings?.school_name || 'School'
    const schoolAddress = settings?.address || ''
    const records = monthlyAttendance.filter(a => a.teacher_id === teacher.id)
    
    // Header
    doc.setFillColor(124, 58, 237)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(schoolName.toUpperCase(), 14, 12)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    if (schoolAddress) doc.text(schoolAddress, 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Individual Attendance Report  •  ${monthName} ${selectedYear}`, 14, 28)
    
    doc.setTextColor(0, 0, 0)
    
    // Teacher Info Card
    doc.setFillColor(248, 247, 255)
    doc.roundedRect(14, 40, 182, 22, 3, 3, 'F')
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(50, 50, 50)
    doc.text(teacher.name, 20, 50)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(`Role: ${teacher.subject || '-'}  |  Salary: ₹${teacher.monthly_salary?.toLocaleString() || '-'}`, 20, 57)

    // Summary Stats
    const pCount = records.filter(a => a.status === 'present').length
    const lCount = records.filter(a => a.status === 'late').length
    const hCount = records.filter(a => a.status === 'half_day').length
    const lvCount = records.filter(a => a.status === 'on_leave').length
    const workingDays = dates.filter(d => getDayType(d, holidays).type === 'working').length
    const aCount = Math.max(0, workingDays - (pCount + lCount + hCount + lvCount))
    const attendPercent = workingDays > 0 ? Math.round(((pCount + lCount + hCount) / workingDays) * 100) : 0

    const statsY = 70
    const statsData = [
      { label: 'Present', value: pCount, color: [22, 163, 74] },
      { label: 'Absent', value: aCount, color: [220, 38, 38] },
      { label: 'Late', value: lCount, color: [234, 88, 12] },
      { label: 'Half Day', value: hCount, color: [202, 138, 4] },
      { label: 'Leave', value: lvCount, color: [37, 99, 235] },
      { label: 'Attendance', value: `${attendPercent}%`, color: [124, 58, 237] },
    ]
    
    const boxW = 28
    statsData.forEach((stat, i) => {
      const x = 14 + i * (boxW + 4.5)
      doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
      doc.roundedRect(x, statsY, boxW, 16, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(String(stat.value), x + boxW / 2, statsY + 8, { align: 'center' })
      doc.setFontSize(6)
      doc.text(stat.label.toUpperCase(), x + boxW / 2, statsY + 13, { align: 'center' })
    })

    doc.setTextColor(0, 0, 0)

    // Attendance Table
    const tableData = dates.map(date => {
      const r = records.find(a => a.date === date)
      const dayName = dayjs(date).format('ddd')
      const dt = getDayType(date, holidays)
      let status = '-'
      if (r) status = r.status.replace('_', ' ').toUpperCase()
      else if (dt.type === 'holiday') status = `HOLIDAY (${dt.title?.toUpperCase()})`
      else if (dt.type === 'sunday') status = 'SUNDAY'
      else status = 'ABSENT'
      
      return [
        dayjs(date).format('DD'),
        dayName.toUpperCase(),
        status,
        r?.check_in_time ? dayjs(r.check_in_time).format('hh:mm A') : '-',
        r?.check_out_time ? dayjs(r.check_out_time).format('hh:mm A') : '-'
      ]
    })

    autoTable(doc, {
      head: [['Date', 'Day', 'Status', 'Check In', 'Check Out']],
      body: tableData,
      startY: 92,
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [230, 230, 230], lineWidth: 0.2 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { halign: 'center' },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold' },
        1: { cellWidth: 18 },
        2: { cellWidth: 30, fontStyle: 'bold' },
      },
      didParseCell: function(data: any) {
        if (data.section === 'body' && data.column.index === 2) {
          const val = data.cell.raw
          if (val === 'PRESENT') { data.cell.styles.textColor = [22, 163, 74] }
          else if (val === 'ABSENT') { data.cell.styles.textColor = [220, 38, 38] }
          else if (val === 'LATE') { data.cell.styles.textColor = [234, 88, 12] }
          else if (val === 'HALF DAY') { data.cell.styles.textColor = [202, 138, 4] }
          else if (val === 'ON LEAVE') { data.cell.styles.textColor = [37, 99, 235] }
          else if (val.startsWith('HOLIDAY')) { data.cell.styles.textColor = [124, 58, 237]; data.cell.styles.fillColor = [245, 243, 255] }
          else if (val === 'SUNDAY') { data.cell.styles.textColor = [161, 161, 170]; data.cell.styles.fillColor = [250, 250, 250] }
        }
      },
      alternateRowStyles: { fillColor: [248, 247, 255] }
    })

    // Footer
    const footerY = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated on ${dayjs().format('DD MMM YYYY, hh:mm A')}  •  ${schoolName}  •  Confidential`, 14, footerY)

    doc.save(`${teacher.name}_Attendance_${monthName}.pdf`)
  }


  async function fetchMovementHistory(attendanceId: string, teacher: any) {
    setLoading(true)
    setTrackingTeacher({ ...teacher, attendanceId })
    const { data } = await supabase
      .from('staff_movements')
      .select('*')
      .eq('attendance_id', attendanceId)
      .order('exit_time', { ascending: false })
    
    setMovementHistory(data || [])
    setShowMovementModal(true)
    setLoading(false)
  }

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set('date', date)
    router.push(`?${params.toString()}`)
  }

  const handleMonthChange = (month: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('month', String(month))
    router.push(`?${params.toString()}`)
  }

  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('year', String(year))
    router.push(`?${params.toString()}`)
  }

  const handlePrevMonth = () => {
    let newMonth = selectedMonth - 1
    let newYear = selectedYear
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    }
    const params = new URLSearchParams(window.location.search)
    params.set('month', String(newMonth))
    params.set('year', String(newYear))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleNextMonth = () => {
    let newMonth = selectedMonth + 1
    let newYear = selectedYear
    if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    const params = new URLSearchParams(window.location.search)
    params.set('month', String(newMonth))
    params.set('year', String(newYear))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handleGoToToday = () => {
    const today = dayjs()
    const params = new URLSearchParams()
    params.set('date', today.format('YYYY-MM-DD'))
    params.set('month', String(today.month() + 1))
    params.set('year', String(today.year()))
    router.push(`?${params.toString()}`)
  }

  async function handleCopyInvite(teacherId: string, email: string) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const inviteLink = `${origin}/teacher-signup?email=${encodeURIComponent(email)}&teacher_id=${teacherId}`
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedId(teacherId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      alert('Link: ' + inviteLink)
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { data: teacher, error } = await supabase
      .from('teachers')
      .insert({
        user_id: adminId, 
        name: newTeacher.name,
        subject: newTeacher.subject,
        monthly_salary: Number(newTeacher.salary),
        email: newTeacher.email,
        mobile: newTeacher.mobile || null,
        address: newTeacher.address || null,
        role: 'teacher'
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // Send Invite via Resend
    try {
      const inviteRes = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newTeacher.email,
          teacherName: newTeacher.name,
          adminEmail: adminEmail,
          teacherId: teacher.id
        })
      })
      
      const inviteData = await inviteRes.json()
      if (!inviteRes.ok) {
        throw new Error(inviteData.error || 'Failed to send invitation email')
      }
      
      const origin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const webLink = `${origin}/teacher-signup?email=${encodeURIComponent(newTeacher.email)}&teacher_id=${teacher.id}`
      const appLink = `teacherapae://signup?email=${encodeURIComponent(newTeacher.email)}&teacher_id=${teacher.id}`
      
      const proceed = confirm(`Teacher added! ✅\n\nInvitation Email Status: ${inviteRes.ok ? 'Sent' : 'Failed'}\n\nDo you want to copy the WhatsApp Invite Message now?`)
      
      if (proceed) {
        const apkLink = 'https://expo.dev/accounts/ayushv9098/projects/teacher-mobile-app/builds/99201c9a-e96d-4d41-bc83-4618880d8cf3'
        const message = `Welcome to Ayushman Academy!\n\n1. First, download the App here:\n📥 ${apkLink}\n\n2. After installing, click this link to set your password and login:\n🔐 ${appLink}\n\n🌐 Web Portal: ${webLink}`
        await navigator.clipboard.writeText(message)
        alert('WhatsApp Invite Message copied to clipboard! 📋')
      }
    } catch (err: any) {
      console.error('Failed to send invite email:', err)
      alert('Teacher added, but invite email failed.')
    }

    setShowAddModal(false)
    setNewTeacher({ name: '', subject: '', salary: '', email: '', mobile: '', address: '' })
    setLoading(false)
    router.refresh()
  }

  async function handleEditTeacher(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTeacher) return
    setLoading(true)

    const { error } = await supabase
      .from('teachers')
      .update({
        name: editingTeacher.name,
        subject: editingTeacher.subject,
        monthly_salary: Number(editingTeacher.monthly_salary),
        email: editingTeacher.email
      })
      .eq('id', editingTeacher.id)

    if (error) {
      alert(error.message)
    } else {
      setShowEditModal(false)
      setEditingTeacher(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteTeacher(id: string) {
    if (!confirm('Are you sure? All records for this teacher will be deleted.')) return
    
    setLoading(true)
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id)

    if (error) alert(error.message)
    else {
      setShowEditModal(false)
      setEditingTeacher(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleUpdateAttendance(status: string) {
    setLoading(true)
    const { error } = await supabase
      .from('attendance')
      .upsert({
        teacher_id: editingTeacher?.id,
        admin_id: adminId,
        date: selectedDate,
        status,
        check_in_time: status === 'present' ? new Date().toISOString() : null
      }, { onConflict: 'teacher_id,date' })

    if (error) alert(error.message)
    else router.refresh()
    setLoading(false)
  }

  async function handleLeaveAction(leaveId: string, status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status })
        .eq('id', leaveId)

      if (error) throw error

      if (status === 'approved') {
        const leave = pendingLeaves.find(l => l.id === leaveId)
        if (leave) {
          const start = dayjs(leave.start_date)
          const end = dayjs(leave.end_date)
          const diff = end.diff(start, 'day')
          
          for (let i = 0; i <= diff; i++) {
            const date = start.add(i, 'day').format('YYYY-MM-DD')
            await supabase.from('attendance').upsert({
              teacher_id: leave.teacher_id,
              admin_id: adminId,
              date: date,
              status: 'on_leave'
            }, { onConflict: 'teacher_id,date' })
          }
        }
      }
      
      alert(`Leave application ${status} successfully! ✅`)
      setPendingLeaves(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l))
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isSelectedToday = selectedDate === dayjs().format('YYYY-MM-DD')
  const isPastDate = dayjs(selectedDate).isBefore(dayjs(), 'day')
  const isFutureDate = dayjs(selectedDate).isAfter(dayjs(), 'day')
  const currentHour = dayjs().hour()
  const isPast3PM = currentHour >= 15
  const selectedDayType = getDayType(selectedDate, holidays)
  const todayDayType = getDayType(dayjs().format('YYYY-MM-DD'), holidays)

  // Unmarked staff for today
  const unmarkedStaffToday = initialTeachers.filter(t => !todayAttendance.some(a => a.teacher_id === t.id))
  const show3PMStaffAlert = isPast3PM && todayDayType.type === 'working' && unmarkedStaffToday.length > 0

  const presentCount = todayAttendance.filter(a => ['present', 'late', 'half_day'].includes(a.status)).length
  const absentCount = selectedDayType.type === 'working' 
    ? (isSelectedToday ? (isPast3PM ? initialTeachers.length - presentCount : 0) : initialTeachers.length - presentCount)
    : 0
  const pendingCount = (isSelectedToday && !isPast3PM && selectedDayType.type === 'working') 
    ? initialTeachers.length - presentCount 
    : 0

  // Combine standard and custom holidays for display in Holidays tab
  const allDisplayHolidays: (HolidayItem & { isCustom: boolean })[] = [
    ...holidays.map(h => ({ ...h, isCustom: true })),
    ...Object.entries(STANDARD_HOLIDAYS)
      .filter(([date]) => !holidays.some(h => h.date === date))
      .map(([date, title]) => ({ date, title, description: null, isCustom: false }))
  ].sort((a, b) => a.date.localeCompare(b.date))

  const monthHolidays = allDisplayHolidays.filter(h => {
    const d = dayjs(h.date)
    return d.year() === selectedYear && d.month() + 1 === selectedMonth
  })

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">Teacher Attendance</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">Control and track staff records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('attendance')}
                className={cn(
                   "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                   activeTab === 'attendance' ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300"
                )}
             >
                Records
             </button>
             <button 
                onClick={() => setActiveTab('leaves')}
                className={cn(
                   "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                   activeTab === 'leaves' ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300"
                )}
             >
                Leaves
                {pendingLeaves.length > 0 && (
                   <span className="w-5 h-5 bg-violet-600 text-white text-[10px] rounded-full flex items-center justify-center">
                      {pendingLeaves.length}
                   </span>
                )}
             </button>
             <button 
                onClick={() => setActiveTab('holidays')}
                className={cn(
                   "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                   activeTab === 'holidays' ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300"
                )}
             >
                Holidays
                {monthHolidays.length > 0 && (
                   <span className="w-5 h-5 bg-purple-600 text-white text-[10px] rounded-full flex items-center justify-center">
                      {monthHolidays.length}
                   </span>
                )}
             </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* 3:00 PM Staff Attendance Alert Banner */}
      {show3PMStaffAlert && activeTab === 'attendance' && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-4 rounded-2xl flex items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                ⚠️ 3:00 PM Staff Attendance Cutoff Alert
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-200 font-medium mt-0.5">
                {unmarkedStaffToday.length} staff member{unmarkedStaffToday.length > 1 ? 's' : ''} ({unmarkedStaffToday.map(t => t.name).join(', ')}) have not marked attendance today by 3:00 PM.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' ? (
         <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
               {[
               { label: 'Present Today', value: presentCount, icon: CheckCircle2, color: 'green', span: 'col-span-1' },
               ...(pendingCount > 0 ? [{ label: 'Pending / Not Marked', value: pendingCount, icon: Clock, color: 'amber', span: 'col-span-1' }] : []),
               { label: 'Absent Today', value: absentCount, icon: XCircle, color: 'red', span: 'col-span-1' },
               { label: 'Total Staff', value: initialTeachers.length, icon: Users, color: 'violet', span: 'col-span-2 md:col-span-1' }
               ].map(stat => (
               <Card key={stat.label} className={cn(
                  stat.span,
                  stat.color === 'green' ? "border-green-100 bg-green-50/50" :
                  stat.color === 'amber' ? "border-amber-100 bg-amber-50/50" :
                  stat.color === 'red' ? "border-red-100 bg-red-50/50" :
                  "border-violet-100 bg-violet-50/50",
                  "hover:shadow-md transition"
               )}>
                  <CardContent className="p-4">
                     <div className="flex items-center justify-between mb-2 md:mb-3">
                     <span className={cn(
                        stat.color === 'green' ? "text-green-700/60" :
                        stat.color === 'amber' ? "text-amber-700/60" :
                        stat.color === 'red' ? "text-red-700/60" :
                        "text-violet-700/60",
                        "text-xs md:text-sm font-bold uppercase tracking-wider"
                     )}>{stat.label}</span>
                     <div className={cn(
                        stat.color === 'green' ? "bg-green-100 text-green-600 border-green-200/50" :
                        stat.color === 'amber' ? "bg-amber-100 text-amber-600 border-amber-200/50" :
                        stat.color === 'red' ? "bg-red-100 text-red-600 border-red-200/50" :
                        "bg-violet-100 text-violet-600 border-violet-200/50",
                        "w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center shadow-sm border"
                     )}>
                        <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     </div>
                     <p className={cn(
                        stat.color === 'green' ? "text-green-600" :
                        stat.color === 'amber' ? "text-amber-600" :
                        stat.color === 'red' ? "text-red-600" :
                        "text-violet-600",
                        "text-2xl font-semibold tracking-tight"
                     )}>{stat.value}</p>
                  </CardContent>
               </Card>
               ))}
            </div>

            {/* Daily Status Card */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden font-sans">
               <CardHeader className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <CardTitle className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2 font-sans text-[11px] md:text-sm">
                  <Calendar size={16} className="text-violet-600 font-sans" /> Status: {dayjs(selectedDate).format('dddd, DD MMM YYYY')}
               </CardTitle>
               <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm self-start md:self-auto">
                  <Calendar size={14} className="text-zinc-400 ml-2" />
                  <CustomDateInput 
                     value={selectedDate}
                     onChange={(e) => handleDateChange(e.target.value)}
                     className="text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none pr-2 bg-transparent h-7 min-w-[130px]"
                  />
               </div>
               </CardHeader>

               {/* Banner for Holiday or Sunday */}
               {selectedDayType.type === 'holiday' && (
                 <div className="bg-purple-50 dark:bg-purple-950/50 border-b border-purple-100 dark:border-purple-900/50 px-4 py-3 flex items-center gap-2.5 text-purple-800 dark:text-purple-300 text-xs font-bold animate-in fade-in">
                   <PartyPopper size={16} className="text-purple-600 shrink-0" />
                   <span>🎉 School Holiday: {selectedDayType.title} (No regular classes / attendance)</span>
                 </div>
               )}
               {selectedDayType.type === 'sunday' && (
                 <div className="bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700/60 px-4 py-3 flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 text-xs font-bold animate-in fade-in">
                   <Calendar size={16} className="text-zinc-500 shrink-0" />
                   <span>☀️ Sunday (Weekly Off)</span>
                 </div>
               )}

               <CardContent className="p-0 overflow-hidden font-sans">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                     {initialTeachers.map(teacher => {
                        const record = todayAttendance.find(a => a.teacher_id === teacher.id)
                        const statusColors = {
                           present: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
                           late: 'bg-amber-50 text-amber-700 ring-amber-100',
                           half_day: 'bg-violet-50 text-violet-700 ring-violet-100',
                           on_leave: 'bg-blue-50 text-blue-700 ring-blue-100',
                           absent: 'bg-red-50 text-red-700 ring-red-100'
                        }

                        // Determine status display for teacher
                        let statusBadge = null
                        let dotColor = "bg-red-500"

                        if (record) {
                          dotColor = record.status === 'present' ? "bg-emerald-500" :
                                     record.status === 'late' ? "bg-amber-500" :
                                     record.status === 'half_day' ? "bg-violet-500" :
                                     record.status === 'on_leave' ? "bg-blue-500" : "bg-red-500"
                          statusBadge = (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ring-1 ring-inset",
                              statusColors[record.status as keyof typeof statusColors] || statusColors.absent
                            )}>
                              {record.status.replace('_', ' ')}
                            </span>
                          )
                        } else {
                          if (selectedDayType.type === 'holiday') {
                            dotColor = "bg-purple-500"
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                                🎉 Holiday ({selectedDayType.title})
                              </span>
                            )
                          } else if (selectedDayType.type === 'sunday') {
                            dotColor = "bg-zinc-400"
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200">
                                Sunday
                              </span>
                            )
                          } else if (isSelectedToday) {
                            if (isPast3PM) {
                              dotColor = "bg-rose-500"
                              statusBadge = (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 ring-1 ring-rose-300 font-bold animate-pulse">
                                  Unmarked (Past 3 PM)
                                </span>
                              )
                            } else {
                              dotColor = "bg-amber-400"
                              statusBadge = (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                                  Pending / Not Marked
                                </span>
                              )
                            }
                          } else if (isPastDate) {
                            dotColor = "bg-rose-500"
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                                Unmarked / Absent
                              </span>
                            )
                          } else {
                            dotColor = "bg-zinc-300"
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200">
                                Upcoming
                              </span>
                            )
                          }
                        }

                        return (
                           <div 
                              key={teacher.id}
                              onClick={() => { setEditingTeacher(teacher); setShowEditModal(true); }}
                              className="group p-4 hover:bg-zinc-50 dark:bg-zinc-950/80 transition-all cursor-pointer flex items-center gap-4"
                           >
                              {/* Selfie Thumbnail */}
                              <div className="relative shrink-0">
                                 {record?.selfie_url ? (
                                    <div 
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          const url = supabase.storage.from('attendance-selfies').getPublicUrl(record.selfie_url).data.publicUrl;
                                          setSelectedImage(url);
                                       }}
                                       className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden ring-2 ring-white shadow-md cursor-zoom-in group-hover:scale-105 transition-transform"
                                    >
                                       <img 
                                          src={supabase.storage.from('attendance-selfies').getPublicUrl(record.selfie_url).data.publicUrl} 
                                          alt={teacher.name} 
                                          className="w-full h-full object-cover"
                                       />
                                    </div>
                                 ) : (
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                                       <Camera size={20} />
                                    </div>
                                 )}
                                 {/* Status Indicator Dot */}
                                 <div className={cn(
                                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                                    dotColor
                                 )} />
                              </div>

                              {/* Staff Info */}
                              <div className="flex-1 min-w-0">
                                 <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm md:text-base truncate group-hover:text-violet-600 transition-colors">
                                    {teacher.name}
                                 </h3>
                                 <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
                                       {teacher.subject}
                                    </span>
                                    {statusBadge}
                                 </div>
                              </div>

                              {/* Time & Tracking */}
                              <div className="text-right shrink-0 space-y-2">
                                 <div className="flex flex-col">
                                    <div className="flex items-center justify-end gap-1.5 text-zinc-900 dark:text-zinc-100">
                                       <Clock size={12} className="text-zinc-400" />
                                       <span className="text-xs md:text-sm font-bold tracking-tight">
                                          {record?.check_in_time ? dayjs(record.check_in_time).format('hh:mm A') : '--:--'}
                                       </span>
                                    </div>
                                    {record?.check_out_time && (
                                       <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tight mt-0.5">
                                          Out: {dayjs(record.check_out_time).format('hh:mm A')}
                                       </span>
                                    )}
                                 </div>

                                 {record && (
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); fetchMovementHistory(record.id, teacher); }}
                                       className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-lg shadow-violet-100 group-hover:shadow-none"
                                    >
                                       <MapPin size={10} strokeWidth={3} />
                                       Track
                                    </button>
                                 )}
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </CardContent>
            </Card>

            {/* Monthly Register Card */}
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden mb-10 font-sans">
               <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-950/50 gap-4">
               <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-sm md:text-base font-bold text-zinc-800 tracking-tight whitespace-nowrap">
                     {dayjs().year(selectedYear).month(selectedMonth - 1).format('MMMM YYYY')} Register
                  </h2>
                  
                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                     <button 
                     onClick={handlePrevMonth}
                     className="p-1.5 hover:bg-zinc-50 dark:bg-zinc-950 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
                     title="Previous Month"
                     >
                     <ChevronLeft size={16} />
                     </button>
                     
                     <div className="h-4 w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
                     
                     <CustomSelect 
                     value={selectedMonth}
                     onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                     className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-transparent px-1 focus:outline-none cursor-pointer"
                     >
                     {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                     ))}
                     </CustomSelect>
                     
                     <CustomSelect 
                     value={selectedYear}
                     onChange={(e) => handleYearChange(parseInt(e.target.value))}
                     className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-transparent px-1 focus:outline-none cursor-pointer"
                     >
                     {YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                     ))}
                     </CustomSelect>

                     <div className="h-4 w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />

                     <button 
                     onClick={handleNextMonth}
                     className="p-1.5 hover:bg-zinc-50 dark:bg-zinc-950 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
                     title="Next Month"
                     >
                     <ChevronRight size={16} />
                     </button>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button 
                     onClick={handleGoToToday}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:bg-white dark:bg-zinc-900 hover:text-violet-600 border border-transparent hover:border-zinc-200 dark:border-zinc-800 transition-all shadow-none hover:shadow-sm"
                  >
                     <RotateCcw size={14} /> Today
                  </button>
                  <button 
                     onClick={handleExportPDF}
                     className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-600 hover:bg-violet-50 border border-violet-100 transition-colors"
                  >
                     <Download size={14} /> Export PDF
                  </button>
               </div>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto scrollbar-hide font-sans relative">
               <div key={`${selectedMonth}-${selectedYear}`} className="animate-in fade-in slide-in-from-right-1 duration-500">
                  <table className="w-full text-[10px] border-collapse min-w-[800px] table-fixed font-sans">
                     <thead className="bg-zinc-50 dark:bg-zinc-950/30 font-sans sticky top-0 z-20">
                     <tr className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <th className="text-left p-3 border-r border-zinc-100 dark:border-zinc-800/50 sticky left-0 bg-zinc-50 dark:bg-zinc-950 z-30 font-bold text-zinc-400 uppercase tracking-tighter w-[140px] align-middle">
                           Teacher
                        </th>
                        {dates.map(date => {
                           const isSun = dayjs(date).day() === 0
                           const dt = getDayType(date, holidays)
                           const isTod = date === dayjs().format('YYYY-MM-DD')
                           return (
                           <th 
                              key={date} 
                              title={dt.title || undefined}
                              className={`p-1.5 border-r border-zinc-100 dark:border-zinc-800/50 text-center font-bold min-w-[36px] w-[36px] transition-colors
                                 ${isSun ? 'bg-red-50/50 text-red-400' : dt.type === 'holiday' ? 'bg-purple-50/80 text-purple-600 font-black' : 'text-zinc-400'}
                                 ${isTod ? 'bg-violet-50 text-violet-600 ring-inset ring-1 ring-violet-100' : ''}
                              `}
                           >
                              <span className="block text-[8px] uppercase tracking-tighter leading-none mb-1 opacity-70">
                                 {dayjs(date).format('ddd')}
                              </span>
                              <span className="block text-[11px] leading-none font-sans">
                                 {dayjs(date).format('D')}
                              </span>
                           </th>
                           )
                        })}
                     </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-100 font-sans">
                     {initialTeachers.map(teacher => (
                        <tr key={teacher.id} className="hover:bg-zinc-50 dark:bg-zinc-950/30 transition-colors">
                           <td className="p-3 border-r border-zinc-100 dark:border-zinc-800/50 font-bold text-zinc-800 sticky left-0 bg-white dark:bg-zinc-900 z-10 truncate max-w-[140px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                              <div className="flex flex-col gap-1">
                                 <span className="truncate">{teacher.name}</span>
                                 <button 
                                    onClick={() => handleExportSingleTeacherPDF(teacher)}
                                    className="flex items-center gap-1 text-[8px] text-violet-500 hover:text-violet-700 font-bold uppercase tracking-tight w-fit px-1 py-0.5 rounded bg-violet-50"
                                 >
                                    <Download size={8} /> PDF
                                 </button>
                              </div>
                           </td>
                           {dates.map(date => {
                           const record = monthlyAttendance.find(a => a.teacher_id === teacher.id && a.date === date)
                           const isTod = date === dayjs().format('YYYY-MM-DD')
                           const isSun = dayjs(date).day() === 0
                           const dt = getDayType(date, holidays)
                           const isFuture = dayjs(date).isAfter(dayjs(), 'day')
                           return (
                              <td 
                                 key={date} 
                                 className={`p-2 border-r border-zinc-100 dark:border-zinc-800/50 text-center transition-colors
                                 ${isTod ? 'bg-violet-50/30' : ''} 
                                 ${isSun ? 'bg-red-50/20' : ''}
                                 ${dt.type === 'holiday' ? 'bg-purple-50/30' : ''}
                                 `}
                              >
                                 {record ? (
                                   record.status === 'late' ? (
                                     <span className="w-5 h-5 flex items-center justify-center mx-auto bg-amber-500 text-white rounded-md font-bold text-[8px] shadow-sm" title="Late">L</span>
                                   ) : record.status === 'half_day' ? (
                                     <span className="w-5 h-5 flex items-center justify-center mx-auto bg-violet-500 text-white rounded-md font-bold text-[8px] shadow-sm" title="Half Day">H</span>
                                   ) : record.status === 'on_leave' ? (
                                     <span className="w-5 h-5 flex items-center justify-center mx-auto bg-blue-500 text-white rounded-md font-bold text-[8px] shadow-sm" title="Leave">LV</span>
                                   ) : record.status === 'absent' ? (
                                     <span className="w-5 h-5 flex items-center justify-center mx-auto bg-red-500 text-white rounded-md font-bold text-[8px] shadow-sm" title="Absent">A</span>
                                   ) : (
                                     <span className="w-5 h-5 flex items-center justify-center mx-auto bg-green-500 text-white rounded-md font-bold text-[8px] shadow-sm" title="Present">P</span>
                                   )
                                 ) : (
                                 isFuture ? (
                                    <span className="text-zinc-200">·</span>
                                 ) : dt.type === 'holiday' ? (
                                    <span className="w-5 h-5 flex items-center justify-center mx-auto bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-md font-bold text-[8px] shadow-xs" title={`Holiday: ${dt.title}`}>H</span>
                                 ) : isSun ? (
                                    <span className="text-red-200 font-bold">SUN</span>
                                 ) : isTod && !isPast3PM ? (
                                    <span className="w-5 h-5 flex items-center justify-center mx-auto bg-amber-100 text-amber-700 rounded-md font-bold text-[8px]" title="Pending">PND</span>
                                 ) : (
                                    <span className="text-red-400 font-bold opacity-60">A</span>
                                 )
                                 )}
                              </td>
                           )
                           })}
                        </tr>
                     ))}
                     </tbody>
                  </table>
               </div>
               </CardContent>
            </Card>
         </>
      ) : activeTab === 'leaves' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {pendingLeaves.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 font-bold">No pending leave requests</p>
               </div>
            ) : (
               pendingLeaves.map(leave => (
                  <Card key={leave.id} className="border-zinc-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all rounded-[32px] overflow-hidden">
                     <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                              <Users size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100">{leave.teachers?.name || 'Unknown'}</p>
                              <p className="text-xs text-zinc-400 font-medium">{leave.teachers?.subject || 'N/A'}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl">
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                              <Badge className={cn(
                                 "border-none text-[10px] font-bold uppercase",
                                 leave.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                 leave.status === 'approved' ? "bg-green-100 text-green-700" :
                                 "bg-red-100 text-red-700"
                              )}>
                                 {leave.status}
                              </Badge>
                           </div>
                           <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl">
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Duration</p>
                              <p className="text-[10px] font-bold text-zinc-800">
                                 {dayjs(leave.start_date).format('DD MMM')} - {dayjs(leave.end_date).format('DD MMM')}
                              </p>
                           </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl">
                           <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Reason</p>
                           <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium line-clamp-2">{leave.reason || 'No reason provided'}</p>
                        </div>

                        {leave.status === 'pending' ? (
                           <div className="flex gap-3 pt-2">
                              <button 
                                 onClick={() => handleLeaveAction(leave.id, 'rejected')}
                                 disabled={loading}
                                 className="flex-1 h-11 rounded-xl border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                 Reject
                              </button>
                              <button 
                                 onClick={() => handleLeaveAction(leave.id, 'approved')}
                                 disabled={loading}
                                 className="flex-1 h-11 rounded-xl bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:opacity-50"
                              >
                                 Approve
                              </button>
                           </div>
                        ) : (
                           <div className={cn(
                                 "w-full py-3 rounded-xl text-center text-[10px] font-black uppercase tracking-[0.2em]",
                               leave.status === 'approved' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                            )}>
                               Action Taken: {leave.status}
                            </div>
                         )}
                      </CardContent>
                   </Card>
                ))
             )}
          </div>
      ) : activeTab === 'holidays' ? (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
               <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                     <PartyPopper size={18} className="text-purple-600" />
                     School Holidays & Calendar
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                     Manage school holidays, vacations & festivals (e.g. Eid, Diwali, Rain holidays). Holidays are highlighted across student and staff records.
                  </p>
               </div>
               <button 
                  onClick={() => setShowHolidayModal(true)}
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm shrink-0"
               >
                  <Plus size={16} />
                  Add Holiday
               </button>
            </div>

            {/* Holidays List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {allDisplayHolidays.map((holiday, idx) => {
                  const hDate = dayjs(holiday.date)
                  const isCurrentMonth = hDate.year() === selectedYear && hDate.month() + 1 === selectedMonth
                  const isTod = holiday.date === dayjs().format('YYYY-MM-DD')

                  return (
                     <Card key={`${holiday.date}-${idx}`} className={cn(
                        "border shadow-sm rounded-2xl transition-all",
                        isTod ? "border-purple-300 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20" :
                        isCurrentMonth ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" :
                        "border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/30 opacity-80"
                     )}>
                        <CardContent className="p-4 flex items-start justify-between gap-3">
                           <div className="flex items-start gap-3">
                              <div className={cn(
                                 "w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 border",
                                 holiday.isCustom 
                                    ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300"
                                    : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                              )}>
                                 <span className="text-[9px] uppercase leading-none">{hDate.format('MMM')}</span>
                                 <span className="text-sm font-black leading-tight mt-0.5">{hDate.format('DD')}</span>
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                       {holiday.title}
                                    </h3>
                                    {isTod && (
                                       <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-purple-600 text-white">
                                          Today
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                                    {hDate.format('dddd, DD MMMM YYYY')}
                                 </p>
                                 <div className="flex items-center gap-2 mt-2">
                                    {holiday.isCustom ? (
                                       <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                                          School Declared
                                       </span>
                                    ) : (
                                       <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                          Gazetted Festival
                                       </span>
                                    )}
                                    {holiday.description && (
                                       <span className="text-[10px] text-zinc-500 italic truncate max-w-[150px]">
                                          "{holiday.description}"
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>
                           {holiday.isCustom && holiday.id && (
                              <button 
                                 onClick={() => handleDeleteHoliday(holiday.id!)}
                                 className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                                 title="Delete custom holiday"
                              >
                                 <Trash2 size={14} />
                              </button>
                           )}
                        </CardContent>
                     </Card>
                  )
               })}
            </div>
         </div>
      ) : null}

      {/* Add Teacher Modal */}
      {showAddModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] font-sans">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="absolute inset-0 p-4" style={{ overflowY: 'scroll' }}>
            <div className="flex min-h-full items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 font-sans relative z-10">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 font-sans rounded-t-2xl">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans">Add New Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4 font-sans">
              <div className="space-y-1.5 font-sans">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Full Name</Label>
                <Input required placeholder="e.g. Rahul Sharma" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
              </div>
              <div className="space-y-1.5 font-sans">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Subject / Role</Label>
                <Input required placeholder="e.g. Mathematics" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
              </div>
              <div className="grid grid-cols-2 gap-4 font-sans">
                <div className="space-y-1.5 font-sans">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Salary (₹)</Label>
                  <Input required type="number" placeholder="20000" value={newTeacher.salary} onChange={e => setNewTeacher({ ...newTeacher, salary: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
                </div>
                <div className="space-y-1.5 font-sans">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Email</Label>
                  <Input required type="email" placeholder="rahul@example.com" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
                </div>
              </div>
              <div className="space-y-1.5 font-sans">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Mobile Number</Label>
                <Input type="tel" placeholder="e.g. 9876543210" value={newTeacher.mobile} onChange={e => setNewTeacher({ ...newTeacher, mobile: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
              </div>
              <div className="space-y-1.5 font-sans">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Address</Label>
                <Input placeholder="e.g. 123 Main Street, City" value={newTeacher.address} onChange={e => setNewTeacher({ ...newTeacher, address: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
              </div>

              <div className="flex gap-3 pt-4 font-sans">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:bg-zinc-950 transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition disabled:opacity-50 shadow-lg shadow-violet-100">
                  {loading ? <Loader2 className="animate-spin mx-auto font-sans" size={20} /> : 'Save & Invite'}
                </button>
              </div>
            </form>
          </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit/Manage Teacher Modal */}
      {showEditModal && editingTeacher && mounted && createPortal(
        <div className="fixed inset-0 z-[100] font-sans">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} />
          <div className="absolute inset-0 p-4" style={{ overflowY: 'scroll' }}>
            <div className="flex min-h-full items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 font-sans relative z-10">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 font-sans rounded-t-2xl">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-sans">Manage Staff Member</h2>
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{editingTeacher.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{editingTeacher.subject}</p>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Onboarding Invite Link</Label>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 ring-1 ring-amber-200/20">
                    <p className="text-[10px] md:text-xs font-mono text-amber-700 flex-1 break-all line-clamp-1 opacity-80">
                      {typeof window !== 'undefined' ? `${window.location.origin}/teacher-signup?email=${encodeURIComponent(editingTeacher.email)}&teacher_id=${editingTeacher.id}` : '...'}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopyInvite(editingTeacher.id, editingTeacher.email); }}
                      className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors shadow-sm"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  {copiedId === editingTeacher.id && (
                    <p className="text-[10px] text-green-600 font-bold animate-in fade-in slide-in-from-top-1">Link copied to clipboard! 📋</p>
                  )}
               </div>

               <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

               <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Manual Attendance Override ({dayjs(selectedDate).format('DD MMM')})</Label>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => handleUpdateAttendance('present')}
                        disabled={loading}
                        className="h-10 rounded-xl border border-green-100 text-green-600 text-[10px] font-bold uppercase tracking-widest hover:bg-green-50 transition-colors"
                     >
                        Mark Present
                     </button>
                     <button 
                        onClick={() => handleUpdateAttendance('absent')}
                        disabled={loading}
                        className="h-10 rounded-xl border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors"
                     >
                        Mark Absent
                     </button>
                     <button 
                        onClick={() => handleUpdateAttendance('late')}
                        disabled={loading}
                        className="h-10 rounded-xl border border-amber-100 text-amber-600 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-50 transition-colors"
                     >
                        Mark Late
                     </button>
                     <button 
                        onClick={() => handleUpdateAttendance('half_day')}
                        disabled={loading}
                        className="h-10 rounded-xl border border-violet-100 text-violet-600 text-[10px] font-bold uppercase tracking-widest hover:bg-violet-50 transition-colors"
                     >
                        Mark Half Day
                     </button>
                  </div>
               </div>

               <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

               <form onSubmit={handleEditTeacher} className="space-y-4 font-sans">
                <div className="space-y-1.5 font-sans">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Full Name</Label>
                  <Input required value={editingTeacher.name} onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
                </div>
                <div className="space-y-1.5 font-sans">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Subject / Role</Label>
                  <Input required value={editingTeacher.subject} onChange={e => setEditingTeacher({ ...editingTeacher, subject: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
                </div>
                <div className="grid grid-cols-2 gap-4 font-sans">
                  <div className="space-y-1.5 font-sans">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Salary (₹)</Label>
                    <Input required type="number" value={editingTeacher.monthly_salary} onChange={e => setEditingTeacher({ ...editingTeacher, monthly_salary: Number(e.target.value) })} className="h-11 rounded-xl font-bold font-sans" />
                  </div>
                  <div className="space-y-1.5 font-sans">
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Email</Label>
                    <Input required type="email" value={editingTeacher.email} onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })} className="h-11 rounded-xl font-bold font-sans" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 font-sans">
                  <button type="submit" disabled={loading} className="flex-[2] h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition shadow-lg shadow-violet-100 font-sans">
                    {loading ? <Loader2 className="animate-spin mx-auto font-sans" size={20} /> : 'Update Details'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteTeacher(editingTeacher.id)}
                    className="flex-1 h-12 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition flex items-center justify-center"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* Movement Tracking Modal */}
      {showMovementModal && trackingTeacher && mounted && createPortal(
        <div className="fixed inset-0 z-[150] font-sans animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMovementModal(false)} />
          <div className="absolute inset-0 p-4" style={{ overflowY: 'scroll' }}>
            <div className="flex min-h-full items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200 font-sans border border-zinc-100 dark:border-zinc-800/50 relative z-10">
            
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 rounded-t-[32px] shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-100">
                    <Users size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{trackingTeacher.name}</h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Staff Movement Log • {dayjs(selectedDate).format('DD MMM')}</p>
                 </div>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition-all active:scale-95">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
               
               {/* Stats Grid */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 relative group">
                     <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Outside Today</p>
                     <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {movementHistory.reduce((acc, m) => m.return_time ? acc + dayjs(m.return_time).diff(dayjs(m.exit_time), 'minute') : acc, 0)}
                        <span className="text-xs ml-1 font-bold text-zinc-400">MINS</span>
                     </p>
                  </div>
                  <div className={cn(
                    "p-5 rounded-3xl border relative transition-all",
                    movementHistory.some(m => !m.return_time) ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
                  )}>
                     <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mb-1",
                        movementHistory.some(m => !m.return_time) ? "text-amber-600" : "text-emerald-600"
                     )}>Current Status</p>
                     <p className={cn(
                        "text-sm font-bold tracking-tight",
                        movementHistory.some(m => !m.return_time) ? "text-amber-700" : "text-emerald-700"
                     )}>
                        {movementHistory.some(m => !m.return_time) ? 'Outside Bound' : 'At School'}
                     </p>
                  </div>
               </div>

               {/* Live Embedded Map - Always show */}
               {(() => {
                  const record = todayAttendance.find(a => a.id === trackingTeacher.attendanceId);
                  const hasLocation = record?.last_lat && record?.last_lng;
                  return (
                    <div className="w-full h-56 sm:h-64 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm relative group">
                      <LiveMap 
                        schoolLat={settings?.lat || 22.7196} 
                        schoolLng={settings?.lng || 75.8577} 
                        radius={settings?.radius || 200}
                        focusLat={hasLocation ? record.last_lat : undefined}
                        focusLng={hasLocation ? record.last_lng : undefined}
                        targetTeacherId={trackingTeacher.id}
                      />
                      {hasLocation && (
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps?q=${record.last_lat},${record.last_lng}`, '_blank')}
                          className="absolute bottom-3 right-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-2.5 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors z-10 flex items-center gap-2"
                        >
                          <Map size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Open</span>
                        </button>
                      )}
                      {!hasLocation && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Teacher location not shared yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
               })()}

               {/* Timeline History */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                     <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Movement Timeline</h3>
                     <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                        {movementHistory.length} Sessions
                     </div>
                  </div>

                  {movementHistory.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-200 shadow-sm"><RotateCcw size={20} /></div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">No movements recorded today</p>
                    </div>
                  ) : (
                    <div className="relative pl-4 space-y-4">
                      {/* Vertical Line */}
                      <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-zinc-100 dark:bg-zinc-800" />
                      
                      {movementHistory.map((move, idx) => (
                        <div key={move.id} className="relative group">
                          <div className={cn(
                            "absolute -left-[20px] top-4 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10",
                            move.return_time ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                          )} />
                          
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl p-4 shadow-sm group-hover:border-violet-100 transition-all">
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-3">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><LogOut size={16} /></div>
                                    <div>
                                       <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Left School</p>
                                       <p className="text-sm font-bold text-zinc-800">{dayjs(move.exit_time).format('hh:mm A')}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className={cn(
                                       "w-8 h-8 rounded-xl flex items-center justify-center",
                                       move.return_time ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 dark:bg-zinc-950 text-zinc-300"
                                    )}><Home size={16} /></div>
                                    <div>
                                       <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight">Returned</p>
                                       {move.return_time ? (
                                         <p className="text-sm font-bold text-zinc-800">{dayjs(move.return_time).format('hh:mm A')}</p>
                                       ) : (
                                         <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest italic">In Progress...</p>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => window.open(`https://www.google.com/maps?q=${move.exit_lat},${move.exit_lng}`, '_blank')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 hover:bg-violet-50 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 rounded-xl text-[10px] font-bold transition-all border border-transparent hover:border-violet-100"
                                >
                                  <MapPin size={12} /> Exit Loc
                                </button>
                                {move.return_lat && (
                                  <button 
                                    onClick={() => window.open(`https://www.google.com/maps?q=${move.return_lat},${move.return_lng}`, '_blank')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 hover:bg-emerald-50 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 rounded-xl text-[10px] font-bold transition-all border border-transparent hover:border-emerald-100"
                                  >
                                    <MapPin size={12} /> Entry Loc
                                  </button>
                                )}
                              </div>
                            </div>

                            {move.return_time && (
                              <div className="pt-3 border-t border-zinc-50 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Duration</p>
                                <p className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                                  {dayjs(move.return_time).diff(dayjs(move.exit_time), 'minute')} Mins
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800/50">
              <button onClick={() => setShowMovementModal(false)} className="w-full h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 transition-all active:scale-[0.98]">
                Close Movement Log
              </button>
            </div>
          </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Holiday Modal */}
      {showHolidayModal && mounted && createPortal(
         <div className="fixed inset-0 z-[100] font-sans">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHolidayModal(false)} />
           <div className="absolute inset-0 p-4" style={{ overflowY: 'scroll' }}>
             <div className="flex min-h-full items-center justify-center">
               <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 font-sans relative z-10">
                 <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 rounded-t-2xl">
                   <div className="flex items-center gap-2">
                     <PartyPopper size={18} className="text-purple-600" />
                     <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Add School Holiday</h2>
                   </div>
                   <button onClick={() => setShowHolidayModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition">
                     <X size={20} />
                   </button>
                 </div>
                 <form onSubmit={handleAddHoliday} className="p-6 space-y-4">
                   <div className="space-y-1.5">
                     <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Holiday Date</Label>
                     <CustomDateInput 
                       value={newHoliday.date} 
                       onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                       className="h-11 w-full rounded-xl font-bold border border-zinc-200 dark:border-zinc-800 px-3 bg-zinc-50 dark:bg-zinc-950 text-sm"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Holiday Name / Title</Label>
                     <Input 
                       required 
                       placeholder="e.g. Eid-ul-Fitr, Diwali Vacation, Rain Holiday"
                       value={newHoliday.title} 
                       onChange={e => setNewHoliday({ ...newHoliday, title: e.target.value })}
                       className="h-11 rounded-xl font-bold text-sm"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description / Note (Optional)</Label>
                     <Input 
                       placeholder="e.g. School will remain closed for students and staff"
                       value={newHoliday.description} 
                       onChange={e => setNewHoliday({ ...newHoliday, description: e.target.value })}
                       className="h-11 rounded-xl text-sm"
                     />
                   </div>
                   <div className="flex gap-3 pt-4">
                     <button 
                       type="button" 
                       onClick={() => setShowHolidayModal(false)}
                       className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition"
                     >
                       Cancel
                     </button>
                     <button 
                       type="submit" 
                       disabled={savingHoliday}
                       className="flex-1 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 shadow-md"
                     >
                       {savingHoliday ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Holiday'}
                     </button>
                   </div>
                 </form>
               </div>
             </div>
           </div>
         </div>,
         document.body
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
          <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}


