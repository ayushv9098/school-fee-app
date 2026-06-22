'use client'

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
  const [filter, setFilter] = useState<'month' | 'week' | 'year'>('month')
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [selectedWeek, setSelectedWeek] = useState(String(dayjs().isoWeek()))

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const years = ['2024', '2025', '2026', '2027']
  const weeks = Array.from({ length: 52 }, (_, i) => String(i + 1).padStart(2, '0'))

  const filteredPayments = useMemo(() => {
    let result = allPayments

    if (filter === 'month') {
      result = result.filter(p => {
        const d = dayjs(p.paid_at)
        return d.format('MM') === selectedMonth && d.format('YYYY') === selectedYear
      })
    } else if (filter === 'year') {
      result = result.filter(p => dayjs(p.paid_at).format('YYYY') === selectedYear)
    } else if (filter === 'week') {
      result = result.filter(p => {
        const d = dayjs(p.paid_at)
        return String(d.isoWeek()).padStart(2, '0') === selectedWeek && d.format('YYYY') === selectedYear
      })
    }

    if (search) {
      result = result.filter(p =>
        p.students?.name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    return result
  }, [allPayments, filter, selectedMonth, selectedYear, selectedWeek, search])

  const totalCollected = filteredPayments.reduce((a, p) => a + p.amount, 0)
  const totalPending = students.reduce((a, s) => a + s.remaining_fee, 0)
  const totalFees = students.reduce((a, s) => a + s.total_fee, 0)
  const uniqueStudents = new Set(filteredPayments.map(p => p.students?.name)).size

  const filterLabel = () => {
    if (filter === 'month') return `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`
    if (filter === 'year') return `Year ${selectedYear}`
    return `Week ${selectedWeek}, ${selectedYear}`
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Payments</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{filterLabel()}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
        {(['month', 'week', 'year'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              filter === f
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Date Selectors */}
      <div className="flex gap-3 flex-wrap">
        {filter !== 'year' && filter !== 'week' && (
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}
        {filter === 'week' && (
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(e.target.value)}
            className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {weeks.map(w => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        )}
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          placeholder="Search by student name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
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