'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, IndianRupee, TrendingUp, AlertCircle, Eye, EyeOff, BarChart3, Wallet } from 'lucide-react'
import Link from 'next/link'
import CollapsibleSection from '@/components/ui/collapsible-section'

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('student_fee_summary').select('*').then(({ data }) => {
      setStudents(data || [])
    })
    supabase.from('expenses').select('amount').then(({ data }) => {
      setExpenses(data || [])
    })
  }, [])

  const totalStudents = students.length
  const totalFees = students.reduce((a, s) => a + s.total_fee, 0)
  const totalCollected = students.reduce((a, s) => a + s.total_paid, 0)
  const totalPending = students.reduce((a, s) => a + s.remaining_fee, 0)
  const totalExpenses = expenses.reduce((a, e) => a + Number(e.amount), 0)
  const netProfit = totalCollected - totalExpenses

  const classes = [...new Set(students.map(s => s.class))]
  const classStats = classes.map(cls => {
    const cl = students.filter(s => s.class === cls)
    const fee = cl.reduce((a, s) => a + s.total_fee, 0)
    const paid = cl.reduce((a, s) => a + s.total_paid, 0)
    return {
      name: cls,
      count: cl.length,
      totalFee: fee,
      collected: paid,
      pending: fee - paid,
      percent: getProgressPercent(fee, paid)
    }
  })

  const mask = '₹ ••••••'

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500">Ayushman Educational Academy</p>
        </div>
        <button
          onClick={() => setHidden(!hidden)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${
            hidden
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {hidden ? 'Hidden' : 'Hide Amounts'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/students">
          <Card className="hover:shadow-md transition cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-500">Total Students</span>
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-900">{totalStudents}</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">Total Fees</span>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {hidden ? mask : formatCurrency(totalFees)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-500">Collected</span>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {hidden ? mask : formatCurrency(totalCollected)}
            </p>
          </CardContent>
        </Card>

        <Link href="/students?status=partial">
          <Card className="hover:shadow-md transition cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-500">Pending</span>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {hidden ? mask : formatCurrency(totalPending)}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/expenses">
          <Card className={`hover:shadow-md transition cursor-pointer ${netProfit >= 0 ? 'border-green-100' : 'border-red-100'}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-500">Net Profit</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Wallet className={`w-4 h-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hidden ? mask : formatCurrency(netProfit)}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Class wise */}
      <CollapsibleSection 
        title="Class-wise Overview"
        icon={<BarChart3 size={20} />}
        defaultOpen={true}
      >
        {classStats.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-400 text-sm">No students yet — add students first</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            {classStats.map(cls => (
              <Link key={cls.name} href={`/students?class=${cls.name}`}>
                <Card className="hover:shadow-md transition cursor-pointer border-zinc-100">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{cls.name}</CardTitle>
                      <span className="text-xs text-zinc-500">{cls.count} students</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 space-y-3">
                    <Progress value={cls.percent} />
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600 font-medium">
                        {hidden ? mask : formatCurrency(cls.collected)}
                      </span>
                      <span className="text-red-500 font-medium">
                        {hidden ? mask : formatCurrency(cls.pending)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{cls.percent}% paid</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}