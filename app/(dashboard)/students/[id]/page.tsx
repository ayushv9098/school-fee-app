import { createClient } from '@/lib/supabase/server'
import { formatCurrency, getProgressPercent } from '@/lib/calculations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import AddPaymentButton from '../[id]/add-payment-button'
import dayjs from 'dayjs'
import ReceiptPDF from '@/components/receipt-pdf'
import EditStudentButton from './edit-student-button'
import PaidCard from './paid-card'

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('student_fee_summary')
    .select('*')
    .eq('id', id)
    .single()

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('student_id', id)
    .order('paid_at', { ascending: false })

  if (!student) {
    return (
      <div className="p-6 text-center text-zinc-400">Student not found</div>
    )
  }

  const percent = getProgressPercent(student.total_fee, student.total_paid)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/students" className="p-2 rounded-xl hover:bg-zinc-100 transition">
          <ArrowLeft className="w-5 h-5 text-zinc-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-zinc-900">{student.name}</h1>
            <Badge variant={student.status}>{student.status}</Badge>
          </div>
          <p className="text-sm text-zinc-500">{student.class} • {student.mobile || 'No mobile'}</p>
        </div>
        <AddPaymentButton
          studentId={student.id}
          remainingFee={student.remaining_fee}
          isPaid={student.status === 'paid'}
        />
      </div>
      <div className="flex items-center gap-2">
  <EditStudentButton student={student} />
  
</div>

      {/* Fee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 mb-1">Total Fee</p>
            <p className="text-2xl font-bold text-zinc-900">{formatCurrency(student.total_fee)}</p>
          </CardContent>
        </Card>
        <PaidCard totalPaid={student.total_paid} remainingFee={student.remaining_fee} />
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${student.remaining_fee > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
              {formatCurrency(student.remaining_fee)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Payment Progress</span>
            <span className="font-medium text-zinc-900">{percent}%</span>
          </div>
          <Progress value={percent} />
        </CardContent>
      </Card>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Details</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500">Guardian</p>
              <p className="font-medium text-zinc-900">{student.guardian_name || '-'}</p>
            </div>
            <div>
              <p className="text-zinc-500">Academic Year</p>
              <p className="font-medium text-zinc-900">{student.academic_year || '-'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-zinc-500">Address</p>
              <p className="font-medium text-zinc-900">{student.address || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Receipt PDF */}
      <ReceiptPDF
  studentName={student.name}
  className={student.class}
  amountPaid={student.total_paid}
  totalFees={student.total_fee}
  remainingFees={student.remaining_fee}
  schoolName="Ayushman Educational Academy"
/>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {payments?.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">No payments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Date</th>
                    <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Amount</th>
                    <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Mode</th>
                    <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map(p => (
                    <tr key={p.id} className="border-b border-zinc-50">
                      <td className="py-3 text-zinc-600 whitespace-nowrap">
                        {dayjs(p.paid_at).format('DD MMM YYYY')}
                      </td>
                      <td className="py-3 font-medium text-green-600 whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 text-zinc-600 whitespace-nowrap capitalize">{p.mode}</td>
                      <td className="py-3 text-zinc-400">{p.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}