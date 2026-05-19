'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/calculations'
import dayjs from 'dayjs'
import { Wallet, TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import AddExpenseButton from './add-expense-button'

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  note: string
}

interface Student {
  total_paid: number
}

export default function ExpensesClient({
  initialExpenses,
  students,
}: {
  initialExpenses: Expense[]
  students: Student[]
}) {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()))
  const [selectedCategory, setSelectedCategory] = useState('')

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
  const CATEGORIES = ['Salary', 'Fuel', 'Electricity', 'Rent', 'Maintenance', 'Gas', 'Other']

  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter(e => {
      const d = dayjs(e.date)
      const monthMatch = d.format('MM') === selectedMonth && d.format('YYYY') === selectedYear
      const categoryMatch = selectedCategory ? e.category === selectedCategory : true
      return monthMatch && categoryMatch
    })
  }, [initialExpenses, selectedMonth, selectedYear, selectedCategory])

  const totalCollected = students.reduce((a, s) => a + (s.total_paid || 0), 0)
  const totalExpensesAllTime = initialExpenses.reduce((a, e) => a + Number(e.amount), 0)
  const netProfit = totalCollected - totalExpensesAllTime

  const thisMonthExpenses = filteredExpenses.reduce((a, e) => a + Number(e.amount), 0)

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Expenses</h1>
          <p className="text-sm text-zinc-500">Manage your school expenses</p>
        </div>
        <AddExpenseButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-red-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Total Expenses</span>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpensesAllTime)}</p>
          </CardContent>
        </Card>

        <Card className={netProfit >= 0 ? "border-green-100" : "border-red-100"}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Net Profit</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`w-4 h-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">This Month Expenses</span>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(thisMonthExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 flex-1 md:flex-none md:w-48"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filteredExpenses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-zinc-400 text-sm">
              No expenses found for this period
            </CardContent>
          </Card>
        )}

        {filteredExpenses.length > 0 && (
          <div className="hidden md:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left p-4 text-zinc-500 font-medium">Date</th>
                      <th className="text-left p-4 text-zinc-500 font-medium">Title</th>
                      <th className="text-left p-4 text-zinc-500 font-medium">Category</th>
                      <th className="text-right p-4 text-zinc-500 font-medium">Amount</th>
                      <th className="text-left p-4 text-zinc-500 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(e => (
                      <tr key={e.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                        <td className="p-4 text-zinc-600 whitespace-nowrap">{dayjs(e.date).format('DD MMM YYYY')}</td>
                        <td className="p-4 font-medium text-zinc-900">{e.title}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-4 text-red-600 font-bold text-right whitespace-nowrap">{formatCurrency(e.amount)}</td>
                        <td className="p-4 text-zinc-500 max-w-[200px] truncate">{e.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        <div className="md:hidden space-y-3">
          {filteredExpenses.map(e => (
            <Card key={e.id} className="hover:shadow-md transition">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 truncate">{e.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <p className="text-xs text-zinc-500">{dayjs(e.date).format('DD MMM YYYY')}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-red-600 flex-shrink-0">{formatCurrency(e.amount)}</p>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                    {e.category}
                  </span>
                  {e.note && <p className="text-xs text-zinc-500 truncate max-w-[150px]">{e.note}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
