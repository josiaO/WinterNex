import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

// GET /api/admin?action=users|stats|settings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    switch (action) {
      case 'users': {
        const allUsers = await mockDb.user.findMany()

        const usersWithCounts = await Promise.all(
          allUsers.map(async (user) => {
            const counts = await mockDb.user._count({ where: { id: user.id } })
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              phone: user.phone,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              domainCount: counts.domains,
              orderCount: counts.orders,
              paymentCount: counts.payments,
              websiteCount: counts.websites,
              serviceCount: counts.services,
            }
          })
        )

        return NextResponse.json({ users: usersWithCounts })
      }

      case 'stats': {
        const [
          totalUsers,
          totalDomains,
          totalOrders,
          ordersWithAmount,
          activeDomains,
          expiringDomains,
          pendingOrders,
          recentUsers,
          recentDomains,
        ] = await Promise.all([
          mockDb.user.count(),
          mockDb.domain.count(),
          mockDb.order.count(),
          mockDb.order.aggregate({
            _sum: { amount: true },
            where: { status: { in: ['completed', 'paid'] } },
          }),
          mockDb.domain.count({ where: { status: 'registered' } }),
          mockDb.domain.count({
            where: {
              status: 'registered',
              expiresAt: {
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                gte: new Date().toISOString(),
              },
            },
          }),
          mockDb.order.count({ where: { status: 'pending' } }),
          // Recent users (last 5)
          mockDb.user.findMany(),
          // Recent domains (last 5)
          mockDb.domain.findMany(),
        ])

        // For recent users/domains, just take the last 5
        const recentUsersSlice = recentUsers.slice(-5).map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          createdAt: u.createdAt,
        }))
        const recentDomainsSlice = recentDomains.slice(-5).map(d => ({
          id: d.id,
          domainName: d.domainName,
          tld: d.tld,
          status: d.status,
          expiresAt: d.expiresAt,
          createdAt: d.createdAt,
        }))

        return NextResponse.json({
          totalUsers,
          totalDomains,
          totalOrders,
          totalRevenue: ordersWithAmount._sum.amount || 0,
          activeDomains,
          expiringDomains,
          pendingOrders,
          recentUsers: recentUsersSlice,
          recentDomains: recentDomainsSlice,
        })
      }

      case 'settings': {
        const settings = {
          platformName: 'DomainHub',
          supportEmail: 'support@domainhub.co.tz',
          currency: 'TZS',
          mpesaEnabled: true,
          airtelEnabled: true,
          tigoPesaEnabled: true,
          testMode: true,
          defaultNameservers: ['ns1.domainhub.co.tz', 'ns2.domainhub.co.tz'],
          renewalReminderDays: 30,
          expiryAlertDays: 7,
          maintenanceMode: false,
        }

        return NextResponse.json({ settings })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: users, stats, or settings' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
  }
}

// PATCH /api/admin - Update platform settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      platformName,
      supportEmail,
      currency,
      mpesaEnabled,
      airtelEnabled,
      testMode,
      defaultNameservers,
      renewalReminderDays,
      expiryAlertDays,
      maintenanceMode,
    } = body

    const updatedSettings = {
      platformName: platformName || 'DomainHub',
      supportEmail: supportEmail || 'support@domainhub.co.tz',
      currency: currency || 'TZS',
      mpesaEnabled: mpesaEnabled !== undefined ? mpesaEnabled : true,
      airtelEnabled: airtelEnabled !== undefined ? airtelEnabled : true,
      tigoPesaEnabled: true,
      testMode: testMode !== undefined ? testMode : true,
      defaultNameservers: defaultNameservers || ['ns1.domainhub.co.tz', 'ns2.domainhub.co.tz'],
      renewalReminderDays: renewalReminderDays || 30,
      expiryAlertDays: expiryAlertDays || 7,
      maintenanceMode: maintenanceMode || false,
    }

    return NextResponse.json({ settings: updatedSettings, message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Admin PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
