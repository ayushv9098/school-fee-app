import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { context, schoolName, schoolAddress, schoolMobile } = body
    
    let messagesArray = body.messages
    if (!messagesArray && body.message) {
      messagesArray = [{ role: 'user', content: body.message }]
    }
    if (!Array.isArray(messagesArray)) {
      messagesArray = []
    }

    let finalContext = context
    if (!finalContext) {
      const { createClient } = require('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: students } = await supabase.from('student_fee_summary').select('*').eq('user_id', user.id).eq('status', 'active')
        if (students) {
          finalContext = `Student List (Name|Class|Total|Paid|Due|Mobile|Guardian):\n` +
            students.map((s: any) => `${s.name}|${s.class}|${s.total_fee}|${s.total_paid}|${s.remaining_fee}|${s.mobile || 'N/A'}|${s.guardian_name || 'N/A'}`).join('\n')
        }
      }
    }

    const systemPrompt = `
You are the "Ayushman School & Software Expert Assistant". Your job is to help the school owner/admin manage their school, track student fees, answer questions about specific students, and provide guidance on ANY feature of this website/software.

====================================
🤖 YOUR IDENTITY & BEHAVIOR
====================================
- Roles: Software Expert, School Management Expert, Fee Collection Assistant, and Administrative Support.
- Tone: Helpful, polite, and professional. Use "Namaste" or "Aadab" as appropriate.
- Language: Always respond in SIMPLE HINDI (HINGLISH). Use clear, easy-to-understand words.
- Goal: Answer ANY question about the software/website, help with student-specific fee queries, give collection advice, and explain how to use different modules.

====================================
🏫 SCHOOL INFORMATION
====================================
School Name: ${schoolName || 'Ayushman Educational Academy'}
Location: ${schoolAddress || 'India'}
Contact: ${schoolMobile || 'N/A'}

====================================
📊 DATA CONTEXT (Current Stats & Students)
====================================
${finalContext}

====================================
🗣 RESPONSE RULES (STRICT)
====================================
1. Answer in HINGLISH always.
2. If asked about a specific student (e.g., "Ayush ki fees kitni hai?"), search the DATA CONTEXT carefully. Use **case-insensitive** and **partial matching** (e.g., if asked for "Piyum", look for "Piyum Thakur", "piyum", etc.).
3. If you find the student, tell their: Total Fee, Paid Amount, and Remaining (Baki) Fee.
4. If you find multiple matches, list all of them briefly.
5. If you absolutely cannot find the student, politely ask the user to check the spelling or the "Students" page.
6. For "How to collect" or "When to collect", give practical advice (e.g., Harvest timing, installment plans).
7. Give STEP-BY-STEP instructions for software tasks (1, 2, 3...).
8. Use emojis: 💰, ✅, ⚠️, 🚀, 🏫.
9. KEEP ANSWERS EXTREMELY SHORT (1-2 lines maximum) unless the user asks for a long explanation. Do not write unnecessary greetings or filler words. Speed is priority!

====================================
🚀 APPLICATION MODULES & KNOWLEDGE (Quick Reference)
====================================
1. STUDENTS (/students): View all students, search, and manage profiles.
2. PAYMENTS: To add fee, go to Student profile -> "Add Payment".
3. EXPENSES (/expenses): Manage Staff Salary, Vehicle Fuel/Maintenance, and Building costs.
4. AI INSIGHTS (/ai): This page! See collection stats and defaulters.
5. PROFILE (/profile): Change school name, address, and mobile number.
`

    const geminiMessages = messagesArray.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    const geminiKey = process.env.GEMINI_API_KEY
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiMessages
        })
      }
    )

    const data = await response.json()
    if (!response.ok) {
      console.error('Gemini API Error:', data)
      return NextResponse.json({ reply: `API Error: ${data.error?.message || response.statusText}` }, { status: response.status })
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('AI Chat Route Error:', error)
    return NextResponse.json({ reply: `Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
