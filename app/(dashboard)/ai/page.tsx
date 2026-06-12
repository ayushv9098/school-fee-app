'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Users, IndianRupee, AlertCircle, CheckCircle, BarChart3, AlertTriangle, Loader2 } from 'lucide-react'
import AIChat from './ai-chat'
import DefaulterRow from './defaulter-row'
import CollapsibleSection from '@/components/ui/collapsible-section'
import { useSession } from '@/lib/session-context'

export default function AIPage() {
  const { academicYear } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const [studentsRes, paymentsRes, subscriptionRes, schoolSettingsRes, studentsWithEmailRes] = await Promise.all([
        supabase.from('student_fee_summary').select('*').eq('academic_year', academicYear),
        supabase.from('payments').select('*, student:students!inner(academic_year)').eq('students.academic_year', academicYear).order('paid_at', { ascending: false }),
        supabase.from('subscriptions').select('*').eq('user_id', user?.id).eq('status', 'active').gte('expires_at', new Date().toISOString()).maybeSingle(),
        supabase.from('school_settings').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('students').select('id, name, email').eq('user_id', user?.id).eq('academic_year', academicYear)
      ])

      setData({
        students: studentsRes.data || [],
        payments: paymentsRes.data || [],
        isSubscribed: !!subscriptionRes.data,
        schoolSettings: schoolSettingsRes.data,
        studentsWithEmail: studentsWithEmailRes.data || []
      })
      setLoading(false)
    }

    fetchData()
  }, [academicYear])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const { students, payments, isSubscribed, schoolSettings, studentsWithEmail } = data

  const emailMapByName = new Map(
    (studentsWithEmail || [])
      .filter((s: any) => s.email)
      .map((s: any) => [s.name?.toLowerCase()?.trim(), s.email])
  )

  const totalStudents = students?.length || 0
  const totalFees = students?.reduce((a: number, s: any) => a + s.total_fee, 0) || 0
  const totalCollected = students?.reduce((a: number, s: any) => a + s.total_paid, 0) || 0
  const totalPending = students?.reduce((a: number, s: any) => a + s.remaining_fee, 0) || 0
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0
  const paidStudents = students?.filter((s: any) => s.remaining_fee <= 0).length || 0
  const unpaidStudents = students?.filter((s: any) => s.total_paid === 0).length || 0
  const partialStudents = students?.filter((s: any) => s.total_paid > 0 && s.remaining_fee > 0).length || 0

  const defaultersRaw = students
    ?.filter((s: any) => s.remaining_fee > 0)
    ?.sort((a: any, b: any) => b.remaining_fee - a.remaining_fee)
    ?.slice(0, 5) || []

  const defaulters = defaultersRaw.map((defaulter: any) => ({
    ...defaulter,
    email: emailMapByName.get(defaulter.name?.toLowerCase()?.trim()) || null
  }))

  const classes = [...new Set(students?.map((s: any) => s.class) || [])]
  const classStats = classes.map((cls: any) => {
    const cl = students?.filter((s: any) => s.class === cls) || []
    const fee = cl.reduce((a: number, s: any) => a + s.total_fee, 0)
    const paid = cl.reduce((a: number, s: any) => a + s.total_paid, 0)
    return {
      name: cls,
      count: cl.length,
      totalFee: fee,
      collected: paid,
      percent: getProgressPercent(fee, paid)
    }
  }).sort((a, b) => b.percent - a.percent)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">AI Insights</h1>
          <p className="text-sm text-zinc-500">Smart analysis for {academicYear}</p>
        </div>
        <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          {academicYear}
        </div>
      </div>

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
              <IndianRupee className="w-4 h-4 text-indigo-500" />
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

      <CollapsibleSection 
        title="Class-wise Collection"
        icon={<BarChart3 size={20} />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          {classStats.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-4">No data available for {academicYear}</p>
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
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        title="Top Defaulters"
        icon={<AlertTriangle size={20} />}
        defaultOpen={true}
      >
        {defaulters.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-4">No pending fees!</p>
        )}
        <div className="space-y-3">
          {defaulters.map((s: any, i: number) => (
            <DefaulterRow key={s.id} student={s} index={i} />
          ))}
        </div>
      </CollapsibleSection>

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
        students={students}
        isSubscribed={isSubscribed}
        schoolName={schoolSettings?.school_name || 'My School'}
        schoolAddress={schoolSettings?.address || ''}
        schoolMobile={schoolSettings?.mobile || ''}
      />
    </div>
  )
}
