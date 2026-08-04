import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { studentId, students, callAll } = body
    
    let targetStudents = []

    if (callAll) {
      // Fetch all defaulters for this user
      const { data, error } = await supabase
        .from('student_fee_summary')
        .select('*')
        .eq('user_id', user.id)
        .gt('remaining_fee', 0)
        .eq('status', 'active')

      if (error) throw error
      targetStudents = data || []
    } else if (students && Array.isArray(students)) {
      targetStudents = students
    } else if (studentId) {
       const { data, error } = await supabase
        .from('student_fee_summary')
        .select('*')
        .eq('id', studentId)
        .eq('user_id', user.id)
        .single()
       
       if (error) throw error
       targetStudents = [data]
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (targetStudents.length === 0) {
      return NextResponse.json({ success: true, message: 'No students to call', total: 0, successful: 0, failed: 0, results: [] })
    }
    
    // Fetch school name from settings
    const { data: schoolSettings } = await supabase
      .from('school_settings')
      .select('school_name')
      .eq('user_id', user.id)
      .single()

    const schoolName = schoolSettings?.school_name || 'Ayushman Educational Academy'

    let successful = 0
    let failed = 0
    const results = []

    const apiKey = process.env.ELEVENLABS_API_KEY
    const agentId = process.env.ELEVENLABS_AGENT_ID
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID

    if (!apiKey || !agentId || !phoneNumberId) {
      return NextResponse.json({ error: 'ElevenLabs configuration missing' }, { status: 500 })
    }

    for (const student of targetStudents) {
      try {
        const mobile = student.mobile
        if (!mobile) {
          failed++
          results.push({ id: student.id, name: student.name, status: 'failed', error: 'No mobile number' })
          continue
        }

        // Format to standard Indian number format +91
        const cleanMobile = mobile.replace(/\D/g, '')
        let formattedMobile = cleanMobile
        
        if (cleanMobile.length === 10) {
          formattedMobile = `+91${cleanMobile}`
        } else if (!cleanMobile.startsWith('+') && !cleanMobile.startsWith('91')) {
           // fallback just prefix +91 if length is slightly off, though ideally it should be exact.
           formattedMobile = `+91${cleanMobile}`
        } else if (!cleanMobile.startsWith('+')) {
           formattedMobile = `+${cleanMobile}`
        }

        const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agent_id: agentId,
            agent_phone_number_id: phoneNumberId,
            to_number: formattedMobile,
            dynamic_variables: {
              student_name: student.name || '',
              guardian_name: student.guardian_name || 'Parent',
              class_name: student.class || '',
              remaining_fee: student.remaining_fee || 0,
              total_fee: student.total_fee || 0,
              school_name: schoolName
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error(`Call failed for ${student.name}:`, errorData)
          failed++
          results.push({ id: student.id, name: student.name, status: 'failed', error: 'API Error' })
        } else {
          successful++
          results.push({ id: student.id, name: student.name, status: 'success' })
        }

        // Rate limit: 1 second delay between calls
        await delay(1000)
      } catch (err: any) {
        console.error(`Error calling ${student.name}:`, err)
        failed++
        results.push({ id: student.id, name: student.name, status: 'failed', error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      total: targetStudents.length,
      successful,
      failed,
      results
    })

  } catch (error: any) {
    console.error('Call reminder API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
