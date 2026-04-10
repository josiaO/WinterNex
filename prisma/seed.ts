import { db } from '@/lib/db'

async function seed() {
  // Create demo user — Tanzania
  const user = await db.user.create({
    data: {
      email: 'demo@domainhub.co.tz',
      name: 'Juma Mwangi',
      phone: '+255678901234',
    },
  })

  // Create Tanzania-focused domains
  const domains = await Promise.all([
    db.domain.create({
      data: {
        domainName: 'safaritech.co.tz',
        tld: '.co.tz',
        status: 'registered',
        registeredAt: new Date('2024-01-15'),
        expiresAt: new Date('2025-01-15'),
        userId: user.id,
        locked: false,
        autoRenew: true,
        whoisPrivacy: true,
      },
    }),
    db.domain.create({
      data: {
        domainName: 'darbiashara.com',
        tld: '.com',
        status: 'registered',
        registeredAt: new Date('2024-03-20'),
        expiresAt: new Date('2025-03-20'),
        userId: user.id,
        locked: true,
        autoRenew: false,
      },
    }),
    db.domain.create({
      data: {
        domainName: 'mwanzadigital.tz',
        tld: '.tz',
        status: 'registered',
        registeredAt: new Date('2024-06-10'),
        expiresAt: new Date('2025-06-10'),
        userId: user.id,
        locked: false,
        autoRenew: true,
      },
    }),
    db.domain.create({
      data: {
        domainName: 'kilimokahawa.co.tz',
        tld: '.co.tz',
        status: 'registered',
        registeredAt: new Date('2023-11-05'),
        expiresAt: new Date('2024-11-05'),
        userId: user.id,
        locked: false,
        autoRenew: false,
      },
    }),
    db.domain.create({
      data: {
        domainName: 'afyabora.co.tz',
        tld: '.co.tz',
        status: 'registered',
        registeredAt: new Date('2024-08-01'),
        expiresAt: new Date('2025-08-01'),
        userId: user.id,
        locked: false,
        autoRenew: true,
      },
    }),
  ])

  // Create orders
  const order1 = await db.order.create({
    data: {
      orderNumber: 'ORD-2024-001',
      userId: user.id,
      domainId: domains[0].id,
      type: 'domain_registration',
      status: 'completed',
      amount: 35000,
      currency: 'TZS',
    },
  })

  const order2 = await db.order.create({
    data: {
      orderNumber: 'ORD-2024-002',
      userId: user.id,
      domainId: domains[1].id,
      type: 'domain_registration',
      status: 'completed',
      amount: 30000,
      currency: 'TZS',
    },
  })

  await db.order.create({
    data: {
      orderNumber: 'ORD-2024-003',
      userId: user.id,
      domainId: domains[2].id,
      type: 'domain_registration',
      status: 'completed',
      amount: 25000,
      currency: 'TZS',
    },
  })

  // Create payments — M-Pesa Tanzania
  await db.payment.create({
    data: {
      userId: user.id,
      orderId: order1.id,
      method: 'mpesa',
      status: 'completed',
      amount: 35000,
      currency: 'TZS',
      transactionId: 'TZH3L5M7N9',
      phoneNumber: '+255678901234',
    },
  })

  await db.payment.create({
    data: {
      userId: user.id,
      orderId: order2.id,
      method: 'mpesa',
      status: 'completed',
      amount: 30000,
      currency: 'TZS',
      transactionId: 'TZM4P6Q8R0',
      phoneNumber: '+255678901234',
    },
  })

  // Create DNS records for first domain
  await Promise.all([
    db.dnsRecord.create({
      data: {
        domainId: domains[0].id,
        type: 'A',
        name: '@',
        value: '41.59.128.15',
        ttl: 3600,
      },
    }),
    db.dnsRecord.create({
      data: {
        domainId: domains[0].id,
        type: 'CNAME',
        name: 'www',
        value: 'safaritech.co.tz',
        ttl: 3600,
      },
    }),
    db.dnsRecord.create({
      data: {
        domainId: domains[0].id,
        type: 'MX',
        name: '@',
        value: 'mail.safaritech.co.tz',
        priority: 10,
        ttl: 3600,
      },
    }),
    db.dnsRecord.create({
      data: {
        domainId: domains[0].id,
        type: 'TXT',
        name: '@',
        value: 'v=spf1 include:_spf.google.com ~all',
        ttl: 3600,
      },
    }),
  ])

  // Create a sample website
  await db.website.create({
    data: {
      userId: user.id,
      businessName: 'SafariTech Solutions',
      category: 'Technology',
      description: 'Mtoa huduma za IT zinazotumika nchini Tanzania',
      theme: 'modern',
      status: 'published',
      domainId: domains[0].id,
      publishedAt: new Date('2024-02-01'),
      htmlContent: generateSampleHTML('SafariTech Solutions', 'Technology', 'Mtoa huduma za IT zinazotumika nchini Tanzania'),
    },
  })

  console.log('Seed completed successfully!')
  console.log('Demo user:', user.email)
}

function generateSampleHTML(businessName: string, category: string, description: string) {
  return `<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; }
    .hero { background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; padding: 80px 20px; text-align: center; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 16px; }
    .hero p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
    .section { padding: 60px 20px; max-width: 1200px; margin: 0 auto; }
    .section h2 { font-size: 1.8rem; margin-bottom: 24px; color: #0f3460; }
    .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; }
    .service-card { background: #f8f9fa; padding: 32px; border-radius: 12px; text-align: center; }
    .service-card h3 { margin-bottom: 12px; color: #16213e; }
    .contact { background: #f0f4f8; text-align: center; padding: 60px 20px; }
    .contact a { color: #0f3460; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>${businessName}</h1>
    <p>${description}</p>
  </section>
  <section class="section">
    <h2>Huduma Zetu</h2>
    <div class="services">
      <div class="service-card"><h3>Ushauri</h3><p>Ushauri wa kitaalamu wa IT kwa biashara yako</p></div>
      <div class="service-card"><h3>Maendeleo</h3><p>Programu za desturi zinazobana na mahitaji yako</p></div>
      <div class="service-card"><h3>Msaada</h3><p>Msaada wa kiufundi saa 24, siku 7</p></div>
    </div>
  </section>
  <section class="contact">
    <h2>Twasiliana Nasi</h2>
    <p>Tutumie barua pepe kwa <a href="mailto:info@${businessName.toLowerCase().replace(/\s+/g, '')}.co.tz">info@${businessName.toLowerCase().replace(/\s+/g, '')}.co.tz</a></p>
  </section>
</body>
</html>`
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
