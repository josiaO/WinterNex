import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

// POST /api/auth - Mock authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already exists in mock store
    let user = await mockDb.user.findUnique({ where: { email } })

    if (!user) {
      // Auto-create user for demo
      user = await mockDb.user.create({
        email,
        name: name || email.split('@')[0],
        phone: phone || null,
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
