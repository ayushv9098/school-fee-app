import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        reply: 'AI service not configured. Please add ANTHROPIC_API_KEY.'
      })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: `You are a helpful fee management assistant for Ayushman Educational Academy. 
        Answer questions based on this data: ${context}
        Be concise and helpful. Answer in the same language as the question (Hindi or English).`,
        messages: [{ role: 'user', content: message }]
      })
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text || 'Sorry, could not get response.'

    return NextResponse.json({ reply })

  } catch (err) {
    return NextResponse.json({ reply: 'Error processing request.' })
  }
}