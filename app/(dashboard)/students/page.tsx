import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CLASSES } from '@/lib/constants'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('student_fee_summary').select('*')

  if (params.class) query = query.eq('class', params.class)
  if (params.status) query = query.eq('status', params.status)
  if (params.search) query = query.ilike('name', `%${params.search}%`)

  const { data: students } = await query.order('name')

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Students</h1>
          <p className="text-sm text-zinc-500">{students?.length || 0} total students</p>
        </div>
        <Link
          href="/students/add"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">Add Student</span>
          <span className="sm:hidden">Add student</span>
        </Link>
      </div>

      {/* Filters */}
      <form className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search by student name..."
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="flex gap-3">
          <select
            name="class"
            defaultValue={params.class}
            className="flex-1 h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status}
            className="flex-1 h-11 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button
            type="submit"
            className="h-11 px-5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left p-4 text-zinc-500 font-medium">Name</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Class</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Mobile</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Total Fee</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Paid</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Remaining</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Status</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {students?.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-zinc-400">
                      No students found
                    </td>
                  </tr>
                )}
                {students?.map(s => (
                  <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                    <td className="p-4">
                      <Link href={`/students/${s.id}`} className="font-medium text-zinc-900 hover:text-violet-600">
                        {s.name}
                      </Link>
                    </td>
                    <td className="p-4 text-zinc-600 whitespace-nowrap">{s.class}</td>
                    <td className="p-4 text-zinc-600 whitespace-nowrap">{s.mobile || '-'}</td>
                    <td className="p-4 text-zinc-600 whitespace-nowrap">{formatCurrency(s.total_fee)}</td>
                    <td className="p-4 text-green-600 font-medium whitespace-nowrap">{formatCurrency(s.total_paid)}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={s.remaining_fee > 0 ? 'text-red-500 font-medium' : 'text-zinc-400'}>
                        {formatCurrency(s.remaining_fee)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={s.status}>{s.status}</Badge>
                    </td>
                    <td className="p-4 min-w-24">
                      <Progress value={Math.round((s.total_paid / s.total_fee) * 100)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {students?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-zinc-400 text-sm">
              No students found
            </CardContent>
          </Card>
        )}
        {students?.map(s => (
          <Link key={s.id} href={`/students/${s.id}`}>
            <Card className="hover:shadow-md transition">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-zinc-900">{s.name}</p>
                  <Badge variant={s.status}>{s.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>{s.class}</span>
                  <span>{s.mobile || '-'}</span>
                </div>
                <Progress value={Math.round((s.total_paid / s.total_fee) * 100)} />
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-green-600">Paid: {formatCurrency(s.total_paid)}</span>
                  <span className="text-red-500">Due: {formatCurrency(s.remaining_fee)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  )
}