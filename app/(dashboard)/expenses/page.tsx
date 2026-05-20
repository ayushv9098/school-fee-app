import { createClient } from '@/lib/supabase/server'
import ExpensesClient from './expenses-client'

export default async function ExpensesPage() {
  const supabase = await createClient()

  // 1. Fetch Teachers
  const { data: teachers } = await supabase
    .from('teachers')
    .select('*')
    .order('name')

  // 2. Fetch Teacher Payments (All for history)
  const { data: teacherPayments } = await supabase
    .from('teacher_payments')
    .select('*')
    .order('paid_at', { ascending: false })

  // 3. Fetch Vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')

  // 4. Fetch Vehicle Expenses (All for history)
  const { data: vehicleExpenses } = await supabase
    .from('vehicle_expenses')
    .select('*')
    .order('date', { ascending: false })

  // 5. Fetch Building Expenses (All for history)
  const { data: buildingExpenses } = await supabase
    .from('building_expenses')
    .select('*')
    .order('date', { ascending: false })

  // 6. Fetch Students (for Net Profit calculation)
  const { data: students } = await supabase
    .from('student_fee_summary')
    .select('*')

  return (
    <ExpensesClient
      initialTeachers={teachers || []}
      initialTeacherPayments={teacherPayments || []}
      initialVehicles={vehicles || []}
      initialVehicleExpenses={vehicleExpenses || []}
      initialBuildingExpenses={buildingExpenses || []}
      students={students || []}
    />
  )
}
