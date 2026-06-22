'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import ExpensesClient from './expenses-client'
import { Loader2 } from 'lucide-react'

export default function ExpensesPage() {
  const { academicYear } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const [teachers, teacherPayments, vehicles, vehicleExpenses, buildingExpenses, students] = await Promise.all([
        supabase.from('teachers').select('*').order('name'),
        supabase.from('teacher_payments').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('paid_at', { ascending: false }),
        supabase.from('vehicles').select('*').order('name'),
        supabase.from('vehicle_expenses').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('date', { ascending: false }),
        supabase.from('building_expenses').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('date', { ascending: false }),
        supabase.from('student_fee_summary').select('*').eq('academic_year', academicYear).eq('status', 'active').eq('user_id', user?.id)
      ])

      setData({
        teachers: teachers.data || [],
        teacherPayments: teacherPayments.data || [],
        vehicles: vehicles.data || [],
        vehicleExpenses: vehicleExpenses.data || [],
        buildingExpenses: buildingExpenses.data || [],
        students: students.data || []
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

  return (
    <ExpensesClient
      initialTeachers={data.teachers}
      initialTeacherPayments={data.teacherPayments}
      initialVehicles={data.vehicles}
      initialVehicleExpenses={data.vehicleExpenses}
      initialBuildingExpenses={data.buildingExpenses}
      students={data.students}
    />
  )
}
