'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/calculations'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import { Plus, User, Pencil, Trash2, Search, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_MONTHS = [
  'April', 'May', 'June', 'July', 'August', 'September', 
  'October', 'November', 'December', 'January', 'February', 'March'
]

const getGradientByName = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'from-violet-500 to-fuchsia-500 dark:from-violet-600 dark:to-fuchsia-600',
    'from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600',
    'from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600',
    'from-rose-500 to-pink-500 dark:from-rose-600 dark:to-pink-600',
    'from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600',
  ];
  return gradients[hash % gradients.length];
}

interface Teacher {
  id: string
  name: string
  subject: string
  monthly_salary: number
  email?: string
  mobile?: string
  address?: string
}

interface TeacherPayment {
  id: string
  teacher_id: string
  amount: number
  month: number
  year: number
}

export default function StaffClient({ initialTeachers, initialTeacherPayments, onRefresh }: { initialTeachers: Teacher[], initialTeacherPayments: TeacherPayment[], onRefresh?: () => void }) {
  const { academicYear } = useSession()
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // Modal for add/edit
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>({})
  const [mounted, setMounted] = useState(false)
  const [teachersData, setTeachersData] = useState<Record<string, { months: string[], customSalaries: Record<string, number> }>>({})

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const data: Record<string, any> = {}
      initialTeachers.forEach(t => {
        let months = DEFAULT_MONTHS
        const savedMonths = localStorage.getItem(`teacher_months_${t.id}`)
        if (savedMonths) {
          try {
            months = JSON.parse(savedMonths)
          } catch(e) {}
        }
        
        let customSalaries: Record<string, number> = {}
        const savedSalaries = localStorage.getItem(`teacher_custom_salaries_${t.id}`)
        if (savedSalaries) {
          try {
            customSalaries = JSON.parse(savedSalaries)
          } catch(e) {}
        }
        data[t.id] = { months, customSalaries }
      })
      setTeachersData(data)
    }
  }, [initialTeachers])

  const filteredTeachers = initialTeachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  )

  async function handleTeacherAction(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    let res;
    if (activeModal === 'add-teacher') {
      if (!modalData.email || !modalData.password) {
        alert('Email and Password are required to create a Teacher login.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          name: modalData.name,
          subject: modalData.subject,
          email: modalData.email,
          password: modalData.password,
          mobile: modalData.mobile || null,
          address: modalData.address || null,
          monthly_salary: Number(modalData.salary),
          shift_start_time: modalData.shift_start_time || null,
          shift_end_time: modalData.shift_end_time || null,
          academic_year: academicYear
        })
      })

      const data = await response.json()
      if (!response.ok) {
        res = { error: { message: data.error } }
      } else {
        res = { error: null }
      }
    } else if (activeModal === 'edit-teacher') {
      res = await supabase.from('teachers').update({
        name: modalData.name,
        subject: modalData.subject,
        email: modalData.email || null,
        mobile: modalData.mobile || null,
        address: modalData.address || null,
        monthly_salary: Number(modalData.salary),
        shift_start_time: modalData.shift_start_time || null,
        shift_end_time: modalData.shift_end_time || null
      }).eq('id', modalData.id)
    }

    if (res?.error) {
      alert(res.error.message)
    } else {
      setActiveModal(null)
      onRefresh?.()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteTeacher(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Are you sure? All related salary payments will also be deleted.')) return
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) alert(error.message)
    else {
      onRefresh?.()
      router.refresh()
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-600" />
            Staff & Teachers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage staff salaries and records</p>
        </div>
        <button 
          onClick={() => {
            setActiveModal('add-teacher')
            setModalData({ name: '', subject: '', mobile: '', email: '', password: '', address: '', salary: '', shift_start_time: '', shift_end_time: '' })
          }}
          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap"
        >
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          placeholder="Search staff by name or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-9 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.map(teacher => {
          const totalPaid = initialTeacherPayments
            .filter(p => p.teacher_id === teacher.id)
            .reduce((a, p) => a + Number(p.amount), 0)

          const monthsData = teachersData[teacher.id]
          const months = monthsData ? monthsData.months : DEFAULT_MONTHS
          const customSalaries = monthsData ? monthsData.customSalaries : {}
          
          const expectedTotal = months.reduce((acc, monthName) => acc + (customSalaries[monthName] ?? teacher.monthly_salary), 0)
          const remainingDue = Math.max(0, expectedTotal - totalPaid)
          const progress = expectedTotal > 0 ? Math.min(100, Math.round((totalPaid / expectedTotal) * 100)) : 0

          let statusText = 'UNPAID'
          let statusVariant: any = 'unpaid'
          if (remainingDue <= 0) {
            statusText = 'PAID'
            statusVariant = 'paid'
          } else if (totalPaid > 0) {
            statusText = 'PARTIAL'
            statusVariant = 'partial'
          }

          const getProgressColor = (val: number) => {
            if (val >= 100) return 'bg-emerald-500'
            if (val <= 0) return 'bg-rose-500'
            if (val < 50) return 'bg-amber-500'
            return 'bg-violet-500'
          }

          return (
            <Link key={teacher.id} href={`/staff/${teacher.id}`}>
              <Card className="group relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 dark:hover:border-violet-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-2xl shadow-sm">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradientByName(teacher.name)} flex items-center justify-center text-white shadow-sm`}>
                          <User size={18} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 transition-colors">
                            {teacher.name}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            {teacher.subject}
                          </p>
                        </div>
                      </div>
                      
                      <Badge variant={statusVariant}>
                        {statusText}
                      </Badge>
                    </div>

                    {/* Progress indicator */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <span>Payment Status</span>
                        <span>{progress}% Paid</span>
                      </div>
                      <Progress value={progress} indicatorClassName={getProgressColor(progress)} />
                    </div>

                    {/* Salary stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-100/50 dark:border-zinc-800/20 text-center">
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Expected</p>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{formatCurrency(expectedTotal)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Paid</p>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-0.5">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Remaining</p>
                        <p className={`text-xs font-bold mt-0.5 ${remainingDue > 0 ? 'text-red-500 dark:text-red-400' : 'text-zinc-400'}`}>
                          {formatCurrency(remainingDue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Manage Details & Payments
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                    {teacher.mobile && (
                      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                        📞 {teacher.mobile}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Modals */}
      {activeModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50 shrink-0">
              <h2 className="text-lg font-bold">{activeModal === 'add-teacher' ? 'Add Staff' : 'Edit Staff'}</h2>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTeacherAction} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input required value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role / Subject</label>
                <input required value={modalData.subject} onChange={e => setModalData({...modalData, subject: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mobile Number</label>
                <input type="tel" value={modalData.mobile || ''} onChange={e => setModalData({...modalData, mobile: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Login Email</label>
                <input required={activeModal === 'add-teacher'} type="email" value={modalData.email || ''} onChange={e => setModalData({...modalData, email: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              {activeModal === 'add-teacher' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Login Password</label>
                  <input required type="text" value={modalData.password || ''} onChange={e => setModalData({...modalData, password: e.target.value})} placeholder="e.g. teacher@123" className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <input type="text" value={modalData.address || ''} onChange={e => setModalData({...modalData, address: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Monthly Salary (₹)</label>
                <input required type="number" value={modalData.salary} onChange={e => setModalData({...modalData, salary: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">In-Time (Optional)</label>
                  <input type="time" value={modalData.shift_start_time || ''} onChange={e => setModalData({...modalData, shift_start_time: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Out-Time (Optional)</label>
                  <input type="time" value={modalData.shift_end_time || ''} onChange={e => setModalData({...modalData, shift_end_time: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
