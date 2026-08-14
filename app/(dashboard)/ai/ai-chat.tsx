'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Bot, Send, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import SubscribeButton from './subscribe-button'

interface Props {
  totalStudents: number
  totalFees: number
  totalCollected: number
  totalPending: number
  collectionRate: number
  paidStudents: number
  unpaidStudents: number
  partialStudents: number
  classStats: any[]
  defaulters: any[]
  students: any[]
  isSubscribed: boolean
  schoolName: string
  schoolAddress: string
  schoolMobile: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIChat(props: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Namaste! Main aapka smart assistant hoon. Aap kisi bhi student ki detail, fees, attendance, ya is website ke features ke baare mein pooch sakte hain.`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickQuestions, setShowQuickQuestions] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = document.getElementById('chat-messages')
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const context = `
    School: ${props.schoolName || 'Ayushman Educational Academy'}
    Stats: Students:${props.totalStudents}, Total:₹${props.totalFees}, Collected:₹${props.totalCollected}, Pending:₹${props.totalPending}, Rate:${props.collectionRate}%
    
    Student List (Name|Class|Total|Paid|Due|Mobile|Guardian):
    ${props.students.map(s => `${s.name}|${s.class}|${s.total_fee}|${s.total_paid}|${s.remaining_fee}|${s.mobile || 'N/A'}|${s.guardian_name || 'N/A'}`).join('\n')}
  `

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setShowQuickQuestions(false)
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)
    
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages, 
          context,
          schoolName: props.schoolName,
          schoolAddress: props.schoolAddress,
          schoolMobile: props.schoolMobile
        })
      })
      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'Sorry, I could not process your request.'
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message || 'AI service is not available right now. Please check your connection.'}`
      }])
    }
    setLoading(false)
  }

  if (!props.isSubscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-600" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <SubscribeButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-600" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-4">

        {/* Messages */}
        <div className="space-y-3 max-h-80 overflow-y-auto" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-violet-100' : 'bg-zinc-100 dark:bg-zinc-800'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4 text-violet-600" />
                  : <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                }
              </div>
              <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
  msg.role === 'assistant'
    ? 'bg-violet-50 text-zinc-800'
    : 'bg-zinc-900 text-white'
}`}>
  {msg.role === 'assistant' ? (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{
        __html: msg.content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br/>')
      }}
    />
  ) : (
    msg.content
  )}
</div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-violet-600" />
              </div>
              <div className="px-3 py-2 rounded-xl bg-violet-50 flex items-center gap-1">
                <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions */}
        {showQuickQuestions && (
          <div className="flex flex-wrap gap-2">
            {[
              'Software ke kya kya features hain?',
              'Add payment kaise karein?',
              'Staff salary manage kaise karein?',
              'Defaulters list check karni hai.',
              'Aaj ki attendance dikhao.',
            ].map(q => (
              <button
                key={q}
                onClick={() => {
                  setInput(q)
                  setShowQuickQuestions(false)
                }}
                className="text-xs px-3 py-1.5 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ask about students, fees or features..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="h-11"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}