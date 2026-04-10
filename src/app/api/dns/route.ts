import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

// GET /api/dns?domainId=xxx - Get DNS records for a domain
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const domainId = searchParams.get('domainId')

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    const records = await mockDb.dnsRecord.findMany({
      where: { domainId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('DNS fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch DNS records' }, { status: 500 })
  }
}

// POST /api/dns - Create a DNS record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domainId, type, name, value, priority, ttl } = body

    if (!domainId || !type || !name || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const record = await mockDb.dnsRecord.create({
      domainId,
      type,
      name,
      value,
      priority: priority || null,
      ttl: ttl || 3600,
    })

    return NextResponse.json({ record }, { status: 201 })
  } catch (error) {
    console.error('DNS create error:', error)
    return NextResponse.json({ error: 'Failed to create DNS record' }, { status: 500 })
  }
}

// PUT /api/dns - Update (edit) a DNS record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, name, value, priority, ttl } = body

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    const record = await mockDb.dnsRecord.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(name && { name }),
        ...(value && { value }),
        ...(priority !== undefined && { priority: priority || null }),
        ...(ttl && { ttl }),
      },
    })

    return NextResponse.json({ record })
  } catch (error) {
    console.error('DNS update error:', error)
    return NextResponse.json({ error: 'Failed to update DNS record' }, { status: 500 })
  }
}

// DELETE /api/dns?id=xxx - Delete a DNS record
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    await mockDb.dnsRecord.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DNS delete error:', error)
    return NextResponse.json({ error: 'Failed to delete DNS record' }, { status: 500 })
  }
}
