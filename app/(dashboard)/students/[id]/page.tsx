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
import DeleteStudentButton from './delete-student-button'
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

  const totalPayable = (student.total_fee || 0) + (student.previous_dues || 0)
  const percent = totalPayable > 0 ? Math.round(((student.total_paid || 0) / totalPayable) * 100) : 0
  const paymentStatus = student.remaining_fee <= 0 ? 'paid' : student.total_paid > 0 ? 'partial' : 'unpaid'

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 pb-24 md:pb-6">

      {/* Header & Main Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/students" className="p-2 rounded-xl hover:bg-zinc-100 transition">
            <ArrowLeft className="w-5 h-5 text-zinc-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-zinc-900">{student.name}</h1>
              <Badge variant={paymentStatus}>{paymentStatus}</Badge>
              {student.status !== 'active' && (
                <Badge variant="outline" className="capitalize">{student.status}</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500 font-medium">{student.class} • {student.mobile || 'No mobile'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <AddPaymentButton
              studentId={student.id}
              remainingFee={student.remaining_fee}
              isPaid={student.remaining_fee <= 0}
            />
          </div>
          <EditStudentButton student={student} />
          <DeleteStudentButton studentId={student.id} studentName={student.name} />
        </div>
      </div>

      {/* Fee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 mb-1">Current Fee</p>
            <p className="text-xl font-bold text-zinc-900">{formatCurrency(student.total_fee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 mb-1">Previous Dues</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(student.previous_dues)}</p>
          </CardContent>
        </Card>
        <PaidCard totalPaid={student.total_paid} remainingFee={student.remaining_fee} />
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-zinc-500 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${student.remaining_fee > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
              {formatCurrency(student.remaining_fee)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Overall Payment Progress (Total: {formatCurrency(totalPayable)})</span>
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
            <div>
              <p className="text-zinc-500">Diary Page Number</p>
              <p className="font-medium text-zinc-900">{student.diary_page_number || '-'}</p>
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
      fatherName={student.guardian_name}
      className={student.class}
      amountPaid={student.total_paid}
      totalFees={student.total_fee}
      previousDues={student.previous_dues}
      remainingFees={student.remaining_fee}
      parentMobile={student.mobile}
      payments={payments || []}
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
                    <th className="text-left py-2 pr-4 text-zinc-500 font-medium whitespace-nowrap">Date</th>
                    <th className="text-left py-2 pr-4 text-zinc-500 font-medium whitespace-nowrap">Amount</th>
                    <th className="text-left py-2 pr-4 text-zinc-500 font-medium whitespace-nowrap">Mode</th>
                    <th className="text-left py-2 text-zinc-500 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {payments?.map(p => (
                    <tr key={p.id} className="border-b border-zinc-50">
                      <td className="py-3 pr-4 text-zinc-600 whitespace-nowrap">
                        {dayjs(p.paid_at).format('DD MMM YYYY')}
                      </td>
                      <td className="py-3 pr-4 font-medium text-green-600 whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 pr-4 text-zinc-600 whitespace-nowrap capitalize">{p.mode}</td>
                      <td className="py-3 text-zinc-400 min-w-[150px]">{p.note || '-'}</td>
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