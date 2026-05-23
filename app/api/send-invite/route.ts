import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is missing')
      return NextResponse.json({ error: 'Email service not configured (API Key missing)' }, { status: 500 })
    }

    const { to, teacherName, adminEmail, teacherId } = await req.json()
    
    // Get origin: Priority 1: ENV, Priority 2: Headers, Priority 3: req.url
    const host = req.headers.get('host')
    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const origin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : new URL(req.url).origin)
    
    const inviteLink = `${origin}/teacher-signup?email=${encodeURIComponent(to)}&teacher_id=${teacherId}`
    
    console.log(`📧 Attempting to send invite to ${to}. Link: ${inviteLink}`)

    try {
      const { data, error } = await resend.emails.send({
        from: 'School Fee Manager <onboarding@resend.dev>',
        to,
        subject: 'Invitation to Join School Attendance System',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #7c3aed;">Welcome, ${teacherName}!</h2>
            <p>You have been invited by <strong>${adminEmail}</strong> to join the <strong>Ayushman Educational Academy</strong> as a teacher.</p>
            <p>Please click the button below to create your account and start marking your attendance.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Create Account</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link: ${inviteLink}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">© 2026 Ayushman Educational Academy. Fee Management System.</p>
          </div>
        `,
      })

      if (error) {
        console.error('❌ Resend API Error:', error)
        return NextResponse.json({ error: error.message, inviteLink }, { status: 500 })
      }

      console.log('✅ Invite email sent successfully:', data?.id)
      return NextResponse.json({ success: true, data, inviteLink })
    } catch (emailErr: any) {
      console.error('❌ Resend Exception:', emailErr)
      return NextResponse.json({ error: emailErr.message, inviteLink }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Server Error in send-invite:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
