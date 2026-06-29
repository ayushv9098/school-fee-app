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
    const appInviteLink = `teacherapae://signup?email=${encodeURIComponent(to)}&teacher_id=${teacherId}`
    
    console.log(`📧 Attempting to send invite to ${to}. Link: ${inviteLink}`)

    try {
      const { data, error } = await resend.emails.send({
        from: 'Ayushman Academy <onboarding@resend.dev>',
        to,
        subject: 'Join Ayushman Educational Academy - Teacher Portal',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: #7c3aed; padding: 15px; border-radius: 16px;">
                <img src="https://img.icons8.com/ios-filled/50/ffffff/graduation-cap.png" width="30" height="30" alt="logo" />
              </div>
            </div>
            
            <h2 style="color: #18181b; text-align: center; margin-top: 0;">Welcome, ${teacherName}!</h2>
            <p style="color: #52525b; line-height: 1.6; text-align: center;">You have been invited to join the <strong>Ayushman Educational Academy</strong> as a teacher.</p>
            
            <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 20px; margin: 25px 0;">
              <h3 style="color: #7c3aed; margin-top: 0; font-size: 16px;">How to set up your account:</h3>
              <ol style="color: #52525b; padding-left: 20px; margin-bottom: 0;">
                <li>Download the App: <a href="https://expo.dev/accounts/ayushv9098/projects/teacher-mobile-app/builds/99201c9a-e96d-4d41-bc83-4618880d8cf3" target="_blank" style="color: #7c3aed;">Click Here to Download APK</a></li>
                <li>Install the App on your Android phone.</li>
                <li>Click the <strong>"Open in App"</strong> button below to set your password.</li>
                <li>Set your password and start marking attendance!</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${appInviteLink}" style="display: block; background-color: #7c3aed; color: white; padding: 14px 24px; text-decoration: none; border-radius: 12px; font-weight: bold; margin-bottom: 12px;">Open in App (Recommended)</a>
              <a href="${inviteLink}" style="display: block; color: #7c3aed; font-size: 14px; text-decoration: underline;">Or use Web Portal instead</a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px;">
              © 2026 Ayushman Educational Academy. All rights reserved.
            </p>
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
