import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, teacherId, role } = await req.json()

    if (!userId || !teacherId) {
      return NextResponse.json({ error: 'Missing userId or teacherId' }, { status: 400 })
    }

    // Use Service Role Key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('teachers')
      .update({ 
        auth_user_id: userId,
        role: role || 'teacher' 
      })
      .eq('id', teacherId)

    if (error) {
      console.error('Database Update Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Server Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
