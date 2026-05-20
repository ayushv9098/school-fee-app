'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bot, Lock, X, Send, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FloatingAIButton() {
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hello! Ask something about fee management!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const el = document.getElementById('float-chat')
  if (el) el.scrollTop = el.scrollHeight
}, [messages])
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setChecking(false)

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .maybeSingle()

      setIsSubscribed(!!data)
      setChecking(false)
    }
    checkSubscription()
  }, [])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context: '' })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error occurred' }])
    }
    setLoading(false)
  }

  if (checking) return null

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => isSubscribed ? setOpen(true) : router.push('/ai')}
        className={cn(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-2 border-white/20",
          isSubscribed 
            ? "bg-gradient-to-br from-violet-500 to-violet-700 shadow-violet-500/20" 
            : "bg-gradient-to-br from-zinc-600 to-zinc-800 shadow-black/20"
        )}
      >
        {isSubscribed ? (
          <Bot className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white/50">
              <Lock className="w-2.5 h-2.5 text-yellow-900" />
            </div>
          </div>
        )}
      </button>

      {/* Chat Modal */}
      {open && isSubscribed && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden"
          style={{ height: '420px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-violet-600">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-white" />
              <p className="text-sm font-semibold text-white">AI Assistant</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/ai')}
                className="text-violet-200 hover:text-white text-xs transition"
              >
                Full Page →
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-violet-200 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" id="float-chat">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant' ? 'bg-violet-100' : 'bg-zinc-100'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-3 h-3 text-violet-600" />
                    : <User className="w-3 h-3 text-zinc-600" />
                  }
                </div>
                <div
                  className={`max-w-52 px-3 py-2 rounded-xl text-xs ${
                    msg.role === 'assistant'
                      ? 'bg-violet-50 text-zinc-800'
                      : 'bg-zinc-900 text-white'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-violet-600" />
                </div>
                <div className="px-3 py-2 rounded-xl bg-violet-50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-100 flex gap-2">
            <input
              placeholder="Ask something..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}