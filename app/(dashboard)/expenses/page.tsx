import { createClient } from '@/lib/supabase/server'
import ExpensesClient from './expenses-client'

export default async function ExpensesPage() {
  const supabase = await createClient()

  // Fetch all expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  // Fetch all students to calculate total collected for net profit
  const { data: students } = await supabase
    .from('student_fee_summary')
    .select('*')

  return (
    <ExpensesClient
      initialExpenses={expenses || []}
      students={students || []}
    />
  )
}
