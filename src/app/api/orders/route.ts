import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

// POST /api/orders - Create an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, domainId, type, amount, currency, metadata } = body

    if (!userId || !type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const count = await mockDb.order.count()
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const order = await mockDb.order.create({
      orderNumber,
      userId,
      domainId: domainId || null,
      type,
      status: 'pending',
      amount,
      currency: currency || 'TZS',
      metadata: metadata || null,
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

// GET /api/orders - List orders
export async function GET() {
  try {
    const orderRows = await mockDb.order.findMany()

    // Attach domain data if available
    const orders = orderRows.map(o => {
      const domain = o.domainId ? domains_store_find(o.domainId) : null
      return {
        ...o,
        domain,
      }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// Helper: find domain by ID from the mock store (avoids circular import)
function domains_store_find(id: string) {
  return mockDb.domain.findUnique({ where: { id } })
}
