import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const order = await razorpay.orders.create({
      amount: 500,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    })
    return NextResponse.json(order)
  } catch (err) {
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }
}