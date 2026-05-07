import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/calculations'
import { Card, CardContent } from '@/components/ui/card'
import dayjs from 'dayjs'
import PaymentsClient from './payments-client'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; month?: string; year?: string; week?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all payments
  const { data: allPayments } = await supabase
    .from('payments')
    .select('*, students(name, class, total_fee)')
    .order('paid_at', { ascending: false })

  // Fetch all students for total pending
  const { data: students } = await supabase
    .from('student_fee_summary')
    .select('*')

  return (
    <PaymentsClient
      allPayments={allPayments || []}
      students={students || []}
    />
  )
}