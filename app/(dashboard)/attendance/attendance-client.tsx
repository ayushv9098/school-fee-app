'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Users, Mail, Plus, Calendar, Download, MapPin, Camera, Copy, Check } from 'lucide-react'
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
  check_in: string
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
}

export default function AttendanceClient({ initialTeachers, todayAttendance, monthlyAttendance, adminEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    subject: '',
    salary: '',
    email: '',
  })

  const presentCount = todayAttendance.filter(a => a.status === 'present').length
  const absentCount = initialTeachers.length - presentCount

  async function handleCopyInvite(teacherId: string, email: string) {
    const origin = process.env.NEXT_PUBLIC_APP_URL
    
    if (!origin) {
      alert('Error: NEXT_PUBLIC_APP_URL is not set in Environment Variables. Please set it to your website URL (e.g. https://your-site.com) in Vercel settings.')
      return
    }

    const inviteLink = `${origin}/teacher-signup?email=${encodeURIComponent(email)}&teacher_id=${teacherId}`
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopiedId(teacherId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      alert('Failed to copy: ' + inviteLink)
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: teacher, error } = await supabase
      .from('teachers')
      .insert({
        user_id: user?.id,
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
      const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const manualLink = `${origin}/teacher-signup?email=${encodeURIComponent(newTeacher.email)}&teacher_id=${teacher.id}`
      
      const proceed = confirm(`Teacher added, but email failed (Resend requires domain verification).\n\nError: ${err.message}\n\nDo you want to copy the invite link manually to send via WhatsApp/Message?`)
      
      if (proceed) {
        await navigator.clipboard.writeText(manualLink)
        alert('Invite link copied to clipboard! 📋')
      }
    }

    setShowAddModal(false)
    setNewTeacher({ name: '', subject: '', salary: '', email: '' })
    setLoading(false)
    router.refresh()
  }

  // Monthly Table Data Preparation
  const daysInMonth = dayjs().daysInMonth()
  const dates = Array.from({ length: daysInMonth }, (_, i) => dayjs().date(i + 1).format('YYYY-MM-DD'))

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Teacher Attendance</h1>
          <p className="text-sm text-zinc-500">Track and manage staff presence</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-100 bg-green-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 font-medium">Present Today</p>
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <CheckCircle2 size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 font-medium">Absent Today</p>
              <p className="text-3xl font-bold text-red-600">{absentCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <XCircle size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-100 bg-violet-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500 font-medium">Total Teachers</p>
              <p className="text-3xl font-bold text-violet-600">{initialTeachers.length}</p>
            </div>
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center text-violet-600">
              <Users size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Teachers List */}
      <Card className="border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today's Attendance Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-y border-zinc-100">
                <tr>
                  <th className="text-left p-4 font-medium text-zinc-500">Teacher</th>
                  <th className="text-left p-4 font-medium text-zinc-500">Status</th>
                  <th className="text-left p-4 font-medium text-zinc-500">Check-in</th>
                  <th className="text-left p-4 font-medium text-zinc-500">Selfie</th>
                  <th className="text-right p-4 font-medium text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {initialTeachers.map(teacher => {
                  const record = todayAttendance.find(a => a.teacher_id === teacher.id)
                  const isRegistered = !!teacher.auth_user_id

                  return (
                    <tr key={teacher.id} className="hover:bg-zinc-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-900">{teacher.name}</p>
                          {!isRegistered && (
                            <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-medium">Pending Signup</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{teacher.subject}</p>
                      </td>
                      <td className="p-4">
                        {record?.status === 'present' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Present ✅</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Absent ❌</Badge>
                        )}
                      </td>
                      <td className="p-4 text-zinc-600">
                        {record?.check_in ? dayjs(record.check_in).format('hh:mm A') : '-'}
                      </td>
                      <td className="p-4">
                        {record?.selfie_url ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-200">
                            <img 
                              src={supabase.storage.from('attendance-selfies').getPublicUrl(record.selfie_url).data.publicUrl} 
                              alt="Selfie" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <Camera size={16} />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!isRegistered && (
                          <button
                            onClick={() => handleCopyInvite(teacher.id, teacher.email)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm border ${
                              copiedId === teacher.id 
                                ? 'bg-green-50 text-green-600 border-green-200' 
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                            }`}
                            title="Copy Invite Link"
                          >
                            {copiedId === teacher.id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedId === teacher.id ? 'Copied' : 'Invite Link'}
                          </button>
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
      <Card className="border-zinc-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Monthly Attendance Table</CardTitle>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-600 hover:bg-violet-50 border border-violet-100 transition">
            <Download size={14} />
            Export PDF
          </button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead className="bg-zinc-50 border-y border-zinc-100">
              <tr>
                <th className="text-left p-2 border-r border-zinc-100 sticky left-0 bg-zinc-50 z-10 min-w-[120px]">Teacher</th>
                {dates.map(date => (
                  <th key={date} className="p-2 border-r border-zinc-100 text-center min-w-[30px]">
                    {dayjs(date).format('D')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {initialTeachers.map(teacher => (
                <tr key={teacher.id}>
                  <td className="p-2 border-r border-zinc-100 font-medium text-zinc-900 sticky left-0 bg-white z-10">{teacher.name}</td>
                  {dates.map(date => {
                    const record = monthlyAttendance.find(a => a.teacher_id === teacher.id && a.date === date)
                    const isToday = date === dayjs().format('YYYY-MM-DD')
                    return (
                      <td key={date} className={`p-2 border-r border-zinc-100 text-center ${isToday ? 'bg-violet-50/50' : ''}`}>
                        {record ? (
                          <span className="text-green-600 font-bold">P</span>
                        ) : (
                          dayjs(date).isAfter(dayjs()) ? '' : <span className="text-red-300 font-bold">A</span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Add New Teacher</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newTeacher.name}
                  onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input 
                  required
                  placeholder="e.g. Mathematics"
                  value={newTeacher.subject}
                  onChange={e => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly Salary (₹)</Label>
                <Input 
                  required
                  type="number"
                  placeholder="20000"
                  value={newTeacher.salary}
                  onChange={e => setNewTeacher({ ...newTeacher, salary: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input 
                  required
                  type="email"
                  placeholder="rahul@example.com"
                  value={newTeacher.email}
                  onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                />
                <p className="text-[10px] text-zinc-400">An invite link will be sent to this email.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Adding...' : 'Add & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
