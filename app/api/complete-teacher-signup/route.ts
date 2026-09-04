import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, teacherId, email, role } = await req.json()

    if (!userId || (!teacherId && !email)) {
      return NextResponse.json({ error: 'Missing userId or teacherId/email' }, { status: 400 })
    }

    // Use Service Role Key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('teachers')
      .update({ 
        auth_user_id: userId,
        role: role || 'teacher' 
      })

    if (teacherId) {
      query = query.eq('id', teacherId)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data, error } = await query.select('id, name, role')

    if (error) {
      console.error('Database Update Error:', error)
      return NextResponse.json({ error: error.message, linked: false }, { status: 500 })
    }

    const linked = Array.isArray(data) && data.length > 0

    return NextResponse.json({ success: true, linked })
  } catch (error: any) {
    console.error('API Server Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error', linked: false }, { status: 500 })
  }
}
