import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

// POST /api/payments - Initiate payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, orderId, method, amount, phoneNumber } = body

    if (!userId || !orderId || !method || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate transaction ID
    const txnId = method === 'mpesa' 
      ? `QHK${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      : method === 'tigopesa'
        ? `TPS${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        : `ATM${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    // Create payment record
    const payment = await mockDb.payment.create({
      userId,
      orderId,
      method,
      status: 'pending',
      amount,
      currency: 'TZS',
      phoneNumber: phoneNumber || null,
      transactionId: txnId,
    })

    return NextResponse.json({
      payment: { ...payment, transactionId: txnId },
      message: 'Payment initiated. Please complete on your phone.',
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}

// GET /api/payments?orderId=xxx - Check payment status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const payments = await mockDb.payment.findMany({
      where: { orderId },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Failed to check payment status' }, { status: 500 })
  }
}

// PATCH /api/payments - Update payment status (simulating callback)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, status } = body

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payment = await mockDb.payment.update({
      where: { id: paymentId },
      data: { status },
    })

    // If payment completed, update order status
    if (status === 'completed') {
      await mockDb.order.update({
        where: { id: payment.orderId },
        data: { status: 'completed' },
      })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}
