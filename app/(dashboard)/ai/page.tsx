import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Users, IndianRupee, AlertCircle, CheckCircle } from 'lucide-react'
import AIChat from './ai-chat'
import DefaulterRow from './defaulter-row'

export default async function AIPage() {
  const supabase = await createClient()
  const { data: students } = await supabase.from('student_fee_summary').select('*')
  const { data: payments } = await supabase.from('payments').select('*').order('paid_at', { ascending: false })

  const totalStudents = students?.length || 0
  const totalFees = students?.reduce((a, s) => a + s.total_fee, 0) || 0
  const totalCollected = students?.reduce((a, s) => a + s.total_paid, 0) || 0
  const totalPending = students?.reduce((a, s) => a + s.remaining_fee, 0) || 0
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0
  const paidStudents = students?.filter(s => s.status === 'paid').length || 0
  const unpaidStudents = students?.filter(s => s.status === 'unpaid').length || 0
  const partialStudents = students?.filter(s => s.status === 'partial').length || 0

  // Top defaulters
  const defaulters = students
    ?.filter(s => s.remaining_fee > 0)
    ?.sort((a, b) => b.remaining_fee - a.remaining_fee)
    ?.slice(0, 5) || []

  // Class wise stats
  const classes = [...new Set(students?.map(s => s.class) || [])]
  const classStats = classes.map(cls => {
    const cl = students?.filter(s => s.class === cls) || []
    const fee = cl.reduce((a, s) => a + s.total_fee, 0)
    const paid = cl.reduce((a, s) => a + s.total_paid, 0)
    return {
      name: cls,
      count: cl.length,
      totalFee: fee,
      collected: paid,
      percent: getProgressPercent(fee, paid)
    }
  }).sort((a, b) => b.percent - a.percent)

  // Monthly payments
  const monthlyData: Record<string, number> = {}
  payments?.forEach(p => {
    const month = new Date(p.paid_at).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    monthlyData[month] = (monthlyData[month] || 0) + p.amount
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">AI Insights</h1>
        <p className="text-sm text-zinc-500">Smart analysis of your fee collection</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Collection Rate</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{collectionRate}%</p>
            <Progress value={collectionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Total Collected</span>
              <IndianRupee className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Total Pending</span>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Total Students</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-900">{totalStudents}</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Fully Paid</p>
              <p className="text-2xl font-bold text-green-600">{paidStudents}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Partial</p>
              <p className="text-2xl font-bold text-yellow-600">{partialStudents}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Unpaid</p>
              <p className="text-2xl font-bold text-red-600">{unpaidStudents}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class wise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class-wise Collection</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          {classStats.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-4">No data available</p>
          )}
          {classStats.map(cls => (
            <div key={cls.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-900">{cls.name}</span>
                <span className="text-zinc-500">{cls.percent}% • {cls.count} students</span>
              </div>
              <Progress value={cls.percent} />
              <div className="flex justify-between text-xs">
                <span className="text-green-600">{formatCurrency(cls.collected)}</span>
                <span className="text-red-500">{formatCurrency(cls.totalFee - cls.collected)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Defaulters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Defaulters</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {defaulters.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-4">No pending fees!</p>
          )}
          <div className="space-y-3">
          {defaulters.map((s, i) => (
  <DefaulterRow key={s.id} student={s} index={i} />
))}
          </div>
        </CardContent>
      </Card>

    

      {/* AI Chat */}
      <AIChat
        totalStudents={totalStudents}
        totalFees={totalFees}
        totalCollected={totalCollected}
        totalPending={totalPending}
        collectionRate={collectionRate}
        paidStudents={paidStudents}
        unpaidStudents={unpaidStudents}
        partialStudents={partialStudents}
        classStats={classStats}
        defaulters={defaulters}
      />
    </div>
  )
}