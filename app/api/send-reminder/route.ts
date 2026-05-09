import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// ✅ IMPROVED EMAIL TEMPLATE
function generateEmailTemplate({ 
  studentName, 
  className, 
  remainingFee,
  totalFee,
  schoolName = 'Ayushman Educational Academy',
  dueDate 
}: {
  studentName: string
  className: string
  remainingFee: number
  totalFee?: number
  schoolName?: string
  dueDate?: string
}) {
  const percentage = totalFee ? Math.round((remainingFee / totalFee) * 100) : 0
  
  return {
    subject: `⚠️ Fee Payment Reminder - ₹${remainingFee.toLocaleString('en-IN')} Pending`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px #e0e0e0 solid; }
          .fee-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .amount { font-size: 32px; color: #dc2626; font-weight: bold; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
          .btn { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
          .student-info { background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 ${schoolName}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Fee Payment Reminder</p>
          </div>
          
          <div class="content">
            <p>Dear Parent/Guardian,</p>
            <p>We hope this message finds you well. This is a friendly reminder regarding the pending fee payment for your ward.</p>
            
            <div class="student-info">
              <h3>👨‍🎓 Student Details</h3>
              <p><strong>Name:</strong> ${studentName}</p>
              <p><strong>Class:</strong> ${className}</p>
              ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
            </div>
            
            <div class="fee-box">
              <h3>💰 Pending Amount</h3>
              <p class="amount">₹${remainingFee.toLocaleString('en-IN')}</p>
              ${totalFee ? `<p>Total Fee: ₹${totalFee.toLocaleString('en-IN')} (${percentage}% pending)</p>` : ''}
            </div>
            
            <p style="text-align: center;">
              <a href="#" class="btn">💳 Pay Now</a>
            </p>
            
            <p>Please clear the dues at your earliest convenience to avoid any late fee charges.</p>
            <p>If you have already paid, please disregard this reminder.</p>
          </div>
          
          <div class="footer">
            <p><strong>${schoolName}</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }
}

export async function POST(req: Request) {
  try {
    const { 
      to, 
      studentName, 
      className, 
      remainingFee,
      totalFee,
      schoolName,
      dueDate
    } = await req.json()

    // ✅ VALIDATION
    if (!to || !studentName || !remainingFee) {
      return NextResponse.json(
        { error: 'Missing required fields: to, studentName, remainingFee' }, 
        { status: 400 }
      )
    }

    // ✅ GENERATE PROFESSIONAL TEMPLATE
    const emailContent = generateEmailTemplate({
      studentName,
      className,
      remainingFee,
      totalFee,
      schoolName,
      dueDate
    })

    console.log('📧 Sending email to:', to)
    console.log('📝 Subject:', emailContent.subject)

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    if (error) {
      console.error('❌ Email error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Email sent successfully:', data?.id)

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Email sent successfully to ${to}`
    })
  } catch (error: any) {
    console.error('❌ Server error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}