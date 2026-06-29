import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, password, name, subject, mobile, address, monthly_salary, shift_start_time, shift_end_time, user_id } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, Email, and Password are required' }, { status: 400 })
    }

    // Use Service Role Key to bypass RLS and use Admin Auth API
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email so they can log in instantly
      user_metadata: { name }
    })

    if (authError) {
      console.error('Auth Creation Error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Insert into teachers table
    const { data: teacherData, error: dbError } = await supabaseAdmin
      .from('teachers')
      .insert({
        user_id, // The admin's user ID
        auth_user_id: authData.user.id, // The new teacher's auth ID
        name,
        subject,
        email,
        mobile: mobile || null,
        address: address || null,
        monthly_salary: Number(monthly_salary),
        shift_start_time: shift_start_time || null,
        shift_end_time: shift_end_time || null,
        role: 'teacher'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database Insert Error:', dbError)
      // If DB insert fails, we should ideally delete the auth user to prevent dangling users,
      // but for now we just return the error.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, teacher: teacherData })
  } catch (error: any) {
    console.error('API Server Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
