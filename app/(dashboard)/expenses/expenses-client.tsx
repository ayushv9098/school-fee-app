'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/calculations'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, X, Wallet, TrendingDown, TrendingUp, 
  User, Truck, Building2, Banknote, 
  Fuel, Settings, HardHat, MoreHorizontal,
  Pencil, Trash2, History, ChevronDown, ChevronUp
} from 'lucide-react'

interface Teacher {
  id: string
  name: string
  subject: string
  monthly_salary: number
}

interface TeacherPayment {
  id: string
  teacher_id: string
  amount: number
  month: number
  year: number
  note: string
  paid_at: string
}

interface Vehicle {
  id: string
  name: string
  type: string
  license_plate?: string
}

interface VehicleExpense {
  id: string
  vehicle_id: string
  expense_type: string
  amount: number
  date: string
  note: string
}

interface BuildingExpense {
  id: string
  category: string
  amount: number
  date: string
  note: string
}

interface Student {
  total_paid: number
}

export default function ExpensesClient({
  initialTeachers,
  initialTeacherPayments,
  initialVehicles,
  initialVehicleExpenses,
  initialBuildingExpenses,
  students,
}: {
  initialTeachers: Teacher[]
  initialTeacherPayments: TeacherPayment[]
  initialVehicles: Vehicle[]
  initialVehicleExpenses: VehicleExpense[]
  initialBuildingExpenses: BuildingExpense[]
  students: Student[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalData, setModalData] = useState<any>({})
  const [showHistory, setShowHistory] = useState<string | null>(null)

  // Constants
  const VEHICLE_EXPENSE_TYPES = ['Diesel', 'Petrol', 'Maintenance', 'Other']
  const BUILDING_CATEGORIES = ['Rent', 'Electricity', 'Maintenance', 'Other']
  const CURRENT_MONTH = new Date().getMonth() + 1
  const CURRENT_YEAR = new Date().getFullYear()

  // Calculations
  const totalCollected = students.reduce((a, s) => a + (s.total_paid || 0), 0)
  
  const teacherMonthlyTotal = initialTeacherPayments.reduce((a, p) => a + Number(p.amount), 0)
  const vehicleMonthlyTotal = initialVehicleExpenses.reduce((a, e) => a + Number(e.amount), 0)
  const buildingMonthlyTotal = initialBuildingExpenses.reduce((a, e) => a + Number(e.amount), 0)
  
  const totalExpensesThisMonth = teacherMonthlyTotal + vehicleMonthlyTotal + buildingMonthlyTotal
  const netProfit = totalCollected - totalExpensesThisMonth

  // --- ACTIONS ---

  async function handleTeacherAction(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()

    let res;
    if (activeModal === 'add-teacher') {
      res = await supabase.from('teachers').insert({
        user_id: user?.id,
        name: modalData.name,
        subject: modalData.subject,
        monthly_salary: Number(modalData.salary)
      })
    } else if (activeModal === 'edit-teacher') {
      res = await supabase.from('teachers').update({
        name: modalData.name,
        subject: modalData.subject,
        monthly_salary: Number(modalData.salary)
      }).eq('id', modalData.id)
    }

    if (res?.error) {
      setError(res.error.message)
    } else {
      setActiveModal(null)
      setModalData({})
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteTeacher(id: string) {
    if (!confirm('Are you sure? All related salary payments will also be deleted.')) return
    setLoading(true)
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) alert(error.message)
    else router.refresh()
    setLoading(false)
  }

  async function handlePaySalary(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()

    const dateObj = new Date(modalData.date)
    const month = dateObj.getMonth() + 1
    const year = dateObj.getFullYear()

    const { error } = await supabase.from('teacher_payments').insert({
      user_id: user?.id,
      teacher_id: modalData.teacherId,
      amount: Number(modalData.amount),
      month: month,
      year: year,
      paid_at: modalData.date,
      note: modalData.note
    })
    if (error) {
      setError(error.message)
    } else {
      setActiveModal(null)
      setModalData({})
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeletePayment(id: string) {
    if (!confirm('Delete this payment record?')) return
    const { error } = await supabase.from('teacher_payments').delete().eq('id', id)
    if (error) alert(error.message)
    else router.refresh()
  }

  async function handleVehicleAction(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()

    let res;
    if (activeModal === 'add-vehicle') {
      res = await supabase.from('vehicles').insert({
        user_id: user?.id,
        name: modalData.name,
        type: modalData.type
      })
    } else if (activeModal === 'edit-vehicle') {
      res = await supabase.from('vehicles').update({
        name: modalData.name,
        type: modalData.type
      }).eq('id', modalData.id)
    }

    if (res?.error) {
      setError(res.error.message)
    } else {
      setActiveModal(null)
      setModalData({})
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteVehicle(id: string) {
    if (!confirm('Are you sure? All vehicle expenses will also be deleted.')) return
    setLoading(true)
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) alert(error.message)
    else router.refresh()
    setLoading(false)
  }

  async function handleVehicleExpenseAction(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('vehicle_expenses').insert({
      user_id: user?.id,
      vehicle_id: modalData.vehicleId,
      expense_type: modalData.expenseType,
      amount: Number(modalData.amount),
      date: modalData.date,
      note: modalData.note
    })
    if (error) {
      setError(error.message)
    } else {
      setActiveModal(null)
      setModalData({})
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteVehicleExpense(id: string) {
    if (!confirm('Delete this expense?')) return
    const { error } = await supabase.from('vehicle_expenses').delete().eq('id', id)
    if (error) alert(error.message)
    else router.refresh()
  }

  async function handleBuildingExpenseAction(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('building_expenses').insert({
      user_id: user?.id,
      category: modalData.category,
      amount: Number(modalData.amount),
      date: modalData.date,
      note: modalData.note
    })
    if (error) {
      setError(error.message)
    } else {
      setActiveModal(null)
      setModalData({})
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDeleteBuildingExpense(id: string) {
    if (!confirm('Delete this building expense?')) return
    const { error } = await supabase.from('building_expenses').delete().eq('id', id)
    if (error) alert(error.message)
    else router.refresh()
  }

  return (
    <div className="px-3 py-5 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      
      {/* --- SUMMARY BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="border-blue-100 bg-blue-50/30">
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-zinc-500 font-medium">Total Collected</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600">
              <TrendingUp size={20} className="md:w-6 md:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-zinc-500 font-medium">Total Expenses</p>
              <p className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(totalExpensesThisMonth)}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl md:rounded-2xl flex items-center justify-center text-red-600">
              <TrendingDown size={20} className="md:w-6 md:h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={netProfit >= 0 ? "border-green-100 bg-green-50/30" : "border-red-100 bg-red-50/30"}>
          <CardContent className="p-4 md:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-zinc-500 font-medium">Net Profit</p>
              <p className={`text-xl md:text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${netProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {netProfit >= 0 ? <TrendingUp size={20} className="md:w-6 md:h-6" /> : <TrendingDown size={20} className="md:w-6 md:h-6" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- SECTION 1: STAFF --- */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-violet-100 rounded-lg md:rounded-xl flex items-center justify-center text-violet-600 flex-shrink-0">
              <User size={18} className="md:w-5 md:h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-zinc-900">Staff</h2>
              <p className="text-[11px] md:text-sm text-zinc-500 hidden xs:block">Manage staff and salaries</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveModal('add-teacher')
              setError(null)
              setModalData({ name: '', subject: '', salary: '' })
            }}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs md:text-sm font-medium px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl transition shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Staff</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {initialTeachers.map(teacher => {
            const paidThisMonth = initialTeacherPayments
              .filter(p => p.teacher_id === teacher.id && p.month === CURRENT_MONTH && p.year === CURRENT_YEAR)
              .reduce((a, p) => a + Number(p.amount), 0)
            
            const teacherPayments = initialTeacherPayments.filter(p => p.teacher_id === teacher.id)

            return (
              <Card key={teacher.id} className="border-zinc-200 overflow-hidden shadow-none hover:shadow-sm transition">
                <CardContent className="p-0">
                  <div className="p-4 md:p-5 space-y-3 md:space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-zinc-900 truncate text-sm md:text-base">{teacher.name}</p>
                          <button 
                            onClick={() => {
                              setActiveModal('edit-teacher')
                              setError(null)
                              setModalData({ id: teacher.id, name: teacher.name, subject: teacher.subject, salary: String(teacher.monthly_salary) })
                            }}
                            className="p-1 text-zinc-400 hover:text-violet-600 transition flex-shrink-0"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] md:text-xs text-zinc-500">{teacher.subject}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm md:text-base font-semibold text-zinc-900">{formatCurrency(teacher.monthly_salary)}</p>
                        <p className="text-[9px] md:text-[10px] text-zinc-400 uppercase tracking-wider">Salary/Month</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] text-zinc-400 uppercase font-bold">Paid This Month</p>
                        <p className={`text-sm md:text-base font-bold truncate ${paidThisMonth >= teacher.monthly_salary ? 'text-green-600' : 'text-orange-500'}`}>
                          {formatCurrency(paidThisMonth)}
                        </p>
                      </div>
                      <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                         <button 
                          onClick={() => setShowHistory(showHistory === teacher.id ? null : teacher.id)}
                          className={`p-1.5 md:p-2 rounded-lg border transition ${showHistory === teacher.id ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}
                          title="View History"
                        >
                          <History size={14} className="md:w-4 md:h-4" />
                        </button>
                        <button
                         onClick={() => {
                           setActiveModal('pay-salary')
                           setError(null)
                           setModalData({
                             teacherId: teacher.id,
                             teacherName: teacher.name,
                             amount: '',
                             suggestedAmount: String(teacher.monthly_salary - paidThisMonth > 0 ? teacher.monthly_salary - paidThisMonth : teacher.monthly_salary),
                             date: new Date().toISOString().split('T')[0],
                             note: ''
                           })
                         }}
                         className="px-3 md:px-4 py-1.5 md:py-2 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[11px] md:text-xs font-bold transition shadow-sm whitespace-nowrap"
                        >                          Pay Salary
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* History Section */}
                  {showHistory === teacher.id && (
                    <div className="bg-zinc-50 border-t border-zinc-100 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Payment History</p>
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="text-[10px] text-red-500 hover:underline font-bold"
                        >
                          Delete Staff
                        </button>
                      </div>
                      {teacherPayments.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 text-center py-2 italic">No records found</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {teacherPayments.map(p => (
                            <div key={p.id} className="bg-white p-2 rounded-lg border border-zinc-200 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-zinc-800">
                                  {new Date(2000, p.month - 1).toLocaleString('default', { month: 'short' })} {p.year}
                                </p>
                                <p className="text-[10px] text-zinc-400">{p.note || 'Salary payment'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-xs font-bold text-green-600">{formatCurrency(p.amount)}</p>
                                <button onClick={() => handleDeletePayment(p.id)} className="text-zinc-300 hover:text-red-500 transition">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {initialTeachers.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 p-12 text-center bg-white border border-dashed border-zinc-300 rounded-2xl">
              <User className="mx-auto text-zinc-300 mb-3" size={40} />
              <p className="text-zinc-500 text-sm">No staff added yet</p>
            </div>
          )}
        </div>
      </section>

      {/* --- SECTION 2: VEHICLES --- */}
      <section className="space-y-3 md:space-y-4 pt-2 md:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
              <Truck size={18} className="md:w-5 md:h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-zinc-900">Vehicles</h2>
              <p className="text-[11px] md:text-sm text-zinc-500 hidden xs:block">Track fuel and maintenance</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveModal('add-vehicle')
              setError(null)
              setModalData({ name: '', type: 'Magic' })
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-medium px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl transition shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {initialVehicles.map(vehicle => {
            const vehicleExpenses = initialVehicleExpenses.filter(e => e.vehicle_id === vehicle.id)
            const vehicleTotal = vehicleExpenses.reduce((a, e) => a + Number(e.amount), 0)

            return (
              <Card key={vehicle.id} className="border-zinc-200 overflow-hidden shadow-none hover:shadow-sm transition">
                <CardContent className="p-0">
                  <div className="p-4 md:p-5 space-y-3 md:space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-zinc-900 truncate text-sm md:text-base">{vehicle.name}</p>
                          <button 
                            onClick={() => {
                              setActiveModal('edit-vehicle')
                              setError(null)
                              setModalData({ id: vehicle.id, name: vehicle.name, type: vehicle.type })
                            }}
                            className="p-1 text-zinc-400 hover:text-blue-600 transition flex-shrink-0"
                          >
                            <Pencil size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] md:text-xs text-zinc-500">{vehicle.type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm md:text-base font-bold text-blue-600">{formatCurrency(vehicleTotal)}</p>
                        <p className="text-[9px] md:text-[10px] text-zinc-400 uppercase tracking-wider">This Month</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {VEHICLE_EXPENSE_TYPES.map(type => (
                        <button
                          key={type}
                          onClick={() => {
                            setActiveModal('add-vehicle-expense')
                            setError(null)
                            setModalData({
                              vehicleId: vehicle.id,
                              vehicleName: vehicle.name,
                              expenseType: type,
                              amount: '',
                              date: new Date().toISOString().split('T')[0],
                              note: ''
                            })
                          }}
                          className="flex items-center justify-center gap-1 py-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg text-[10px] md:text-[11px] font-bold transition border border-zinc-100"
                        >
                          {type === 'Diesel' || type === 'Petrol' ? <Fuel size={12} /> : type === 'Maintenance' ? <Settings size={12} /> : <MoreHorizontal size={12} />}
                          {type}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setShowHistory(showHistory === vehicle.id ? null : vehicle.id)}
                      className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[10px] md:text-[11px] font-bold text-zinc-500 hover:text-zinc-800 transition bg-zinc-50 rounded-lg"
                    >
                      {showHistory === vehicle.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      View Expense History
                    </button>
                  </div>

                  {/* Vehicle History Section */}
                  {showHistory === vehicle.id && (
                    <div className="bg-zinc-50 border-t border-zinc-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Monthly Records</p>
                        <button 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-[10px] text-red-500 hover:underline font-bold"
                        >
                          Delete Vehicle
                        </button>
                      </div>
                      {vehicleExpenses.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 text-center py-2 italic">No expenses this month</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {vehicleExpenses.map(e => (
                            <div key={e.id} className="bg-white p-2 rounded-lg border border-zinc-200 flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-zinc-800">{e.expense_type}</p>
                                <p className="text-[10px] text-zinc-400">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {e.note || '-'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-xs font-bold text-blue-600">{formatCurrency(e.amount)}</p>
                                <button onClick={() => handleDeleteVehicleExpense(e.id)} className="text-zinc-300 hover:text-red-500 transition">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {initialVehicles.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 p-12 text-center bg-white border border-dashed border-zinc-300 rounded-2xl">
              <Truck className="mx-auto text-zinc-300 mb-3" size={40} />
              <p className="text-zinc-500 text-sm">No vehicles added yet</p>
            </div>
          )}
        </div>
      </section>

      {/* --- SECTION 3: BUILDING & OTHER --- */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Building & Other</h2>
            <p className="text-sm text-zinc-500">Rent, Bills and fixed costs</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BUILDING_CATEGORIES.map(cat => {
            const catExpenses = initialBuildingExpenses.filter(e => e.category === cat)
            const catTotal = catExpenses.reduce((a, e) => a + Number(e.amount), 0)

            return (
              <div key={cat} className="space-y-2">
                <Card 
                  className="border-zinc-200 cursor-pointer hover:border-orange-300 hover:shadow-md transition group"
                  onClick={() => {
                    setActiveModal('add-building-expense')
                    setError(null)
                    setModalData({
                      category: cat,
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      note: ''
                    })
                  }}
                >
                  <CardContent className="p-5 text-center space-y-3">
                    <div className="w-10 h-10 bg-zinc-50 group-hover:bg-orange-50 rounded-xl flex items-center justify-center mx-auto text-zinc-400 group-hover:text-orange-500 transition">
                      {cat === 'Rent' ? <Building2 size={18} /> : cat === 'Electricity' ? <Banknote size={18} /> : cat === 'Maintenance' ? <HardHat size={18} /> : <MoreHorizontal size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">{cat}</p>
                      <p className="text-lg font-bold text-zinc-900">{formatCurrency(catTotal)}</p>
                    </div>
                    <div className="text-[10px] text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition">
                      + Add Expense
                    </div>
                  </CardContent>
                </Card>
                
                {catExpenses.length > 0 && (
                  <button 
                    onClick={() => setShowHistory(showHistory === cat ? null : cat)}
                    className="w-full py-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 flex items-center justify-center gap-1"
                  >
                    {showHistory === cat ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    History
                  </button>
                )}

                {showHistory === cat && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    {catExpenses.map(e => (
                      <div key={e.id} className="bg-white p-2 rounded-lg border border-zinc-100 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-500 truncate max-w-[50px]">{new Date(e.date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</span>
                        <span className="font-bold text-zinc-800">{formatCurrency(e.amount)}</span>
                        <button onClick={() => handleDeleteBuildingExpense(e.id)} className="text-zinc-300 hover:text-red-500">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* --- MODALS --- */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">
                {activeModal === 'add-teacher' && 'Add New Staff'}
                {activeModal === 'edit-teacher' && 'Edit Staff Details'}
                {activeModal === 'pay-salary' && `Pay Salary: ${modalData.teacherName}`}
                {activeModal === 'add-vehicle' && 'Add New Vehicle'}
                {activeModal === 'edit-vehicle' && 'Edit Vehicle Details'}
                {activeModal === 'add-vehicle-expense' && `Add ${modalData.expenseType}: ${modalData.vehicleName}`}
                {activeModal === 'add-building-expense' && `Add ${modalData.category} Expense`}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 transition text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>

            <form 
              onSubmit={
                (activeModal === 'add-teacher' || activeModal === 'edit-teacher') ? handleTeacherAction :
                activeModal === 'pay-salary' ? handlePaySalary :
                (activeModal === 'add-vehicle' || activeModal === 'edit-vehicle') ? handleVehicleAction :
                activeModal === 'add-vehicle-expense' ? handleVehicleExpenseAction :
                handleBuildingExpenseAction
              } 
              className="p-5 space-y-4"
            >
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                  {error}
                </div>
              )}

              {(activeModal === 'add-teacher' || activeModal === 'edit-teacher') && (
                <>
                  <div className="space-y-1.5">
                    <Label>Staff Name</Label>
                    <Input 
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={modalData.name}
                      onChange={e => setModalData({...modalData, name: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role / Subject</Label>
                    <Input 
                      required
                      placeholder="e.g. Mathematics"
                      value={modalData.subject}
                      onChange={e => setModalData({...modalData, subject: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Monthly Salary (₹)</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="10000"
                      value={modalData.salary}
                      onChange={e => setModalData({...modalData, salary: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </>
              )}

              {activeModal === 'pay-salary' && (
                <>
                  <div className="space-y-1.5">
                    <Label>Amount (₹)</Label>
                    <Input 
                      required
                      type="number"
                      value={modalData.amount}
                      onChange={e => setModalData({...modalData, amount: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input 
                      required
                      type="date"
                      value={modalData.date}
                      onChange={e => setModalData({...modalData, date: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Note (Optional)</Label>
                    <Input 
                      placeholder="Bonus, Advance, etc."
                      value={modalData.note}
                      onChange={e => setModalData({...modalData, note: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </>
              )}

              {(activeModal === 'add-vehicle' || activeModal === 'edit-vehicle') && (
                <>
                  <div className="space-y-1.5">
                    <Label>Vehicle Name/Number</Label>
                    <Input 
                      required
                      placeholder="e.g. MP19 CA 1234"
                      value={modalData.name}
                      onChange={e => setModalData({...modalData, name: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vehicle Type</Label>
                    <select 
                      value={modalData.type}
                      onChange={e => setModalData({...modalData, type: e.target.value})}
                      className="w-full h-11 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {['Magic', 'Van', 'Auto', 'Bus', 'Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {(activeModal === 'add-vehicle-expense' || activeModal === 'add-building-expense') && (
                <>
                  <div className="space-y-1.5">
                    <Label>Amount (₹)</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="0.00"
                      value={modalData.amount}
                      onChange={e => setModalData({...modalData, amount: e.target.value})}
                      className="h-11"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input 
                      required
                      type="date"
                      value={modalData.date}
                      onChange={e => setModalData({...modalData, date: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Note (Optional)</Label>
                    <Input 
                      placeholder="Any detail..."
                      value={modalData.note}
                      onChange={e => setModalData({...modalData, note: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 h-11 rounded-xl text-white text-sm font-bold transition disabled:opacity-50 shadow-md ${
                    activeModal?.includes('vehicle') ? 'bg-blue-600 hover:bg-blue-700' : 
                    activeModal?.includes('building') ? 'bg-orange-600 hover:bg-orange-700' :
                    'bg-violet-600 hover:bg-violet-700'
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
