import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

// GET /api/domains - List user's domains
export async function GET() {
  try {
    const domainRows = await mockDb.domain.findMany()
    // The mock store returns domains with dnsRecords already attached
    const domains = domainRows.map(d => ({
      id: d.id,
      domainName: d.domainName,
      tld: d.tld,
      status: d.status,
      registeredAt: d.registeredAt,
      expiresAt: d.expiresAt,
      locked: d.locked,
      autoRenew: d.autoRenew,
      whoisPrivacy: d.whoisPrivacy,
      transferCode: d.transferCode,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))

    return NextResponse.json({ domains })
  } catch (error) {
    console.error('Domains fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }
}

// POST /api/domains - Register a domain
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domainName, tld, userId } = body

    if (!domainName || !tld) {
      return NextResponse.json({ error: 'Domain name and TLD are required' }, { status: 400 })
    }

    const fullDomain = `${domainName}${tld}`

    // Check if already exists
    const existing = await mockDb.domain.findUnique({
      where: { domainName: fullDomain },
    })

    if (existing) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 })
    }

    // Create domain
    const domain = await mockDb.domain.create({
      domainName: fullDomain,
      tld,
      status: 'registered',
      userId: userId || null,
    })

    // Create default DNS records
    await mockDb.dnsRecord.create({
      domainId: domain.id,
      type: 'A',
      name: '@',
      value: '192.168.1.1',
      ttl: 3600,
    })

    await mockDb.dnsRecord.create({
      domainId: domain.id,
      type: 'NS',
      name: '@',
      value: 'ns1.domainhub.co.tz',
      ttl: 86400,
    })

    await mockDb.dnsRecord.create({
      domainId: domain.id,
      type: 'NS',
      name: '@',
      value: 'ns2.domainhub.co.tz',
      ttl: 86400,
    })

    return NextResponse.json({ domain }, { status: 201 })
  } catch (error) {
    console.error('Domain registration error:', error)
    return NextResponse.json({ error: 'Domain registration failed' }, { status: 500 })
  }
}

// PATCH /api/domains - Update domain settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { domainId, locked, autoRenew, whoisPrivacy, status, action, transferCode } = body

    if (action === 'transfer') {
      // Initiate domain transfer
      const domain = await mockDb.domain.findUnique({ where: { id: domainId } })
      if (!domain) {
        return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
      }
      if (domain.locked) {
        return NextResponse.json({ error: 'Domain is locked. Unlock before transferring.' }, { status: 400 })
      }
      const updated = await mockDb.domain.update({
        where: { id: domainId },
        data: { status: 'transferring', transferCode: transferCode || domain.transferCode },
      })
      return NextResponse.json({ domain: updated })
    }

    const domain = await mockDb.domain.update({
      where: { id: domainId },
      data: {
        ...(locked !== undefined && { locked }),
        ...(autoRenew !== undefined && { autoRenew }),
        ...(whoisPrivacy !== undefined && { whoisPrivacy }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ domain })
  } catch (error) {
    console.error('Domain update error:', error)
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 })
  }
}
