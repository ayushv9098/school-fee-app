'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Users, Plus, Calendar, Download, MapPin, Camera, Copy, Check, Pencil, Trash2, MoreVertical, ExternalLink, Loader2, X } from 'lucide-react'
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
}

export default function AttendanceClient({ initialTeachers, todayAttendance, monthlyAttendance, adminEmail, adminId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
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

  // Close menu on click outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

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
    else router.refresh()
    setLoading(false)
  }

  const daysInMonth = dayjs().daysInMonth()
  const dates = Array.from({ length: daysInMonth }, (_, i) => dayjs().date(i + 1).format('YYYY-MM-DD'))

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 leading-tight">Teacher Attendance</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Control and track staff records</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Present Today', value: presentCount, icon: CheckCircle2, color: 'emerald' },
          { label: 'Absent Today', value: absentCount, icon: XCircle, color: 'red' },
          { label: 'Total Staff', value: initialTeachers.length, icon: Users, color: 'violet' }
        ].map(stat => (
          <Card key={stat.label} className={`border-${stat.color}-100 bg-${stat.color}-50/30`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-3xl font-black text-${stat.color}-600 tracking-tighter mt-1`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-2xl flex items-center justify-center text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-4">
          <CardTitle className="text-sm font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
             <Calendar size={16} className="text-violet-600" /> Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50/30">
                <tr className="border-b border-zinc-100">
                  <th className="text-left p-4 font-bold text-zinc-400 uppercase text-[10px]">Staff Member</th>
                  <th className="text-left p-4 font-bold text-zinc-400 uppercase text-[10px]">Status</th>
                  <th className="text-left p-4 font-bold text-zinc-400 uppercase text-[10px]">Check-in</th>
                  <th className="text-left p-4 font-bold text-zinc-400 uppercase text-[10px]">Selfie</th>
                  <th className="text-right p-4 font-bold text-zinc-400 uppercase text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {initialTeachers.map(teacher => {
                  const record = todayAttendance.find(a => a.teacher_id === teacher.id)
                  const isRegistered = !!teacher.auth_user_id
                  return (
                    <tr key={teacher.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-zinc-900">{teacher.name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium">{teacher.subject}</p>
                      </td>
                      <td className="p-4">
                        {record?.status === 'present' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-tight">
                             <Check size={12} strokeWidth={3} /> Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-tight">
                             <X size={12} strokeWidth={3} /> Absent
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-600 font-mono font-bold text-xs">
                        {record?.check_in_time ? dayjs(record.check_in_time).format('hh:mm A') : '--:--'}
                      </td>
                      <td className="p-4">
                        {record?.selfie_url ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200 shadow-sm ring-2 ring-white">
                            <img 
                              src={supabase.storage.from('attendance-selfies').getPublicUrl(record.selfie_url).data.publicUrl} 
                              alt="Selfie" className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-300">
                            <Camera size={16} />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === teacher.id ? null : teacher.id); }}
                          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openMenuId === teacher.id && (
                          <div className="absolute right-4 top-12 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200 text-left">
                            {!isRegistered && (
                              <button
                                onClick={() => handleCopyInvite(teacher.id, teacher.email)}
                                className="w-full px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                              >
                                <Copy size={14} /> {copiedId === teacher.id ? 'Copied Link' : 'Copy Invite Link'}
                              </button>
                            )}
                            <button
                              onClick={() => { setEditingTeacher(teacher); setShowEditModal(true); }}
                              className="w-full px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                            >
                              <Pencil size={14} /> Edit Details
                            </button>
                            <div className="h-px bg-zinc-100 my-1" />
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete Staff
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Grid */}
      <Card className="border-zinc-200 shadow-sm rounded-2xl overflow-hidden mb-10">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
          <CardTitle className="text-sm font-bold text-zinc-700 uppercase tracking-widest">Monthly Register</CardTitle>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-600 hover:bg-violet-50 border border-violet-100 transition-colors">
            <Download size={14} /> Export PDF
          </button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto scrollbar-hide">
          <table className="w-full text-[10px] border-collapse min-w-[800px]">
            <thead className="bg-zinc-50/30">
              <tr>
                <th className="text-left p-3 border-r border-zinc-100 sticky left-0 bg-zinc-50 z-10 font-bold text-zinc-400 uppercase tracking-tighter">Teacher</th>
                {dates.map(date => (
                  <th key={date} className="p-2 border-r border-zinc-100 text-center font-bold text-zinc-400 min-w-[32px]">
                    {dayjs(date).format('D')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialTeachers.map(teacher => (
                <tr key={teacher.id}>
                  <td className="p-3 border-r border-zinc-100 font-bold text-zinc-800 sticky left-0 bg-white z-10 truncate max-w-[120px]">{teacher.name}</td>
                  {dates.map(date => {
                    const record = monthlyAttendance.find(a => a.teacher_id === teacher.id && a.date === date)
                    const isToday = date === dayjs().format('YYYY-MM-DD')
                    const isFuture = dayjs(date).isAfter(dayjs(), 'day')
                    return (
                      <td key={date} className={`p-2 border-r border-zinc-100 text-center ${isToday ? 'bg-violet-50' : ''}`}>
                        {record ? (
                          <span className="w-5 h-5 flex items-center justify-center mx-auto bg-green-500 text-white rounded-md font-bold text-[8px]">P</span>
                        ) : (
                          isFuture ? <span className="text-zinc-200">·</span> : <span className="text-red-300 font-bold">A</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900">Add New Staff Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Full Name</Label>
                <Input required placeholder="e.g. Rahul Sharma" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Subject / Role</Label>
                <Input required placeholder="e.g. Mathematics" value={newTeacher.subject} onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Salary (₹)</Label>
                  <Input required type="number" placeholder="20000" value={newTeacher.salary} onChange={e => setNewTeacher({ ...newTeacher, salary: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email</Label>
                  <Input required type="email" placeholder="rahul@example.com" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition disabled:opacity-50 shadow-lg shadow-violet-100">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Save & Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-base font-bold text-zinc-900">Edit Staff Details</h2>
              <button onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="text-zinc-400 hover:text-zinc-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleEditTeacher} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Full Name</Label>
                <Input required value={editingTeacher.name} onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Subject / Role</Label>
                <Input required value={editingTeacher.subject} onChange={e => setEditingTeacher({ ...editingTeacher, subject: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Salary (₹)</Label>
                  <Input required type="number" value={editingTeacher.monthly_salary} onChange={e => setEditingTeacher({ ...editingTeacher, monthly_salary: Number(e.target.value) })} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email</Label>
                  <Input required type="email" value={editingTeacher.email} onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingTeacher(null); }} className="flex-1 h-12 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition shadow-lg shadow-violet-100">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
