'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/calculations'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Printer, Plus, Trash2, Eye, Download, MessageCircle, X, Loader2, Pencil, FileText, MoreVertical } from 'lucide-react'
import { useSession } from '@/lib/session-context'
import StaffReceiptPDF from '@/components/staff-receipt-pdf'
import { Progress } from '@/components/ui/progress'



export default function StaffDetailClient({ teacher, schoolName, initialPayments, onRefresh }: { teacher: any, schoolName: string, initialPayments: any[], onRefresh?: () => void }) {
  const router = useRouter()
  const now = new Date()
  const currentYear = now.getFullYear()
  const isAfterMarch = now.getMonth() >= 3
  const tStartYear = isAfterMarch ? currentYear : currentYear - 1
  const teacherAcademicYear = `${tStartYear}-${(tStartYear + 1).toString().slice(-2)}`
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' })
  const supabase = createClient()
  const [payments, setPayments] = useState(initialPayments)
  const [loading, setLoading] = useState(false)
  
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [selectedMonthView, setSelectedMonthView] = useState<any>(null)
  const [modalData, setModalData] = useState<any>({})
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const DEFAULT_MONTHS = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ]
  const [monthsList, setMonthsList] = useState<string[]>(DEFAULT_MONTHS)

  const [customSalaries, setCustomSalaries] = useState<Record<string, number>>({})
  const [attendanceData, setAttendanceData] = useState<any[]>([])

  useEffect(() => {
    setPayments(initialPayments)
  }, [initialPayments])

  useEffect(() => {
    async function fetchAttendance() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const parts = teacherAcademicYear.split('-')
      const startYear = parseInt(parts[0])
      const endYear = startYear + 1
      const startDate = `${startYear}-04-01`
      const endDate = `${endYear}-03-31`
      
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('teacher_id', teacher.id)
        .gte('date', startDate)
        .lte('date', endDate)
      
      setAttendanceData(data || [])
    }
    fetchAttendance()
  }, [teacher.id, teacherAcademicYear, supabase])

  useEffect(() => {
    if (selectedMonthView) {
      const monthPayments = payments.filter((p: any) => p.month === selectedMonthView.monthValue)
      const totalPaidThisMonth = monthPayments.reduce((a: number, p: any) => a + Number(p.amount), 0)
      const baseSalary = customSalaries[selectedMonthView.monthName] ?? teacher.monthly_salary
      const adjustedSalary = getAdjustedSalary(selectedMonthView.monthName, baseSalary)
      const remainingDue = adjustedSalary - totalPaidThisMonth

      setSelectedMonthView((prev: any) => {
        if (!prev) return null
        return {
          ...prev,
          payments: monthPayments,
          totalPaid: totalPaidThisMonth,
          balance: remainingDue
        }
      })
    }
  }, [payments, customSalaries, teacher.monthly_salary, attendanceData])

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`teacher_months_${teacher.id}`)
      if (saved) {
        try {
          setMonthsList(JSON.parse(saved))
        } catch (e) {
          setMonthsList(DEFAULT_MONTHS)
        }
      } else {
        setMonthsList(DEFAULT_MONTHS)
      }

      const savedSalaries = localStorage.getItem(`teacher_custom_salaries_${teacher.id}`)
      if (savedSalaries) {
        try {
          setCustomSalaries(JSON.parse(savedSalaries))
        } catch (e) {
          setCustomSalaries({})
        }
      } else {
        setCustomSalaries({})
      }
    }
  }, [teacher.id])

  const sortMonths = (list: string[]) => {
    const sessionOrder = [
      'April', 'May', 'June', 'July', 'August', 'September', 
      'October', 'November', 'December', 'January', 'February', 'March'
    ]
    return [...list].sort((a, b) => sessionOrder.indexOf(a) - sessionOrder.indexOf(b))
  }

  const availableMonths = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ].filter(m => !monthsList.includes(m))

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault()
    const newMonth = modalData.monthName
    if (!newMonth) return
    
    if (monthsList.includes(newMonth)) {
      alert(`${newMonth} is already in the breakdown.`)
      return
    }
    
    const updated = sortMonths([...monthsList, newMonth])
    setMonthsList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`teacher_months_${teacher.id}`, JSON.stringify(updated))
    }
    setActiveModal(null)
  }

  const handleDeleteCurrentMonth = () => {
    if (!selectedMonthView) return
    const monthToDelete = selectedMonthView.monthName
    if (!confirm(`Are you sure you want to delete ${monthToDelete} from the monthly breakdown?`)) return
    
    const updated = monthsList.filter(m => m !== monthToDelete)
    setMonthsList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`teacher_months_${teacher.id}`, JSON.stringify(updated))
    }
    setSelectedMonthView(null)
  }

  const handleDeleteMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const monthToDelete = modalData.monthName
    if (!monthToDelete) return
    if (!confirm(`Are you sure you want to delete ${monthToDelete} from the monthly breakdown?`)) return
    
    const updated = monthsList.filter(m => m !== monthToDelete)
    setMonthsList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`teacher_months_${teacher.id}`, JSON.stringify(updated))
    }
    setActiveModal(null)
  }

  const handleSaveCustomSalary = (e: React.FormEvent) => {
    e.preventDefault()
    const targetMonth = modalData.monthName
    const newSalaryVal = modalData.salaryAmount ? Number(modalData.salaryAmount) : null
    
    const updated = { ...customSalaries }
    if (newSalaryVal === null || isNaN(newSalaryVal)) {
      delete updated[targetMonth]
    } else {
      updated[targetMonth] = newSalaryVal
    }
    
    setCustomSalaries(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`teacher_custom_salaries_${teacher.id}`, JSON.stringify(updated))
    }
    
    // Update the selectedMonthView balance if active
    if (selectedMonthView && selectedMonthView.monthName === targetMonth) {
      const totalPaid = selectedMonthView.totalPaid
      const expected = newSalaryVal !== null ? newSalaryVal : teacher.monthly_salary
      setSelectedMonthView({
        ...selectedMonthView,
        balance: expected - totalPaid
      })
    }
    
    setActiveModal(null)
  }

  const getMonthIndex = (monthName: string) => {
    const standardMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return standardMonths.indexOf(monthName) + 1;
  }

  const getYearForMonth = (monthName: string) => {
    const parts = teacherAcademicYear.split('-')
    const startYear = parseInt(parts[0])
    const firstYearMonths = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return firstYearMonths.includes(monthName) ? startYear : startYear + 1
  }

  const getWorkingDaysInMonth = (monthName: string) => {
    const mIdx = getMonthIndex(monthName) - 1
    const year = getYearForMonth(monthName)
    const totalDays = new Date(year, mIdx + 1, 0).getDate()
    let working = 0
    for (let d = 1; d <= totalDays; d++) {
      if (new Date(year, mIdx, d).getDay() !== 0) working++
    }
    return working
  }

  const getAttendanceStats = (monthName: string) => {
    const mIdx = getMonthIndex(monthName)
    const year = getYearForMonth(monthName)
    const records = attendanceData.filter(a => {
      const d = new Date(a.date)
      return (d.getMonth() + 1) === mIdx && d.getFullYear() === year
    })
    const present = records.filter(a => a.status === 'present').length
    const late = records.filter(a => a.status === 'late').length
    const halfDay = records.filter(a => a.status === 'half_day').length
    const onLeave = records.filter(a => a.status === 'on_leave').length
    const absent = records.filter(a => a.status === 'absent').length
    const effectiveDays = present + late + (halfDay * 0.5)
    return { present, late, halfDay, onLeave, absent, effectiveDays, totalRecords: records.length }
  }

  const getAdjustedSalary = (monthName: string, baseSalary: number) => {
    const stats = getAttendanceStats(monthName)
    if (stats.totalRecords === 0) return baseSalary
    const workingDays = getWorkingDaysInMonth(monthName)
    if (workingDays === 0) return baseSalary
    const perDay = baseSalary / workingDays
    return Math.round(perDay * stats.effectiveDays)
  }

  async function handlePaySalary(e: React.FormEvent) {
    e.preventDefault()
    
    if (Number(modalData.amount) > modalData.balance) {
      alert(`Error: Amount cannot be greater than the remaining balance (₹${modalData.balance})`)
      return
    }
    
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const dateObj = new Date(modalData.date)
    const year = dateObj.getFullYear()

    const { error } = await supabase.from('teacher_payments').insert({
      user_id: user?.id,
      teacher_id: teacher.id,
      amount: Number(modalData.amount),
      month: modalData.month,
      year: year,
      paid_at: modalData.date,
      academic_year: teacherAcademicYear,
      note: modalData.note
    })
    
    if (error) {
      alert(error.message)
    } else {
      setActiveModal(null)
      onRefresh?.()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeletePayment(id: string) {
    if (!confirm('Delete this payment record?')) return
    const { error } = await supabase.from('teacher_payments').delete().eq('id', id)
    if (error) alert(error.message)
    else {
      onRefresh?.()
      router.refresh()
    }
  }

  async function handleTeacherAction(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Check if we are editing details from a specific month details view
    if (modalData.monthName) {
      const targetMonth = modalData.monthName
      const newSalaryVal = Number(modalData.salary)
      
      const updated = { ...customSalaries }
      updated[targetMonth] = newSalaryVal
      
      setCustomSalaries(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`teacher_custom_salaries_${teacher.id}`, JSON.stringify(updated))
      }
      
      // Update selectedMonthView balance
      if (selectedMonthView && selectedMonthView.monthName === targetMonth) {
        const totalPaid = selectedMonthView.totalPaid
        setSelectedMonthView({
          ...selectedMonthView,
          balance: newSalaryVal - totalPaid
        })
      }
      
      // Update general teacher details (excluding base salary) in the database
      const res = await supabase.from('teachers').update({
        name: modalData.name,
        subject: modalData.subject,
        email: modalData.mobile || null
      }).eq('id', teacher.id)

      if (res?.error) {
        alert(res.error.message)
      } else {
        setActiveModal(null)
        onRefresh?.()
        router.refresh()
      }
      setLoading(false)
      return
    }

    // Normal profile edit (updates default salary across all months)
    const res = await supabase.from('teachers').update({
      name: modalData.name,
      subject: modalData.subject,
      email: modalData.mobile || null,
      monthly_salary: Number(modalData.salary)
    }).eq('id', teacher.id)

    if (res?.error) {
      alert(res.error.message)
    } else {
      setActiveModal(null)
      onRefresh?.()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteTeacher() {
    if (!confirm('Are you sure? All related salary payments will also be deleted.')) return
    const { error } = await supabase.from('teachers').delete().eq('id', teacher.id)
    if (error) alert(error.message)
    else router.push('/staff')
  }

  if (selectedMonthView) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-24 md:pb-6">
        {/* Header & Main Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedMonthView(null)} className="p-2 rounded-xl hover:bg-zinc-100 dark:bg-zinc-800 transition">
              <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{teacher.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                  {selectedMonthView.monthName} {selectedMonthView.year}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{teacher.subject} • {teacher.email || 'No mobile'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
            <button 
              onClick={() => {
                setActiveModal('edit-teacher')
                setModalData({ 
                  name: teacher.name, 
                  subject: teacher.subject, 
                  salary: String(customSalaries[selectedMonthView.monthName] ?? teacher.monthly_salary), 
                  mobile: teacher.email || '',
                  monthName: selectedMonthView.monthName
                })
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-4 py-2.5 rounded-xl transition font-medium text-sm"
            >
              <Pencil size={16} />
              <span>Edit</span>
            </button>
            <button 
              onClick={handleDeleteTeacher}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl transition font-medium text-sm"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setActiveModal('pay-salary')
                setModalData({
                  month: selectedMonthView.monthValue,
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  note: ''
                })
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Pay Salary</span>
            </button>
          </div>
        </div>

        {/* Fee Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card 
            className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group relative border border-zinc-200 dark:border-zinc-800"
            onClick={() => {
              setActiveModal('edit-custom-salary')
              setModalData({ 
                monthName: selectedMonthView.monthName, 
                salaryAmount: customSalaries[selectedMonthView.monthName] !== undefined ? String(customSalaries[selectedMonthView.monthName]) : '' 
              })
            }}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
                  Expected Salary <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                </p>
                {(() => {
                  const baseSalaryForCard = customSalaries[selectedMonthView.monthName] ?? teacher.monthly_salary;
                  const adjustedForCard = getAdjustedSalary(selectedMonthView.monthName, baseSalaryForCard);
                  const statsForCard = getAttendanceStats(selectedMonthView.monthName);
                  return (
                    <div className="flex flex-col">
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(adjustedForCard)}
                      </p>
                      {statsForCard.totalRecords > 0 && adjustedForCard < baseSalaryForCard && (
                        <p className="text-xs text-red-500 font-medium">
                          (-{formatCurrency(baseSalaryForCard - adjustedForCard)} deduction)
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(selectedMonthView.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Remaining Balance</p>
              <p className={`text-xl font-bold ${selectedMonthView.balance > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                {formatCurrency(selectedMonthView.balance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Summary */}
        {(() => {
          const stats = getAttendanceStats(selectedMonthView.monthName);
          const workingDays = getWorkingDaysInMonth(selectedMonthView.monthName);
          const baseSalary = customSalaries[selectedMonthView.monthName] ?? teacher.monthly_salary;
          const adjustedSalary = getAdjustedSalary(selectedMonthView.monthName, baseSalary);
          const deduction = baseSalary - adjustedSalary;
          
          if (stats.totalRecords === 0) {
            return (
              <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <CardContent className="p-5 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  <p>No attendance records found for {selectedMonthView.monthName}. Normal salary applies.</p>
                </CardContent>
              </Card>
            )
          }
          
          return (
            <Card className="border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/10">
              <CardContent className="p-5">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold mb-3 tracking-wider">📊 Attendance Summary — {selectedMonthView.monthName}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
                    <p className="text-lg font-bold text-green-600">{stats.present + stats.late}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Present</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
                    <p className="text-lg font-bold text-red-500">{stats.absent}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Absent</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
                    <p className="text-lg font-bold text-amber-500">{stats.halfDay}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Half Day</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3 text-center border border-zinc-100 dark:border-zinc-800">
                    <p className="text-lg font-bold text-violet-500">{stats.onLeave}</p>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">On Leave</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between"><span>Working Days</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{workingDays}</span></div>
                  <div className="flex justify-between"><span>Effective Present</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{stats.effectiveDays} days</span></div>
                  <div className="flex justify-between"><span>Base Salary</span><span className="font-semibold">{formatCurrency(baseSalary)}</span></div>
                  {deduction > 0 && (
                    <div className="flex justify-between text-red-500"><span>Deduction</span><span className="font-bold">-{formatCurrency(deduction)}</span></div>
                  )}
                  <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-700 pt-1.5 mt-1"><span className="font-bold text-zinc-900 dark:text-zinc-100">Adjusted Salary</span><span className="font-bold text-violet-600">{formatCurrency(adjustedSalary)}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Teacher Info */}
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] text-zinc-400 uppercase font-bold mb-3">Teacher Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Name</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{teacher.name}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Role / Subject</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{teacher.subject}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Mobile Number</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{teacher.mobile || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Email Address</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{teacher.email || '-'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-zinc-500 dark:text-zinc-400">Address</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{teacher.address || '-'}</p>
              </div>
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">Monthly Salary</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(customSalaries[selectedMonthView.monthName] ?? teacher.monthly_salary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <StaffReceiptPDF
          teacherName={teacher.name}
          subject={teacher.subject}
          monthName={selectedMonthView.monthName || DEFAULT_MONTHS[selectedMonthView.monthValue - 1]}
          year={selectedMonthView.year}
          amountPaidNow={selectedMonthView.totalPaid}
          totalSalary={customSalaries[selectedMonthView.monthName] ?? teacher.monthly_salary}
          totalPaidThisMonth={selectedMonthView.totalPaid}
          balance={selectedMonthView.balance}
          note="Monthly Salary Payment"
          schoolName={schoolName}
          teacherMobile={teacher.email}
          payments={selectedMonthView.payments}
        />

        {/* Payment History */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/50">
              <h2 className="text-base font-bold">Payment History</h2>
            </div>
            {!selectedMonthView.payments || selectedMonthView.payments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-400">No payments yet for {selectedMonthView.monthName}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <th className="text-left py-3 px-2.5 sm:px-5 text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Date</th>
                      <th className="text-left py-3 px-2.5 sm:px-5 text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Amount</th>
                      <th className="text-left py-3 px-2.5 sm:px-5 text-zinc-500 dark:text-zinc-400 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMonthView.payments.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition">
                        <td className="py-3 px-2.5 sm:px-5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(payment.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-2.5 sm:px-5 font-medium text-green-600 whitespace-nowrap">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-2.5 sm:px-5 text-zinc-500 dark:text-zinc-400 break-words max-w-[120px] sm:max-w-none">
                          {payment.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals for this view */}
        {/* Add Payment Modal */}
        {activeModal === 'pay-salary' && mounted && createPortal(
          <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Pay Salary - {selectedMonthView.monthName}</h2>
                <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={(e) => {
                handlePaySalary(e).then(() => {
                  // Update local view state optimistically or rely on parent refetch
                  // To be safe, we just close modal, and router.refresh() handles new data.
                  // We'll also clear selectedMonthView to force a fresh click, or let it be.
                  // The easiest way is to let the user re-click or update state.
                  // For simplicity, we just close the modal.
                  setActiveModal(null)
                })
              }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₹</span>
                    <input 
                      required 
                      type="number" 
                      max={selectedMonthView.balance > 0 ? selectedMonthView.balance : undefined}
                      value={modalData.amount} 
                      onChange={e => setModalData({...modalData, amount: e.target.value})}
                      className={`w-full h-11 pl-8 pr-3 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent transition-colors ${Number(modalData.amount) > selectedMonthView.balance && selectedMonthView.balance > 0 ? 'border-red-500 text-red-600 focus:ring-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                    />
                  </div>
                  {Number(modalData.amount) > selectedMonthView.balance && selectedMonthView.balance > 0 && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                      Cannot pay more than remaining balance (₹{selectedMonthView.balance})
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <input required type="date" value={modalData.date} onChange={e => setModalData({...modalData, date: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Note (Optional)</label>
                  <input value={modalData.note} onChange={e => setModalData({...modalData, note: e.target.value})} placeholder="e.g. Advance, Bonus" className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || (Number(modalData.amount) > selectedMonthView.balance && selectedMonthView.balance > 0)}
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-xl font-medium transition"
                >
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}

        

      {/* Edit Teacher Modal */}
      {activeModal === 'edit-teacher' && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20 sm:pt-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {modalData.monthName ? `Edit Details - ${modalData.monthName}` : 'Edit Staff Details'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTeacherAction} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input required value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role / Subject</label>
                <input required value={modalData.subject} onChange={e => setModalData({...modalData, subject: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mobile Number (Optional)</label>
                <input type="tel" value={modalData.mobile || ''} onChange={e => setModalData({...modalData, mobile: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {modalData.monthName ? `Expected Salary for ${modalData.monthName} (₹)` : 'Monthly Salary (₹)'}
                </label>
                <input required type="number" value={modalData.salary} onChange={e => setModalData({...modalData, salary: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/staff" className="p-2 mt-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{teacher.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              {teacher.subject} • {teacherAcademicYear} Session {teacher.email ? `• ${teacher.email}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center p-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition shadow-sm"
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setActiveModal('add-month')
                      setModalData({ monthName: '' })
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <Plus size={14} className="text-zinc-500" />
                    <span>Add Month</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setActiveModal('delete-month')
                      setModalData({ monthName: '' })
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                  >
                    <Trash2 size={14} className="text-red-500" />
                    <span>Delete Month</span>
                  </button>

                  <div className="my-1.5 border-t border-zinc-100 dark:border-zinc-800" />

                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleDeleteTeacher()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                  >
                    <Trash2 size={14} className="text-red-500" />
                    <span>Delete Staff</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Monthly Salary</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(teacher.monthly_salary)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Total Paid (Session)</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(initialPayments.reduce((acc, p) => acc + Number(p.amount), 0))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Section */}
      <div className="space-y-3">
        <div className="px-1 mb-1">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Monthly Breakdown</h2>
        </div>
        {/* Desktop Table View */}
        <Card className="hidden sm:block overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider">Month</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider text-center">Attendance</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider text-right">Adjusted Salary</th>
                  <th className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider text-right">Paid Amount</th>
                  <th className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider text-right">Remaining Due</th>
                  <th className="text-left px-4 py-3 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[11px] tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {monthsList.map((monthName) => {
                  const mIndex = getMonthIndex(monthName);
                  const monthPayments = initialPayments.filter(p => p.month === mIndex);
                  const totalPaidThisMonth = monthPayments.reduce((a, p) => a + Number(p.amount), 0);
                  const baseSalary = customSalaries[monthName] ?? teacher.monthly_salary;
                  const stats = getAttendanceStats(monthName);
                  const adjustedSalary = getAdjustedSalary(monthName, baseSalary);
                  const workingDays = getWorkingDaysInMonth(monthName);
                  const remainingDue = adjustedSalary - totalPaidThisMonth;
                  
                  let status = 'UNPAID';
                  let statusVariant: any = 'unpaid';
                  if (remainingDue <= 0) {
                    status = 'PAID';
                    statusVariant = 'paid';
                  } else if (totalPaidThisMonth > 0) {
                    status = 'PARTIAL';
                    statusVariant = 'partial';
                  }

                  return (
                    <tr 
                      key={monthName} 
                      onClick={() => {
                        setSelectedMonthView({ 
                          monthName: monthName, 
                          monthValue: mIndex, 
                          year: new Date().getFullYear(), 
                          payments: monthPayments, 
                          totalPaid: totalPaidThisMonth, 
                          balance: remainingDue 
                        })
                      }}
                      className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-4.5 font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-violet-600 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {monthName}
                          {monthName === currentMonthName && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest shadow-sm">Current</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4.5 text-center">
                        {stats.totalRecords > 0 ? (
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            {stats.effectiveDays}/{workingDays}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-4.5 text-right text-zinc-500">
                        <span className="flex items-center justify-end gap-1 flex-wrap justify-end">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(adjustedSalary)}</span>
                          {stats.totalRecords > 0 && adjustedSalary < baseSalary && (
                            <span className="text-[10px] text-red-500 font-bold">(-{formatCurrency(baseSalary - adjustedSalary)})</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-right font-bold text-green-600">
                        {totalPaidThisMonth > 0 ? formatCurrency(totalPaidThisMonth) : '-'}
                      </td>
                      <td className="px-4 py-4.5 text-right">
                        <span className={remainingDue > 0 ? 'text-red-500 font-bold' : 'text-zinc-400'}>
                          {remainingDue > 0 ? formatCurrency(remainingDue) : '0'}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-center">
                        <Badge variant={statusVariant}>{status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile Cards View */}
        <div className="sm:hidden space-y-3">
          {monthsList.map((monthName) => {
            const mIndex = getMonthIndex(monthName);
            const monthPayments = initialPayments.filter(p => p.month === mIndex);
            const totalPaidThisMonth = monthPayments.reduce((a, p) => a + Number(p.amount), 0);
            const baseSalary = customSalaries[monthName] ?? teacher.monthly_salary;
            const stats = getAttendanceStats(monthName);
            const adjustedSalary = getAdjustedSalary(monthName, baseSalary);
            const workingDays = getWorkingDaysInMonth(monthName);
            const remainingDue = adjustedSalary - totalPaidThisMonth;
            
            let status = 'UNPAID';
            let statusVariant: any = 'unpaid';
            if (remainingDue <= 0) {
              status = 'PAID';
              statusVariant = 'paid';
            } else if (totalPaidThisMonth > 0) {
              status = 'PARTIAL';
              statusVariant = 'partial';
            }

            const percent = adjustedSalary > 0 
              ? Math.min(100, Math.round((totalPaidThisMonth / adjustedSalary) * 100)) 
              : 0;

            const getProgressColor = (val: number) => {
              if (val >= 100) return 'bg-emerald-500'
              if (val <= 0) return 'bg-rose-500'
              if (val < 50) return 'bg-amber-500'
              return 'bg-indigo-500'
            }

            return (
              <Card 
                key={monthName}
                onClick={() => {
                  setSelectedMonthView({ 
                    monthName: monthName, 
                    monthValue: mIndex, 
                    year: new Date().getFullYear(), 
                    payments: monthPayments, 
                    totalPaid: totalPaidThisMonth, 
                    balance: remainingDue 
                  })
                }}
                className="hover:shadow-md transition cursor-pointer border-zinc-200 dark:border-zinc-800"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{monthName}</p>
                      {monthName === currentMonthName && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest shadow-sm">Current</span>
                      )}
                    </div>
                    <Badge variant={statusVariant}>{status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>Salary Track</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{percent}% Paid</span>
                  </div>
                  <Progress value={percent} indicatorClassName={getProgressColor(percent)} />
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <div>
                      Salary: <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(adjustedSalary)}</span>
                    </div>
                    <div className="text-center text-green-600">
                      Paid: <span>{formatCurrency(totalPaidThisMonth)}</span>
                    </div>
                    <div className={`text-right ${remainingDue > 0 ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      Due: <span>{formatCurrency(remainingDue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>



      {/* Pay Modal */}
      {activeModal === 'pay-salary' && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20 sm:pt-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Pay Salary - {modalData.monthName}</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaySalary} className="space-y-4">
              <div>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 rounded-xl text-xs leading-relaxed">
                  💡 <strong>Half/Advance Payment?</strong> You can change the amount below. The system will automatically keep track of the remaining balance.
                </div>
                <div className="flex justify-between items-end mb-1">
                  <label className={`text-sm font-medium block ${Number(modalData.amount) > modalData.balance ? 'text-red-500' : ''}`}>Amount to Pay (₹)</label>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Balance Due: ₹{modalData.balance}</span>
                </div>
                <input required type="number" max={modalData.balance} value={modalData.amount} onChange={e => setModalData({...modalData, amount: e.target.value})} className={`w-full h-11 px-3 border rounded-xl focus:ring-2 outline-none bg-transparent transition-colors ${Number(modalData.amount) > modalData.balance ? 'border-red-500 focus:ring-red-500 text-red-500' : 'border-zinc-200 dark:border-zinc-800 focus:ring-violet-500'}`} />
                {Number(modalData.amount) > modalData.balance && (
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    Cannot exceed balance of ₹{modalData.balance}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Payment Date</label>
                <input required type="date" value={modalData.date} onChange={e => setModalData({...modalData, date: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Note (Optional)</label>
                <input value={modalData.note} onChange={e => setModalData({...modalData, note: e.target.value})} placeholder="e.g. Cash payment" className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium">
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* History Modal REMOVED - Using Full Page View Instead */}

      

      {/* Edit Teacher Modal */}
      {activeModal === 'edit-teacher' && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20 sm:pt-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {modalData.monthName ? `Edit Details - ${modalData.monthName}` : 'Edit Staff Details'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTeacherAction} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <input required value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role / Subject</label>
                <input required value={modalData.subject} onChange={e => setModalData({...modalData, subject: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Mobile Number (Optional)</label>
                <input type="tel" value={modalData.mobile || ''} onChange={e => setModalData({...modalData, mobile: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {modalData.monthName ? `Expected Salary for ${modalData.monthName} (₹)` : 'Monthly Salary (₹)'}
                </label>
                <input required type="number" value={modalData.salary} onChange={e => setModalData({...modalData, salary: e.target.value})} className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent" />
              </div>
              <button type="submit" disabled={loading} className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Month Modal */}
      {activeModal === 'add-month' && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Month to Breakdown</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>
            {availableMonths.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                All school session months are already added!
              </div>
            ) : (
              <form onSubmit={handleAddMonth} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-zinc-700 dark:text-zinc-300">Select Month</label>
                  <select 
                    required 
                    value={modalData.monthName} 
                    onChange={e => setModalData({ ...modalData, monthName: e.target.value })} 
                    className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="" disabled className="dark:bg-zinc-950 text-zinc-400">-- Choose Month --</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m} className="dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">{m}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors shadow-sm">
                  Add Month
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
      {/* Delete Month Modal */}
      {activeModal === 'delete-month' && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Delete Month from Breakdown</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>
            {monthsList.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No months to delete!
              </div>
            ) : (
              <form onSubmit={handleDeleteMonthSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-zinc-700 dark:text-zinc-300">Select Month to Remove</label>
                  <select 
                    required 
                    value={modalData.monthName} 
                    onChange={e => setModalData({ ...modalData, monthName: e.target.value })} 
                    className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="" disabled className="dark:bg-zinc-950 text-zinc-400">-- Choose Month --</option>
                    {monthsList.map(m => (
                      <option key={m} value={m} className="dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">{m}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm">
                  Delete Month
                </button>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Edit Custom Salary Modal */}
      {activeModal === 'edit-custom-salary' && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-5 border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Set Salary for {modalData.monthName}</h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomSalary} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-zinc-700 dark:text-zinc-300">Expected Salary (₹)</label>
                <input 
                  type="number" 
                  placeholder={`Default: ₹${teacher.monthly_salary}`}
                  value={modalData.salaryAmount} 
                  onChange={e => setModalData({ ...modalData, salaryAmount: e.target.value })} 
                  className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none bg-transparent dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-xs text-zinc-400 mt-1">Leave empty to use teacher's default monthly salary.</p>
              </div>
              <button type="submit" className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors shadow-sm">
                Save Salary
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
