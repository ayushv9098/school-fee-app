'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap } from 'lucide-react'

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Please login first')
        setLoading(false)
        return
      }

      // Create order
      const orderRes = await fetch('/api/create-order', { method: 'POST' })
      const order = await orderRes.json()

      if (!order.id) {
        alert('Order creation failed')
        setLoading(false)
        return
      }

      // Load Razorpay script
      await new Promise<void>((resolve) => {
        if ((window as any).Razorpay) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve()
        document.body.appendChild(script)
      })

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Ayushman Educational Academy',
        description: 'AI Assistant - Monthly Plan',
        order_id: order.id,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: user.id,
            })
          })

          const result = await verifyRes.json()
          console.log('Verify result:', result)

          if (result.success) {
            alert('Payment successful! AI Assistant unlocked!')
            window.location.reload()
          } else {
            alert('Payment verification failed: ' + JSON.stringify(result))
          }
        },
        prefill: {
          email: user.email,
        },
        theme: { color: '#7C3AED' }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error('Subscribe error:', err)
      alert('Error: ' + err)
    }

    setLoading(false)
  }

  return (
    <div className="p-6 text-center space-y-4 bg-violet-50 rounded-xl">
      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
        <Zap className="w-6 h-6 text-violet-600" />
      </div>
      <div>
        <p className="font-semibold text-zinc-900">Unlock the AI Assistant.</p>
        <p className="text-sm text-zinc-500 mt-1">Unlimited AI chat for just ₹29 per month.</p>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-50"
      >
        {loading
          ? 'Processing...'
          : '₹29/month - Subscribe Now'
        }
      </button>
    </div>
  )
}