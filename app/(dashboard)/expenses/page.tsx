'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSession } from '@/lib/session-context'
import ExpensesClient from './expenses-client'
import { Loader2 } from 'lucide-react'
import { getSafeInitialCache, setSafeCache, markAppHydrated } from '@/lib/cache-utils'

export default function ExpensesPage() {
  const { academicYear } = useSession()
  const [data, setData] = useState<any>(() => getSafeInitialCache(`expenses-cache-${academicYear}`))
  const [loading, setLoading] = useState<boolean>(() => !getSafeInitialCache(`expenses-cache-${academicYear}`))
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true
    markAppHydrated()

    const cacheKey = `expenses-cache-${academicYear}`

    if (!data) {
      try {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          setData(parsed)
          setLoading(false)
        }
      } catch {}
    }

    async function fetchData() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        let user = session?.user || null
        if (!user) {
          const userRes = await supabase.auth.getUser()
          user = userRes.data?.user || null
        }

        const [teachers, teacherPayments, vehicles, vehicleExpenses, buildingExpenses, students] = await Promise.all([
          supabase.from('teachers').select('*').order('name'),
          supabase.from('teacher_payments').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('paid_at', { ascending: false }),
          supabase.from('vehicles').select('*').order('name'),
          supabase.from('vehicle_expenses').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('date', { ascending: false }),
          supabase.from('building_expenses').select('*').or(`academic_year.eq.${academicYear},academic_year.is.null`).order('date', { ascending: false }),
          supabase.from('student_fee_summary').select('*').eq('academic_year', academicYear).eq('status', 'active').eq('user_id', user?.id)
        ])

        if (!isCurrent) return

        const freshData = {
          teachers: teachers.data || [],
          teacherPayments: teacherPayments.data || [],
          vehicles: vehicles.data || [],
          vehicleExpenses: vehicleExpenses.data || [],
          buildingExpenses: buildingExpenses.data || [],
          students: students.data || []
        }

        setData(freshData)
        setLoading(false)
        setSafeCache(cacheKey, freshData)
      } catch (err) {
        if (isCurrent) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isCurrent = false
    }
  }, [academicYear, refreshKey])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!data) return null

  return (
    <ExpensesClient
      initialTeachers={data.teachers}
      initialTeacherPayments={data.teacherPayments}
      initialVehicles={data.vehicles}
      initialVehicleExpenses={data.vehicleExpenses}
      initialBuildingExpenses={data.buildingExpenses}
      students={data.students}
      onRefresh={() => setRefreshKey(prev => prev + 1)}
    />
  )
}
