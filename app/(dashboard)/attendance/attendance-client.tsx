'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Users, Plus, Calendar, Download, Camera, Loader2, X, Pencil, Trash2, Copy, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import dayjs from 'dayjs'

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
  status: string
  selfie_url: string
  teachers?: {
    name: string
    subject: string
  }
}

interface Props {
  initialTeachers: Teacher[]
  todayAttendance: AttendanceRecord[]
  monthlyAttendance: AttendanceRecord[]
  adminEmail: string
  adminId: string
  selectedDate: string
  selectedMonth: number
  selectedYear: number
}

export default function AttendanceClient({ 
  initialTeachers, 
  todayAttendance, 
  monthlyAttendance, 
  adminEmail, 
  adminId,
  selectedDate,
  selectedMonth,
  selectedYear
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    subject: '',
    salary: '',
    email: '',
  })
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  const presentCount = todayAttendance.filter(a => a.status === 'present').length
  const absentCount = initialTeachers.length - presentCount

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
      
      alert('Teacher added and invitation sent successfully! ✅')
    } catch (err: any) {
      console.error('Failed to send invite email:', err)
      const origin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const manualLink = `${origin}/teacher-signup?email=${encodeURIComponent(newTeacher.email)}&teacher_id=${teacher.id}`
      
      const proceed = confirm(`Teacher added, but email failed.\n\nDo you want to copy the invite link manually?`)
      if (proceed) {
        await navigator.clipboard.writeText(manualLink)
        alert('Invite link copied! 📋')
      }
    }

    setShowAddModal(false)
    setNewTeacher({ name: '', subject: '', salary: '', email: '' })
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

  const daysInMonth = dayjs().year(selectedYear).month(selectedMonth - 1).daysInMonth()
  const dates = Array.from({ length: daysInMonth }, (_, i) => dayjs().year(selectedYear).month(selectedMonth - 1).date(i + 1).format('YYYY-MM-DD'))

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const YEARS = Array.from({ length: 5 }, (_, i) => dayjs().year() - i)

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">Teacher Attendance</h1>
          <p className="text-sm text-zinc-500 mt-0.5 font-medium">Control and track staff records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm md:text-base font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          Add Teacher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Present Today', value: presentCount, icon: CheckCircle2, color: 'green' },
          { label: 'Absent Today', value: absentCount, icon: XCircle, color: 'red' },
          { label: 'Total Staff', value: initialTeachers.length, icon: Users, color: 'violet' }
        ].map(stat => (
          <Card key={stat.label} className={`border-${stat.color}-100 bg-${stat.color}-50/50 hover:shadow-md transition`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-bold text-${stat.color}-700/60 uppercase tracking-wider`}>{stat.label}</span>
                <div className={`w-9 h-9 bg-${stat.color}-100 rounded-xl flex items-center justify-center text-${stat.color}-600 shadow-sm border border-${stat.color}-200/50`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className={`text-3xl font-bold text-${stat.color}-600 tracking-tight`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Status Card */}
      <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden font-sans">
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2 font-sans text-[11px] md:text-sm">
             <Calendar size={16} className="text-violet-600 font-sans" /> Status: {dayjs(selectedDate).format('dddd, DD MMM YYYY')}
          </CardTitle>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm self-start md:self-auto">
            <Calendar size={14} className="text-zinc-400 ml-2" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs font-bold text-zinc-700 focus:outline-none pr-2 bg-transparent h-7"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden font-sans">
          <table className="w-full table-fixed md:table-auto border-collapse">
            <thead className="bg-zinc-50/30 font-sans">
              <tr className="border-b border-zinc-100 font-sans">
                <th className="text-left p-3 pl-4 font-bold text-zinc-400 uppercase text-[9px] md:text-xs w-[40%] md:w-auto">Staff</th>
                <th className="text-center p-2 font-bold text-zinc-400 uppercase text-[9px] md:text-xs w-[12%] md:w-auto">St</th>
                <th className="text-center p-2 font-bold text-zinc-400 uppercase text-[9px] md:text-xs w-[25%] md:w-auto">Time</th>
                <th className="text-center p-2 font-bold text-zinc-400 uppercase text-[9px] md:text-xs w-[15%] md:w-auto">Img</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialTeachers.map(teacher => {
                const record = todayAttendance.find(a => a.teacher_id === teacher.id)
                return (
                  <tr 
                    key={teacher.id} 
                    onClick={() => { setEditingTeacher(teacher); setShowEditModal(true); }}
                    className="hover:bg-zinc-50/50 transition-colors h-14 md:h-16 cursor-pointer"
                  >
                    <td className="p-3 pl-4 overflow-hidden align-middle">
                      <p className="font-bold text-zinc-900 text-[11px] md:text-sm truncate leading-tight w-full">{teacher.name}</p>
                      <p className="text-[9px] md:text-xs text-zinc-400 truncate leading-tight w-full font-medium mt-0.5">{teacher.subject}</p>
                    </td>
                    <td className="p-1 text-center align-middle">
                      <div className="flex justify-center">
                        {record?.status === 'present' ? (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center ring-1 ring-green-200 shadow-sm">
                             <span className="text-[10px] md:text-xs font-bold font-sans">P</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto ring-1 ring-red-100 shadow-sm">
                             <span className="text-[10px] md:text-xs font-bold font-sans">A</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-1 text-center text-zinc-600 font-bold text-[10px] md:text-sm font-sans align-middle">
                      {record?.check_in_time ? dayjs(record.check_in_time).format('hh:mm A') : '--:--'}
                    </td>
                    <td className="p-1 text-center align-middle">
                      <div className="flex justify-center">
                        {record?.selfie_url ? (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = supabase.storage.from('attendance-selfies').getPublicUrl(record.selfie_url).data.publicUrl;
                              setSelectedImage(url);
                            }}
                            className="w-9 h-9 md:w-11 md:h-11 rounded-lg overflow-hidden border border-zinc-200 shadow-sm ring-2 ring-white cursor-zoom-in"
                          >
                            <img 
                              src={supabase.storage.from('attendance-selfies').getPublicUrl(record.selfie_url).data.publicUrl} 
                              alt="S" className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-200 border border-zinc-100">
                            <Camera size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

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

      {/* Monthly Register Card */}
      <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden mb-10 font-sans">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50 gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 shadow-sm">
                <Calendar size={18} />
              </div>
              <h2 className="text-sm md:text-base font-bold text-zinc-800 tracking-tight whitespace-nowrap">
                {dayjs().year(selectedYear).month(selectedMonth - 1).format('MMMM YYYY')} Register
              </h2>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-500 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="h-4 w-px bg-zinc-100 mx-1" />
              
              <select 
                value={selectedMonth}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="text-xs font-bold text-zinc-600 bg-transparent px-1 focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              
              <select 
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="text-xs font-bold text-zinc-600 bg-transparent px-1 focus:outline-none cursor-pointer"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <div className="h-4 w-px bg-zinc-100 mx-1" />

              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-500 transition-colors"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleGoToToday}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:bg-white hover:text-violet-600 border border-transparent hover:border-zinc-200 transition-all shadow-none hover:shadow-sm"
            >
              <RotateCcw size={14} /> Today
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-600 hover:bg-violet-50 border border-violet-100 transition-colors">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto scrollbar-hide font-sans relative">
          <div key={`${selectedMonth}-${selectedYear}`} className="animate-in fade-in slide-in-from-right-1 duration-500">
            <table className="w-full text-[10px] border-collapse min-w-[800px] table-fixed font-sans">
              <thead className="bg-zinc-50/30 font-sans sticky top-0 z-20">
                <tr className="border-b border-zinc-100">
                  <th className="text-left p-3 border-r border-zinc-100 sticky left-0 bg-zinc-50 z-30 font-bold text-zinc-400 uppercase tracking-tighter w-[120px] align-middle">
                    Teacher
                  </th>
                  {dates.map(date => {
                    const isSunday = dayjs(date).day() === 0
                    const isToday = date === dayjs().format('YYYY-MM-DD')
                    return (
                      <th 
                        key={date} 
                        className={`p-1.5 border-r border-zinc-100 text-center font-bold min-w-[36px] w-[36px] transition-colors
                          ${isSunday ? 'bg-red-50/50 text-red-400' : 'text-zinc-400'}
                          ${isToday ? 'bg-violet-50 text-violet-600 ring-inset ring-1 ring-violet-100' : ''}
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
                  <tr key={teacher.id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="p-3 border-r border-zinc-100 font-bold text-zinc-800 sticky left-0 bg-white z-10 truncate max-w-[120px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {teacher.name}
                    </td>
                    {dates.map(date => {
                      const record = monthlyAttendance.find(a => a.teacher_id === teacher.id && a.date === date)
                      const isToday = date === dayjs().format('YYYY-MM-DD')
                      const isSunday = dayjs(date).day() === 0
                      const isFuture = dayjs(date).isAfter(dayjs(), 'day')
                      return (
                        <td 
                          key={date} 
                          className={`p-2 border-r border-zinc-100 text-center transition-colors
                            ${isToday ? 'bg-violet-50/30' : ''} 
                            ${isSunday ? 'bg-red-50/20' : ''}
                          `}
                        >
                          {record ? (
                            <span className="w-5 h-5 flex items-center justify-center mx-auto bg-green-500 text-white rounded-md font-bold text-[8px] shadow-sm">P</span>
                          ) : (
                            isFuture ? (
                              <span className="text-zinc-200">·</span>
                            ) : isSunday ? (
                               <span className="text-red-200 font-bold">H</span>
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

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden font-sans">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 font-sans">
              <h2 className="text-base font-bold text-zinc-900 font-sans">Add New Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 transition">
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

              <div className="flex gap-3 pt-4 font-sans">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition disabled:opacity-50 shadow-lg shadow-violet-100">
                  {loading ? <Loader2 className="animate-spin mx-auto font-sans" size={20} /> : 'Save & Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Manage Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden font-sans">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 font-sans">
              <h2 className="text-base font-bold text-zinc-900 font-sans">Manage Staff Member</h2>
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="text-zinc-400 hover:text-zinc-600 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{editingTeacher.name}</h3>
                    <p className="text-sm text-zinc-500 font-medium">{editingTeacher.subject}</p>
                  </div>
                  {!editingTeacher.auth_user_id && (
                    <button
                      onClick={() => handleCopyInvite(editingTeacher.id, editingTeacher.email)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition border border-amber-200"
                    >
                      <Copy size={14} />
                      {copiedId === editingTeacher.id ? 'Copied Link' : 'Copy Invite'}
                    </button>
                  )}
               </div>

               <div className="h-px bg-zinc-100" />

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
      )}
    </div>
  )
}
