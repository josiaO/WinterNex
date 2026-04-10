// ══════════════════════════════════════════════════════════════════════════
// In-memory mock data store — replaces Prisma/SQLite for sandbox demo
// DomainHub Tanzania Market
// ══════════════════════════════════════════════════════════════════════════

export interface MockUser {
  id: string
  email: string
  name: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}

export interface MockDnsRecord {
  id: string
  domainId: string
  type: string
  name: string
  value: string
  priority: number | null
  ttl: number
}

export interface MockDomain {
  id: string
  domainName: string
  tld: string
  status: string
  registeredAt: string | null
  expiresAt: string | null
  userId: string | null
  locked: boolean
  autoRenew: boolean
  whoisPrivacy: boolean
  transferCode: string | null
  createdAt: string
  updatedAt: string
  dnsRecords: MockDnsRecord[]
}

export interface MockOrder {
  id: string
  orderNumber: string
  userId: string | null
  domainId: string | null
  type: string
  status: string
  amount: number
  currency: string
  metadata: string | null
  createdAt: string
  updatedAt: string
}

export interface MockPayment {
  id: string
  userId: string | null
  orderId: string
  method: string
  status: string
  amount: number
  currency: string
  phoneNumber: string | null
  transactionId: string | null
  createdAt: string
  updatedAt: string
}

export interface MockWebsite {
  id: string
  userId: string
  businessName: string
  category: string
  description: string
  htmlContent: string
  theme: string
  status: string
  domainId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// ── ID generator ──
let idCounter = 100
function genId(): string {
  return `mock_${Date.now()}_${++idCounter}`
}

// ── Seed Users ──
const users: MockUser[] = [
  {
    id: 'user_admin',
    email: 'admin@domainhub.co.tz',
    name: 'Juma Mwangi',
    phone: '+255 713 456 789',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2025-01-15T08:00:00.000Z',
  },
  {
    id: 'user_fatma',
    email: 'fatma@dukaladigital.co.tz',
    name: 'Fatma Hassan',
    phone: '+255 786 123 456',
    createdAt: '2024-03-20T10:30:00.000Z',
    updatedAt: '2025-03-20T10:30:00.000Z',
  },
  {
    id: 'user_joseph',
    email: 'joseph@techpeak.co.tz',
    name: 'Joseph Mushi',
    phone: '+255 756 789 012',
    createdAt: '2024-05-10T14:00:00.000Z',
    updatedAt: '2025-05-10T14:00:00.000Z',
  },
  {
    id: 'user_neema',
    email: 'neema@zanzibarcouture.co.tz',
    name: 'Neema Kimaro',
    phone: '+255 777 345 678',
    createdAt: '2024-07-01T09:15:00.000Z',
    updatedAt: '2025-07-01T09:15:00.000Z',
  },
]

// ── Seed DNS Records ──
const dnsRecords: MockDnsRecord[] = [
  // biashara.co.tz DNS
  { id: 'dns_1', domainId: 'dom_1', type: 'A', name: '@', value: '41.59.128.5', priority: null, ttl: 3600 },
  { id: 'dns_2', domainId: 'dom_1', type: 'A', name: 'www', value: '41.59.128.5', priority: null, ttl: 3600 },
  { id: 'dns_3', domainId: 'dom_1', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_4', domainId: 'dom_1', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_5', domainId: 'dom_1', type: 'MX', name: '@', value: 'mail.biashara.co.tz', priority: 10, ttl: 3600 },
  { id: 'dns_6', domainId: 'dom_1', type: 'TXT', name: '@', value: 'v=spf1 include:_spf.domainhub.co.tz ~all', priority: null, ttl: 3600 },

  // techpeak.tz DNS
  { id: 'dns_7', domainId: 'dom_2', type: 'A', name: '@', value: '102.22.45.78', priority: null, ttl: 3600 },
  { id: 'dns_8', domainId: 'dom_2', type: 'A', name: 'www', value: '102.22.45.78', priority: null, ttl: 3600 },
  { id: 'dns_9', domainId: 'dom_2', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_10', domainId: 'dom_2', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_11', domainId: 'dom_2', type: 'CNAME', name: 'api', value: 'techpeak.co.tz', priority: null, ttl: 3600 },

  // zanzibarcouture.co.tz DNS
  { id: 'dns_12', domainId: 'dom_3', type: 'A', name: '@', value: '156.38.12.90', priority: null, ttl: 3600 },
  { id: 'dns_13', domainId: 'dom_3', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_14', domainId: 'dom_3', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },

  // dukaladigital.com DNS
  { id: 'dns_15', domainId: 'dom_4', type: 'A', name: '@', value: '197.242.144.33', priority: null, ttl: 3600 },
  { id: 'dns_16', domainId: 'dom_4', type: 'A', name: 'www', value: '197.242.144.33', priority: null, ttl: 3600 },
  { id: 'dns_17', domainId: 'dom_4', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_18', domainId: 'dom_4', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_19', domainId: 'dom_4', type: 'MX', name: '@', value: 'mail.dukaladigital.com', priority: 5, ttl: 3600 },
  { id: 'dns_20', domainId: 'dom_4', type: 'TXT', name: '@', value: 'v=spf1 include:_spf.domainhub.co.tz ~all', priority: null, ttl: 3600 },

  // safari.africa DNS
  { id: 'dns_21', domainId: 'dom_5', type: 'A', name: '@', value: '45.33.32.156', priority: null, ttl: 3600 },
  { id: 'dns_22', domainId: 'dom_5', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_23', domainId: 'dom_5', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },

  // michezo.tz DNS (expired)
  { id: 'dns_24', domainId: 'dom_6', type: 'A', name: '@', value: '78.47.123.45', priority: null, ttl: 3600 },
  { id: 'dns_25', domainId: 'dom_6', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_26', domainId: 'dom_6', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },

  // kilimo.or.tz DNS (expiring soon)
  { id: 'dns_27', domainId: 'dom_7', type: 'A', name: '@', value: '102.165.23.10', priority: null, ttl: 3600 },
  { id: 'dns_28', domainId: 'dom_7', type: 'NS', name: '@', value: 'ns1.domainhub.co.tz', priority: null, ttl: 86400 },
  { id: 'dns_29', domainId: 'dom_7', type: 'NS', name: '@', value: 'ns2.domainhub.co.tz', priority: null, ttl: 86400 },
]

// ── Helper: days from now ──
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

// ── Seed Domains ──
const domains: MockDomain[] = [
  {
    id: 'dom_1',
    domainName: 'biashara.co.tz',
    tld: '.co.tz',
    status: 'registered',
    registeredAt: '2024-06-15T10:00:00.000Z',
    expiresAt: daysFromNow(180), // expires in ~6 months
    userId: 'user_admin',
    locked: true,
    autoRenew: true,
    whoisPrivacy: true,
    transferCode: null,
    createdAt: '2024-06-15T10:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_1'),
  },
  {
    id: 'dom_2',
    domainName: 'techpeak.tz',
    tld: '.tz',
    status: 'registered',
    registeredAt: '2024-03-01T12:00:00.000Z',
    expiresAt: daysFromNow(25), // expires in 25 days!
    userId: 'user_admin',
    locked: false,
    autoRenew: false,
    whoisPrivacy: false,
    transferCode: 'TKP2025XYZ',
    createdAt: '2024-03-01T12:00:00.000Z',
    updatedAt: '2025-01-05T14:30:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_2'),
  },
  {
    id: 'dom_3',
    domainName: 'zanzibarcouture.co.tz',
    tld: '.co.tz',
    status: 'registered',
    registeredAt: '2024-08-20T09:00:00.000Z',
    expiresAt: daysFromNow(340), // expires in ~11 months
    userId: 'user_neema',
    locked: false,
    autoRenew: true,
    whoisPrivacy: true,
    transferCode: null,
    createdAt: '2024-08-20T09:00:00.000Z',
    updatedAt: '2025-01-12T11:00:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_3'),
  },
  {
    id: 'dom_4',
    domainName: 'dukaladigital.com',
    tld: '.com',
    status: 'registered',
    registeredAt: '2024-01-10T08:00:00.000Z',
    expiresAt: daysFromNow(8), // expires in 8 days! CRITICAL
    userId: 'user_fatma',
    locked: true,
    autoRenew: false,
    whoisPrivacy: true,
    transferCode: 'DLG2024ABC',
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2025-01-14T16:45:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_4'),
  },
  {
    id: 'dom_5',
    domainName: 'safari.africa',
    tld: '.africa',
    status: 'registered',
    registeredAt: '2024-09-05T15:00:00.000Z',
    expiresAt: daysFromNow(280), // expires in ~9 months
    userId: 'user_joseph',
    locked: false,
    autoRenew: true,
    whoisPrivacy: false,
    transferCode: null,
    createdAt: '2024-09-05T15:00:00.000Z',
    updatedAt: '2025-01-08T10:00:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_5'),
  },
  {
    id: 'dom_6',
    domainName: 'michezo.tz',
    tld: '.tz',
    status: 'expired',
    registeredAt: '2023-02-14T11:00:00.000Z',
    expiresAt: daysFromNow(-15), // expired 15 days ago
    userId: 'user_joseph',
    locked: false,
    autoRenew: false,
    whoisPrivacy: false,
    transferCode: null,
    createdAt: '2023-02-14T11:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_6'),
  },
  {
    id: 'dom_7',
    domainName: 'kilimo.or.tz',
    tld: '.or.tz',
    status: 'registered',
    registeredAt: '2024-04-10T07:00:00.000Z',
    expiresAt: daysFromNow(52), // expires in 52 days (warning zone)
    userId: 'user_fatma',
    locked: false,
    autoRenew: true,
    whoisPrivacy: true,
    transferCode: null,
    createdAt: '2024-04-10T07:00:00.000Z',
    updatedAt: '2025-01-11T09:00:00.000Z',
    dnsRecords: dnsRecords.filter(r => r.domainId === 'dom_7'),
  },
]

// ── Seed Orders ──
const orders: MockOrder[] = [
  { id: 'ord_1', orderNumber: 'ORD-2025-001', userId: 'user_admin', domainId: 'dom_1', type: 'domain_registration', status: 'completed', amount: 35000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'biashara.co.tz' }), createdAt: '2024-06-15T10:00:00.000Z', updatedAt: '2024-06-15T10:05:00.000Z' },
  { id: 'ord_2', orderNumber: 'ORD-2025-002', userId: 'user_admin', domainId: 'dom_2', type: 'domain_registration', status: 'completed', amount: 25000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'techpeak.tz' }), createdAt: '2024-03-01T12:00:00.000Z', updatedAt: '2024-03-01T12:05:00.000Z' },
  { id: 'ord_3', orderNumber: 'ORD-2025-003', userId: 'user_fatma', domainId: 'dom_4', type: 'domain_registration', status: 'completed', amount: 30000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'dukaladigital.com' }), createdAt: '2024-01-10T08:00:00.000Z', updatedAt: '2024-01-10T08:05:00.000Z' },
  { id: 'ord_4', orderNumber: 'ORD-2025-004', userId: 'user_fatma', domainId: 'dom_7', type: 'domain_registration', status: 'completed', amount: 25000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'kilimo.or.tz' }), createdAt: '2024-04-10T07:00:00.000Z', updatedAt: '2024-04-10T07:05:00.000Z' },
  { id: 'ord_5', orderNumber: 'ORD-2025-005', userId: 'user_neema', domainId: 'dom_3', type: 'domain_registration', status: 'completed', amount: 35000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'zanzibarcouture.co.tz' }), createdAt: '2024-08-20T09:00:00.000Z', updatedAt: '2024-08-20T09:05:00.000Z' },
  { id: 'ord_6', orderNumber: 'ORD-2025-006', userId: 'user_joseph', domainId: 'dom_5', type: 'domain_registration', status: 'completed', amount: 22000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'safari.africa' }), createdAt: '2024-09-05T15:00:00.000Z', updatedAt: '2024-09-05T15:05:00.000Z' },
  { id: 'ord_7', orderNumber: 'ORD-2025-007', userId: 'user_joseph', domainId: 'dom_6', type: 'domain_registration', status: 'completed', amount: 25000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'michezo.tz' }), createdAt: '2023-02-14T11:00:00.000Z', updatedAt: '2023-02-14T11:05:00.000Z' },
  { id: 'ord_8', orderNumber: 'ORD-2025-008', userId: 'user_admin', domainId: null, type: 'domain_registration', status: 'pending', amount: 35000, currency: 'TZS', metadata: JSON.stringify({ domainName: 'newproject.co.tz' }), createdAt: '2025-01-15T08:00:00.000Z', updatedAt: '2025-01-15T08:00:00.000Z' },
]

// ── Seed Payments ──
const payments: MockPayment[] = [
  { id: 'pay_1', userId: 'user_admin', orderId: 'ord_1', method: 'mpesa', status: 'completed', amount: 35000, currency: 'TZS', phoneNumber: '+255 713 456 789', transactionId: 'QHK4A8B2C1', createdAt: '2024-06-15T10:01:00.000Z', updatedAt: '2024-06-15T10:05:00.000Z' },
  { id: 'pay_2', userId: 'user_admin', orderId: 'ord_2', method: 'mpesa', status: 'completed', amount: 25000, currency: 'TZS', phoneNumber: '+255 713 456 789', transactionId: 'QHK7D3E5F9', createdAt: '2024-03-01T12:01:00.000Z', updatedAt: '2024-03-01T12:05:00.000Z' },
  { id: 'pay_3', userId: 'user_fatma', orderId: 'ord_3', method: 'mpesa', status: 'completed', amount: 30000, currency: 'TZS', phoneNumber: '+255 786 123 456', transactionId: 'QHK2F6G8H3', createdAt: '2024-01-10T08:01:00.000Z', updatedAt: '2024-01-10T08:05:00.000Z' },
  { id: 'pay_4', userId: 'user_fatma', orderId: 'ord_4', method: 'tigopesa', status: 'completed', amount: 25000, currency: 'TZS', phoneNumber: '+255 786 123 456', transactionId: 'TPS5H7J9K1', createdAt: '2024-04-10T07:01:00.000Z', updatedAt: '2024-04-10T07:05:00.000Z' },
  { id: 'pay_5', userId: 'user_neema', orderId: 'ord_5', method: 'airtel', status: 'completed', amount: 35000, currency: 'TZS', phoneNumber: '+255 777 345 678', transactionId: 'ATM8I1K3L7', createdAt: '2024-08-20T09:01:00.000Z', updatedAt: '2024-08-20T09:05:00.000Z' },
  { id: 'pay_6', userId: 'user_joseph', orderId: 'ord_6', method: 'mpesa', status: 'completed', amount: 22000, currency: 'TZS', phoneNumber: '+255 756 789 012', transactionId: 'QHK9J2L5M3', createdAt: '2024-09-05T15:01:00.000Z', updatedAt: '2024-09-05T15:05:00.000Z' },
]

// ── Seed Websites ──
const websites: MockWebsite[] = [
  {
    id: 'web_1',
    userId: 'user_fatma',
    businessName: 'DukaLa Digital',
    category: 'Restaurant',
    description: 'Modern East African cuisine restaurant in Dar es Salaam',
    htmlContent: '<html><body>DukaLa Digital Website</body></html>',
    theme: 'nature',
    status: 'published',
    domainId: 'dom_4',
    publishedAt: '2024-02-01T10:00:00.000Z',
    createdAt: '2024-01-20T08:00:00.000Z',
    updatedAt: '2024-02-01T10:00:00.000Z',
  },
  {
    id: 'web_2',
    userId: 'user_neema',
    businessName: 'Zanzibar Couture',
    category: 'Fashion',
    description: 'Handcrafted fashion and accessories from Zanzibar',
    htmlContent: '<html><body>Zanzibar Couture Website</body></html>',
    theme: 'vibrant',
    status: 'draft',
    domainId: 'dom_3',
    publishedAt: null,
    createdAt: '2024-09-01T10:00:00.000Z',
    updatedAt: '2024-09-01T10:00:00.000Z',
  },
]

// ══════════════════════════════════════════════════════════════════════════
// Mock Database API — mirrors Prisma's interface
// ══════════════════════════════════════════════════════════════════════════

export const mockDb = {
  // ── Users ──
  user: {
    findMany: () => Promise.resolve([...users]),
    findUnique: (opts: { where: { email: string } }) => {
      const user = users.find(u => u.email === opts.where.email)
      return Promise.resolve(user || null)
    },
    findById: (id: string) => {
      const user = users.find(u => u.id === id)
      return Promise.resolve(user || null)
    },
    create: (data: { email: string; name?: string; phone?: string | null }) => {
      const now = new Date().toISOString()
      const user: MockUser = {
        id: genId(),
        email: data.email,
        name: data.name || data.email.split('@')[0],
        phone: data.phone || null,
        createdAt: now,
        updatedAt: now,
      }
      users.push(user)
      return Promise.resolve(user)
    },
    count: () => Promise.resolve(users.length),
    _count: (opts: { where: { id: string } }) => {
      const domainCount = domains.filter(d => d.userId === opts.where.id).length
      const orderCount = orders.filter(o => o.userId === opts.where.id).length
      const paymentCount = payments.filter(p => p.userId === opts.where.id).length
      const websiteCount = websites.filter(w => w.userId === opts.where.id).length
      return Promise.resolve({ domains: domainCount, orders: orderCount, payments: paymentCount, websites: websiteCount, services: 0 })
    },
  },

  // ── Domains ──
  domain: {
    findMany: (opts?: { where?: { status?: string; userId?: string }; orderBy?: any }) => {
      let result = [...domains]
      if (opts?.where?.status) result = result.filter(d => d.status === opts.where.status)
      if (opts?.where?.userId) result = result.filter(d => d.userId === opts.where.userId)
      // Attach DNS records
      result = result.map(d => ({ ...d, dnsRecords: dnsRecords.filter(r => r.domainId === d.id) }))
      return Promise.resolve(result)
    },
    findUnique: (opts: { where: { id?: string; domainName?: string } }) => {
      const domain = domains.find(d =>
        (opts.where.id && d.id === opts.where.id) ||
        (opts.where.domainName && d.domainName === opts.where.domainName)
      )
      if (!domain) return Promise.resolve(null)
      return Promise.resolve({ ...domain, dnsRecords: dnsRecords.filter(r => r.domainId === domain.id) })
    },
    create: (data: { domainName: string; tld: string; status: string; userId?: string | null }) => {
      const now = new Date().toISOString()
      const domain: MockDomain = {
        id: genId(),
        domainName: data.domainName,
        tld: data.tld,
        status: data.status || 'registered',
        registeredAt: now,
        expiresAt: daysFromNow(365),
        userId: data.userId || null,
        locked: false,
        autoRenew: false,
        whoisPrivacy: false,
        transferCode: null,
        createdAt: now,
        updatedAt: now,
        dnsRecords: [],
      }
      domains.push(domain)
      return Promise.resolve(domain)
    },
    update: (opts: { where: { id: string }; data: Partial<MockDomain> }) => {
      const idx = domains.findIndex(d => d.id === opts.where.id)
      if (idx === -1) throw new Error('Domain not found')
      Object.assign(domains[idx], { ...opts.data, updatedAt: new Date().toISOString() })
      const updated = { ...domains[idx], dnsRecords: dnsRecords.filter(r => r.domainId === domains[idx].id) }
      return Promise.resolve(updated)
    },
    count: (opts?: { where?: { status?: string; expiresAt?: any } }) => {
      let result = domains
      if (opts?.where?.status) result = result.filter(d => d.status === opts.where.status)
      if (opts?.where?.expiresAt) {
        const { lte, gte } = opts.where.expiresAt
        if (lte) result = result.filter(d => d.expiresAt && new Date(d.expiresAt) <= new Date(lte))
        if (gte) result = result.filter(d => d.expiresAt && new Date(d.expiresAt) >= new Date(gte))
      }
      return Promise.resolve(result.length)
    },
  },

  // ── DNS Records ──
  dnsRecord: {
    findMany: (opts?: { where?: { domainId?: string }; orderBy?: any }) => {
      let result = [...dnsRecords]
      if (opts?.where?.domainId) result = result.filter(r => r.domainId === opts.where.domainId)
      return Promise.resolve(result)
    },
    create: (data: { domainId: string; type: string; name: string; value: string; priority?: number | null; ttl: number }) => {
      const record: MockDnsRecord = {
        id: genId(),
        domainId: data.domainId,
        type: data.type,
        name: data.name,
        value: data.value,
        priority: data.priority ?? null,
        ttl: data.ttl,
      }
      dnsRecords.push(record)
      return Promise.resolve(record)
    },
    update: (opts: { where: { id: string }; data: Partial<MockDnsRecord> }) => {
      const idx = dnsRecords.findIndex(r => r.id === opts.where.id)
      if (idx === -1) throw new Error('DNS record not found')
      Object.assign(dnsRecords[idx], opts.data)
      return Promise.resolve(dnsRecords[idx])
    },
    delete: (opts: { where: { id: string } }) => {
      const idx = dnsRecords.findIndex(r => r.id === opts.where.id)
      if (idx !== -1) dnsRecords.splice(idx, 1)
      return Promise.resolve(true)
    },
  },

  // ── Orders ──
  order: {
    findMany: (opts?: { where?: any; orderBy?: any; include?: any }) => {
      let result = [...orders]
      return Promise.resolve(result)
    },
    create: (data: { orderNumber: string; userId: string; type: string; status: string; amount: number; currency: string; metadata?: string | null; domainId?: string | null }) => {
      const now = new Date().toISOString()
      const order: MockOrder = {
        id: genId(),
        orderNumber: data.orderNumber,
        userId: data.userId,
        domainId: data.domainId || null,
        type: data.type,
        status: data.status,
        amount: data.amount,
        currency: data.currency || 'TZS',
        metadata: data.metadata || null,
        createdAt: now,
        updatedAt: now,
      }
      orders.push(order)
      return Promise.resolve(order)
    },
    update: (opts: { where: { id: string }; data: Partial<MockOrder> }) => {
      const idx = orders.findIndex(o => o.id === opts.where.id)
      if (idx === -1) throw new Error('Order not found')
      Object.assign(orders[idx], { ...opts.data, updatedAt: new Date().toISOString() })
      return Promise.resolve(orders[idx])
    },
    count: () => Promise.resolve(orders.length),
    aggregate: (opts: { _sum: { amount: true }; where: any }) => {
      const statusList: string[] = opts.where?.status?.in || ['completed', 'paid']
      const total = orders
        .filter(o => statusList.includes(o.status))
        .reduce((sum, o) => sum + o.amount, 0)
      return Promise.resolve({ _sum: { amount: total } })
    },
  },

  // ── Payments ──
  payment: {
    findMany: (opts?: { where?: { orderId?: string }; orderBy?: any }) => {
      let result = [...payments]
      if (opts?.where?.orderId) result = result.filter(p => p.orderId === opts.where.orderId)
      return Promise.resolve(result)
    },
    create: (data: { userId: string; orderId: string; method: string; status: string; amount: number; currency: string; phoneNumber?: string | null; transactionId?: string | null }) => {
      const now = new Date().toISOString()
      const payment: MockPayment = {
        id: genId(),
        userId: data.userId,
        orderId: data.orderId,
        method: data.method,
        status: data.status,
        amount: data.amount,
        currency: data.currency || 'TZS',
        phoneNumber: data.phoneNumber || null,
        transactionId: data.transactionId || null,
        createdAt: now,
        updatedAt: now,
      }
      payments.push(payment)
      return Promise.resolve(payment)
    },
    update: (opts: { where: { id: string }; data: Partial<MockPayment> }) => {
      const idx = payments.findIndex(p => p.id === opts.where.id)
      if (idx === -1) throw new Error('Payment not found')
      Object.assign(payments[idx], { ...opts.data, updatedAt: new Date().toISOString() })
      return Promise.resolve(payments[idx])
    },
  },

  // ── Websites ──
  website: {
    findMany: (opts?: { where?: any; orderBy?: any; include?: any }) => {
      let result = [...websites]
      return Promise.resolve(result)
    },
    create: (data: { userId: string; businessName: string; category: string; description: string; htmlContent: string; theme: string; status: string }) => {
      const now = new Date().toISOString()
      const website: MockWebsite = {
        id: genId(),
        userId: data.userId,
        businessName: data.businessName,
        category: data.category,
        description: data.description,
        htmlContent: data.htmlContent,
        theme: data.theme || 'modern',
        status: data.status || 'draft',
        domainId: null,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      websites.push(website)
      return Promise.resolve(website)
    },
    update: (opts: { where: { id: string }; data: Partial<MockWebsite> }) => {
      const idx = websites.findIndex(w => w.id === opts.where.id)
      if (idx === -1) throw new Error('Website not found')
      if (opts.data.status === 'published' && !websites[idx].publishedAt) {
        opts.data.publishedAt = new Date().toISOString()
      }
      Object.assign(websites[idx], { ...opts.data, updatedAt: new Date().toISOString() })
      return Promise.resolve(websites[idx])
    },
  },
}
