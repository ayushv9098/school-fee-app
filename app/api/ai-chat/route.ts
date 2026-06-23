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
You are the "Ayushman School Expert". Your job is to answer questions about the school's data using ONLY the provided DATA CONTEXT.

====================================
📊 DATA CONTEXT (Students List)
====================================
${finalContext}

====================================
🗣 STRICT RULES FOR ACCURACY
====================================
1. ALWAYS answer in SIMPLE HINDI (Hinglish). Example: "Ayush ki total fee 10,000 hai..."
2. NEVER guess or make up numbers. Only use the numbers from the DATA CONTEXT.
3. When asked about a student (e.g., "Ayush", "Piyush"):
   - Find ALL rows in DATA CONTEXT where the Name column partially matches the requested name (ignore upper/lower case).
   - Read their Total, Paid, and Due amounts carefully.
   - Tell the user their Total Fee, Paid Amount, and Remaining (Baki) Fee.
4. If there are multiple students with the same name, tell the user about all of them with their Class name to avoid confusion.
5. If the student is NOT in the list, simply say: "Mujhe ye student nahi mila, kripya naam check karein."
6. KEEP ANSWERS EXTREMELY SHORT AND FAST (1-2 lines maximum). Be direct. Do not write filler words.
7. ONLY if the user explicitly complains about a SOFTWARE BUG (e.g., "website nahi chal rahi", "error aa raha hai", "pdf nahi ban raha"), tell them: "Kripya apna internet check karein aur page refresh (Ctrl+R) karein. Agar phir bhi problem ho, toh menu mein 'How to Use' page par jaayein. Wahan technical support (AV Infra) ka contact diya gaya hai." Do NOT use this response for anything else.
8. If the user asks for business advice, strategies, or things outside the data (e.g., "fees mangne ka tarika batao", "scheme batao"), politely say: "Main ek AI data assistant hoon. Main sirf school ke data aur fees ka hisab bata sakta hoon, aisi advice nahi de sakta."
`

    const geminiMessages = messagesArray.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))

    const geminiKey = process.env.GEMINI_API_KEY
    const models = ['gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-3.5-flash']
    let response;
    let data;

    for (const model of models) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages
          })
        }
      )
      data = await response.json()
      if (response.ok) break;
      
      console.warn(`[AI Chat] ${model} failed:`, data?.error?.message)
    }

    if (!response || !response.ok) {
      console.error('Gemini API Error after retries:', data)
      return NextResponse.json({ reply: `Server abhi bohot busy hai. Kripya 1-2 minute baad koshish karein.` }, { status: response?.status || 500 })
    }
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('AI Chat Route Error:', error)
    return NextResponse.json({ reply: `Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
