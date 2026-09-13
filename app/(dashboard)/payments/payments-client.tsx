'use client'
import { CustomSelect } from '@/components/ui/custom-select'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/calculations'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { Search, TrendingUp, TrendingDown, CreditCard, Users } from 'lucide-react'

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)

interface Payment {
  id: string
  amount: number
  mode: string
  note: string
  paid_at: string
  students: { name: string; class: string; total_fee: number }
}

interface Student {
  id: string
  name: string
  class: string
  total_fee: number
  total_paid: number
  remaining_fee: number
  status: string
}

export default function PaymentsClient({
  allPayments,
  students,
}: {
  allPayments: Payment[]
  students: Student[]
}) {
  const [filterMonth, setFilterMonth] = useState('all')
  const [search, setSearch] = useState('')

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>()
    allPayments.forEach(p => {
      monthsSet.add(dayjs(p.paid_at).format('YYYY-MM'))
    })
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(m => ({
      value: m,
      label: dayjs(m + '-01').format('MMMM YYYY')
    }))
  }, [allPayments])

  const filteredPayments = useMemo(() => {
    let result = allPayments

    if (filterMonth !== 'all') {
      result = result.filter(p => dayjs(p.paid_at).format('YYYY-MM') === filterMonth)
    }

    if (search) {
      result = result.filter(p =>
        p.students?.name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return result
  }, [allPayments, filterMonth, search])

  const totalCollected = filteredPayments.reduce((a, p) => a + p.amount, 0)
  const totalPending = students.reduce((a, s) => a + s.remaining_fee, 0)
  const totalFees = students.reduce((a, s) => a + s.total_fee, 0)
  const uniqueStudents = new Set(filteredPayments.map(p => p.students?.name)).size

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Filter Bar */}
      <div className="flex gap-3 items-center w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            placeholder="Search by student name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        
        <CustomSelect
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="h-11 px-3 w-[160px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
        >
          <option value="all">Entire Session</option>
          {availableMonths.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </CustomSelect>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Collected</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
            <p className="text-xs text-zinc-400 mt-1">{filteredPayments.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Total Pending</span>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xl font-bold text-red-500">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-zinc-400 mt-1">Overall pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Students Paid</span>
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{uniqueStudents}</p>
            <p className="text-xs text-zinc-400 mt-1">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Collection Rate</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0}%
            </p>
            <p className="text-xs text-zinc-400 mt-1">Of total fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-zinc-400 text-sm">
              No payments found for this period
            </CardContent>
          </Card>
        )}
        {filteredPayments.map(p => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{p.students?.name || '-'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{p.students?.class || '-'} • {p.mode} • {dayjs(p.paid_at).format('DD MMM YYYY')}</p>
                  {p.note && <p className="text-xs text-zinc-400 mt-0.5">{p.note}</p>}
                </div>
                <p className="text-lg font-bold text-green-600">{formatCurrency(p.amount)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}

