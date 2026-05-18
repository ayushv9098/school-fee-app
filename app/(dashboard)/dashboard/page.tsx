import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users, IndianRupee, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import CollapsibleSection from '@/components/ui/collapsible-section'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: students } = await supabase.from('student_fee_summary').select('*')

  const totalStudents = students?.length || 0
  const totalFees = students?.reduce((a, s) => a + s.total_fee, 0) || 0
  const totalCollected = students?.reduce((a, s) => a + s.total_paid, 0) || 0
  const totalPending = students?.reduce((a, s) => a + s.remaining_fee, 0) || 0

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
      pending: fee - paid,
      percent: getProgressPercent(fee, paid)
    }
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500">Ayushman Educational Academy</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(totalFees)}</p>
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
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
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
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <CollapsibleSection 
        title="Class-wise Overview"
        icon={<BarChart3 size={20} />}
        defaultOpen={true}
      >
        {classStats.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-zinc-400 text-sm">No students right now — please add a student first.</p>
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
                        {formatCurrency(cls.collected)}
                      </span>
                      <span className="text-red-500 font-medium">
                        {formatCurrency(cls.pending)}
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