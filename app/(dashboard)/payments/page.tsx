import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/calculations'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import dayjs from 'dayjs'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, students(name, class)')
    .order('paid_at', { ascending: false })

  const filtered = params.search
    ? payments?.filter(p =>
        p.students?.name?.toLowerCase().includes(params.search!.toLowerCase())
      )
    : payments

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Payments</h1>
        <p className="text-sm text-zinc-500">{filtered?.length || 0} payments</p>
      </div>

      {/* Search */}
      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Student name search karo..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </form>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left p-4 text-zinc-500 font-medium">Student</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Class</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Amount</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Mode</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Date</th>
                  <th className="text-left p-4 text-zinc-500 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400">
                      Koi payment nahi mili
                    </td>
                  </tr>
                )}
                {filtered?.map(p => (
                  <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition">
                    <td className="p-4 font-medium text-zinc-900 whitespace-nowrap">
                      {p.students?.name || '-'}
                    </td>
                    <td className="p-4 text-zinc-600 whitespace-nowrap">{p.students?.class || '-'}</td>
                    <td className="p-4 font-medium text-green-600 whitespace-nowrap">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-4 text-zinc-600 whitespace-nowrap capitalize">{p.mode}</td>
                    <td className="p-4 text-zinc-600 whitespace-nowrap">
                      {dayjs(p.paid_at).format('DD MMM YYYY')}
                    </td>
                    <td className="p-4 text-zinc-400">{p.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered?.length === 0 && (
          <Card>
            <div className="p-8 text-center text-zinc-400 text-sm">Koi payment nahi mili</div>
          </Card>
        )}
        {filtered?.map(p => (
          <Card key={p.id}>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-zinc-900">{p.students?.name || '-'}</p>
                <p className="font-bold text-green-600">{formatCurrency(p.amount)}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span>{p.students?.class || '-'}</span>
                <span className="capitalize">{p.mode}</span>
              </div>
              <p className="text-xs text-zinc-400">{dayjs(p.paid_at).format('DD MMM YYYY')}</p>
              {p.note && <p className="text-xs text-zinc-400">{p.note}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}