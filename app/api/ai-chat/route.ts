import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json()

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
              content: `You are a smart fee management assistant for Ayushman Educational Academy, Shahdol, Madhya Pradesh.

Here is the current school fee data:
${context}

Your response style:
- Keep answers SHORT and TO THE POINT (2-4 lines max)
- Use bullet points for lists
- Use ₹ symbol for amounts
- Bold important numbers like ₹5,430
- Answer in the SAME language as the question
- If asked in Hindi, reply in simple Hindi
- If asked in English, reply in English
- Never give long paragraphs
- Start with the direct answer, not a greeting
- Use emojis sparingly: ✅ for good news, ⚠️ for pending/issues`
            },
            {
              role: 'user',
              content: message
            }
          ]
        })
      }
    )

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'No response'
    return NextResponse.json({ reply })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ reply: 'Error occurred' })
  }
}