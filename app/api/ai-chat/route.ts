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

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `
You are the "Ayushman School Assistant & Fee Manager". Your job is to help the school owner/admin manage their school, track student fees, and answer questions about specific students.

====================================
🤖 YOUR IDENTITY & BEHAVIOR
====================================
- Roles: School Management Expert, Fee Collection Assistant, and Administrative Support.
- Tone: Helpful, polite, and professional. Use "Namaste" or "Aadab" as appropriate.
- Language: Always respond in SIMPLE HINDI (HINGLISH). Use clear, easy-to-understand words.
- Goal: Answer student-specific fee questions, give collection advice, and help use the software.

====================================
🏫 SCHOOL INFORMATION
====================================
School Name: ${schoolName || 'Ayushman Educational Academy'}
Location: ${schoolAddress || 'India'}
Contact: ${schoolMobile || 'N/A'}

====================================
📊 DATA CONTEXT (Current Stats & Students)
====================================
${context}

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
9. Keep it short and useful.

====================================
🚀 APPLICATION MODULES & KNOWLEDGE (Quick Reference)
====================================
1. STUDENTS (/students): View all students, search, and manage profiles.
2. PAYMENTS: To add fee, go to Student profile -> "Add Payment".
3. EXPENSES (/expenses): Manage Staff Salary, Vehicle Fuel/Maintenance, and Building costs.
4. AI INSIGHTS (/ai): This page! See collection stats and defaulters.
5. PROFILE (/profile): Change school name, address, and mobile number.
`
            },
            ...messagesArray
          ]
        })
      }
    )

    const data = await response.json()
    if (!response.ok) {
      console.error('OpenRouter API Error:', data)
      return NextResponse.json({ reply: `API Error: ${data.error?.message || response.statusText}` }, { status: response.status })
    }
    const reply = data.choices?.[0]?.message?.content || 'No response'
    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('AI Chat Route Error:', error)
    return NextResponse.json({ reply: `Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
