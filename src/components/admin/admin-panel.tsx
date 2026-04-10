'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Users,
  DollarSign,
  Settings,
  TrendingUp,
  Search,
  ArrowLeft,
  Shield,
  ShoppingCart,
  Eye,
  Ban,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Mail,
  Bell,
  ChevronLeft,
  ChevronRight,
  Activity,
  MoreHorizontal,
  Play,
  Pause,
  Download,
  Filter,
  RefreshCw,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Home,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, ANALYTICS_DATA } from '@/lib/domain-data'
import { toast } from 'sonner'

// ============================================================
// Types
// ============================================================

interface AdminUser {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
  domainsCount: number
  status?: 'active' | 'suspended'
}

interface AdminDomain {
  id: string
  domainName: string
  tld: string
  status: string
  userId: string | null
  registeredAt: string
  expiresAt: string
  locked: boolean
  autoRenew: boolean
}

interface AdminOrder {
  id: string
  orderNumber: string
  type: string
  status: string
  amount: number
  currency: string
  createdAt: string
  userId: string | null
  domainId: string | null
  domain?: { domainName: string } | null
  payments?: Array<{ status: string; method: string; amount: number }>
}

interface AdminStats {
  totalUsers: number
  totalDomains: number
  totalRevenue: number
  activeOrders: number
}

// ============================================================
// Mock Data
// ============================================================

const mockUsers: AdminUser[] = [
  { id: '1', email: 'juma@techhub.co.tz', name: 'Juma Mwangi', phone: '+255678901234', createdAt: '2024-01-15', domainsCount: 5, status: 'active' },
  { id: '2', email: 'fatma@nairobibits.co.tz', name: 'Fatma Hassan', phone: '+255687123456', createdAt: '2024-02-20', domainsCount: 3, status: 'active' },
  { id: '3', email: 'joseph@techpeak.co.tz', name: 'Joseph Mushi', phone: '+255698234567', createdAt: '2024-03-10', domainsCount: 8, status: 'active' },
  { id: '4', email: 'neema@saffron.co.tz', name: 'Neema Kimaro', phone: '+255712345678', createdAt: '2024-04-05', domainsCount: 2, status: 'active' },
  { id: '5', email: 'admin@domainhub.co.tz', name: 'Admin User', phone: '+255623456789', createdAt: '2024-01-01', domainsCount: 12, status: 'active' },
  { id: '6', email: 'samuel@cloudweb.co.tz', name: 'Samuel Mwangi', phone: '+255756789012', createdAt: '2024-05-18', domainsCount: 6, status: 'suspended' },
  { id: '7', email: 'lucy@designhub.co.tz', name: 'Lucy Akinyi', phone: '+255778901234', createdAt: '2024-06-02', domainsCount: 1, status: 'active' },
  { id: '8', email: 'david@fintech.co.tz', name: 'David Kiprop', phone: '+255789012345', createdAt: '2024-07-14', domainsCount: 4, status: 'active' },
]

const mockDomains: AdminDomain[] = [
  { id: 'd1', domainName: 'dar.co.tz', tld: '.co.tz', status: 'registered', userId: '1', registeredAt: '2024-01-20', expiresAt: '2025-01-20', locked: false, autoRenew: true },
  { id: 'd2', domainName: 'techpeak.co.tz', tld: '.co.tz', status: 'registered', userId: '3', registeredAt: '2024-02-15', expiresAt: '2025-02-15', locked: false, autoRenew: false },
  { id: 'd3', domainName: 'saffron.co.tz', tld: '.co.tz', status: 'registered', userId: '4', registeredAt: '2024-03-10', expiresAt: '2025-03-10', locked: true, autoRenew: true },
  { id: 'd4', domainName: 'domainhub.co.tz', tld: '.co.tz', status: 'registered', userId: '5', registeredAt: '2024-01-01', expiresAt: '2025-01-01', locked: false, autoRenew: true },
  { id: 'd5', domainName: 'biashara.tz', tld: '.tz', status: 'expired', userId: '6', registeredAt: '2023-05-18', expiresAt: '2024-05-18', locked: false, autoRenew: false },
  { id: 'd6', domainName: 'shule.ac.tz', tld: '.ac.tz', status: 'pending', userId: '7', registeredAt: '2024-06-02', expiresAt: '2025-06-02', locked: false, autoRenew: false },
  { id: 'd7', domainName: 'fintech.co.tz', tld: '.co.tz', status: 'registered', userId: '8', registeredAt: '2024-07-14', expiresAt: '2025-07-14', locked: false, autoRenew: true },
  { id: 'd8', domainName: 'nairobibits.co.tz', tld: '.co.tz', status: 'registered', userId: '2', registeredAt: '2024-02-20', expiresAt: '2025-02-20', locked: false, autoRenew: true },
  { id: 'd9', domainName: 'safari.co.tz', tld: '.co.tz', status: 'registered', userId: '1', registeredAt: '2024-04-05', expiresAt: '2025-04-05', locked: true, autoRenew: false },
  { id: 'd10', domainName: 'michezo.tz', tld: '.tz', status: 'suspended', userId: '3', registeredAt: '2024-01-30', expiresAt: '2025-01-30', locked: false, autoRenew: false },
  { id: 'd11', domainName: 'afya.co.tz', tld: '.co.tz', status: 'registered', userId: '2', registeredAt: '2024-08-01', expiresAt: '2025-08-01', locked: false, autoRenew: true },
  { id: 'd12', domainName: 'fedha.co.tz', tld: '.co.tz', status: 'registered', userId: '4', registeredAt: '2024-09-10', expiresAt: '2025-09-10', locked: false, autoRenew: false },
]

const mockOrders: AdminOrder[] = [
  { id: 'o1', orderNumber: 'ORD-2024-001', type: 'domain_registration', status: 'completed', amount: 35000, currency: 'TZS', createdAt: '2024-01-20', userId: '1', domainId: 'd1', payments: [{ status: 'completed', method: 'mpesa', amount: 35000 }] },
  { id: 'o2', orderNumber: 'ORD-2024-002', type: 'domain_registration', status: 'completed', amount: 120000, currency: 'TZS', createdAt: '2024-02-15', userId: '3', domainId: 'd2' },
  { id: 'o3', orderNumber: 'ORD-2024-003', type: 'domain_renewal', status: 'completed', amount: 35000, currency: 'TZS', createdAt: '2024-03-10', userId: '4', domainId: 'd3' },
  { id: 'o4', orderNumber: 'ORD-2024-004', type: 'hosting_business', status: 'completed', amount: 180000, currency: 'TZS', createdAt: '2024-03-15', userId: '1', domainId: null },
  { id: 'o5', orderNumber: 'ORD-2024-005', type: 'ssl_wildcard', status: 'pending', amount: 180000, currency: 'TZS', createdAt: '2024-04-05', userId: '5', domainId: null },
  { id: 'o6', orderNumber: 'ORD-2024-006', type: 'email_business', status: 'completed', amount: 60000, currency: 'TZS', createdAt: '2024-05-10', userId: '3', domainId: null },
  { id: 'o7', orderNumber: 'ORD-2024-007', type: 'domain_registration', status: 'failed', amount: 87500, currency: 'TZS', createdAt: '2024-05-18', userId: '6', domainId: null },
  { id: 'o8', orderNumber: 'ORD-2024-008', type: 'domain_registration', status: 'pending', amount: 25000, currency: 'TZS', createdAt: '2024-06-02', userId: '7', domainId: 'd6' },
  { id: 'o9', orderNumber: 'ORD-2024-009', type: 'bundle_premium', status: 'completed', amount: 200000, currency: 'TZS', createdAt: '2024-07-14', userId: '8', domainId: null },
  { id: 'o10', orderNumber: 'ORD-2024-010', type: 'domain_transfer', status: 'completed', amount: 30000, currency: 'TZS', createdAt: '2024-08-01', userId: '2', domainId: 'd8' },
  { id: 'o11', orderNumber: 'ORD-2024-011', type: 'domain_registration', status: 'completed', amount: 62500, currency: 'TZS', createdAt: '2024-09-10', userId: '4', domainId: 'd12' },
  { id: 'o12', orderNumber: 'ORD-2024-012', type: 'hosting_starter', status: 'pending', amount: 50000, currency: 'TZS', createdAt: '2024-10-02', userId: '7', domainId: null },
]

const mockStats: AdminStats = {
  totalUsers: 2480,
  totalDomains: 6540,
  totalRevenue: 85000000,
  activeOrders: 156,
}

// ============================================================
// Helper functions
// ============================================================

function getStatusBadge(status: string) {
  switch (status) {
    case 'registered':
    case 'completed':
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Active</Badge>
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Pending</Badge>
    case 'expired':
    case 'failed':
    case 'suspended':
      return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getOrderTypeLabel(type: string) {
  const labels: Record<string, string> = {
    domain_registration: 'Domain Registration',
    domain_renewal: 'Domain Renewal',
    domain_transfer: 'Domain Transfer',
    hosting_starter: 'Starter Hosting',
    hosting_business: 'Business Hosting',
    hosting_enterprise: 'Enterprise Hosting',
    ssl_wildcard: 'Wildcard SSL',
    ssl_ev: 'EV SSL',
    email_business: 'Business Email',
    email_enterprise: 'Enterprise Email',
    bundle_starter: 'Starter Bundle',
    bundle_business: 'Business Bundle',
    bundle_premium: 'Premium Bundle',
  }
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ============================================================
// Pagination Hook
// ============================================================

function usePagination<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const paginatedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize)

  const goNext = () => setPage((p) => Math.min(p + 1, totalPages || 1))
  const goPrev = () => setPage((p) => Math.max(p - 1, 1))

  return { page: safePage, totalPages, paginatedItems, goNext, goPrev }
}

// ============================================================
// Skeleton Loaders
// ============================================================

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 w-full">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 flex gap-3">
          <Skeleton className="h-9 flex-1 max-w-sm" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: cols }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, r) => (
              <TableRow key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <TableCell key={c}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4 flex justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Simple Bar Chart Component (CSS-based)
// ============================================================

function BarChart({
  data,
  dataKey,
  labelKey,
  maxVal,
  color = 'bg-emerald-500',
  height = 180,
}: {
  data: Array<Record<string, unknown>>
  dataKey: string
  labelKey: string
  maxVal?: number
  color?: string
  height?: number
}) {
  const computedMax = maxVal || Math.max(...data.map((d) => Number(d[dataKey]) || 0))

  return (
    <div className="flex items-end gap-1 sm:gap-2" style={{ height }}>
      {data.map((item, idx) => {
        const value = Number(item[dataKey]) || 0
        const pct = computedMax > 0 ? (value / computedMax) * 100 : 0
        return (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate w-full text-center">
              {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            </span>
            <motion.div
              className={`w-full rounded-t-sm ${color}`}
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.6, delay: idx * 0.04, ease: 'easeOut' }}
              style={{ minHeight: 4 }}
            />
            <span className="text-[10px] sm:text-xs text-slate-500 truncate w-full text-center">
              {String(item[labelKey])}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewTab({ stats, loadingStats }: { stats: AdminStats | null; loadingStats: boolean }) {
  const analytics = ANALYTICS_DATA

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers.toLocaleString() || '0',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Users,
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Total Domains',
      value: stats?.totalDomains.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Globe,
      iconBg: 'bg-cyan-100 text-cyan-600',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      change: '+23.1%',
      changeType: 'positive' as const,
      icon: DollarSign,
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Active Orders',
      value: stats?.activeOrders.toString() || '0',
      change: '-3.4%',
      changeType: 'negative' as const,
      icon: ShoppingCart,
      iconBg: 'bg-violet-100 text-violet-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      {loadingStats ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp
                          className={`size-3.5 ${stat.changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}
                        />
                        <span
                          className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {stat.change}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                      <stat.icon className="size-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue for the current year</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analytics.monthlyRevenue}
                dataKey="revenue"
                labelKey="month"
                color="bg-emerald-500"
                height={200}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue by Service */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Revenue by Service</CardTitle>
              <CardDescription>Distribution breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.revenueByService.map((service, idx) => (
                  <motion.div
                    key={service.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{service.name}</span>
                      <span className="text-sm text-muted-foreground">{service.value}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: service.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${service.value}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Registration Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Domain Registration Trends</CardTitle>
              <CardDescription>New registrations per month</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analytics.monthlyRevenue}
                dataKey="domains"
                labelKey="month"
                color="bg-cyan-500"
                height={180}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* TLD Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TLD Distribution</CardTitle>
              <CardDescription>Most popular domain extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TLD</TableHead>
                      <TableHead className="text-right">Domains</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                      <TableHead className="w-24">Bar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.tldDistribution.map((tld) => (
                      <TableRow key={tld.tld}>
                        <TableCell className="font-medium">{tld.tld}</TableCell>
                        <TableCell className="text-right">{tld.count.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{tld.percentage}%</TableCell>
                        <TableCell>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-emerald-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${tld.percentage}%` }}
                              transition={{ duration: 0.6 }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================
// Domain Management Tab
// ============================================================

function DomainsTab({ domains, loading }: { domains: AdminDomain[]; loading: boolean }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionDialog, setActionDialog] = useState<{ open: boolean; domain: AdminDomain | null; action: string }>({
    open: false,
    domain: null,
    action: '',
  })

  const filtered = useMemo(() => {
    return domains.filter((d) => {
      const matchSearch =
        d.domainName.toLowerCase().includes(search.toLowerCase()) ||
        d.tld.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [domains, search, statusFilter])

  const { page, totalPages, paginatedItems, goNext, goPrev } = usePagination(filtered, 8)

  const handleAction = (domain: AdminDomain, action: string) => {
    setActionDialog({ open: true, domain, action })
  }

  const confirmAction = () => {
    if (!actionDialog.domain) return
    const actionNames: Record<string, string> = {
      activate: 'activated',
      suspend: 'suspended',
      delete: 'deleted',
    }
    toast.success(
      `Domain ${actionDialog.domain.domainName} has been ${actionNames[actionDialog.action] || 'updated'} successfully.`
    )
    setActionDialog({ open: false, domain: null, action: '' })
  }

  if (loading) return <TableSkeleton rows={8} cols={6} />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="size-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Domains Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Registered</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead className="hidden sm:table-cell">Auto-Renew</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Globe className="size-8 mx-auto mb-2 opacity-50" />
                    No domains found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 text-emerald-500 shrink-0" />
                        <span className="font-medium">{domain.domainName}</span>
                        <Badge variant="outline" className="text-xs hidden lg:inline-flex">{domain.tld}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(domain.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(domain.registeredAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(domain.expiresAt)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {domain.autoRenew ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {domain.status === 'registered' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(domain, 'suspend')}
                            title="Suspend domain"
                          >
                            <Pause className="size-4 text-amber-500" />
                          </Button>
                        )}
                        {(domain.status === 'suspended' || domain.status === 'expired') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(domain, 'activate')}
                            title="Activate domain"
                          >
                            <Play className="size-4 text-emerald-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(domain, 'delete')}
                          title="Delete domain"
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 8 + 1}–{Math.min(page * 8, filtered.length)} of {filtered.length} domains
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={page <= 1}>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={page >= totalPages}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ open, domain: null, action: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'delete'
                ? 'Delete Domain'
                : actionDialog.action === 'suspend'
                ? 'Suspend Domain'
                : 'Activate Domain'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionDialog.action}{' '}
              <span className="font-semibold">{actionDialog.domain?.domainName}</span>?
              {actionDialog.action === 'delete' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, domain: null, action: '' })}
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'delete' ? 'destructive' : 'default'}
              onClick={confirmAction}
            >
              {actionDialog.action === 'delete' ? 'Delete' : actionDialog.action === 'suspend' ? 'Suspend' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// User Management Tab
// ============================================================

function UsersTab({ users, loading }: { users: AdminUser[]; loading: boolean }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [users, search, statusFilter])

  const { page, totalPages, paginatedItems, goNext, goPrev } = usePagination(filtered, 6)

  const handleSuspend = () => {
    if (!suspendDialog.user) return
    toast.success(
      `User ${suspendDialog.user.name} has been ${suspendDialog.user.status === 'suspended' ? 'reactivated' : 'suspended'} successfully.`
    )
    setSuspendDialog({ open: false, user: null })
  }

  if (loading) return <TableSkeleton rows={6} cols={5} />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="size-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead className="hidden md:table-cell">Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-50" />
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.domainsCount} domains</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailDialog({ open: true, user })}
                          title="View details"
                        >
                          <Eye className="size-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSuspendDialog({ open: true, user })}
                          title={user.status === 'suspended' ? 'Reactivate user' : 'Suspend user'}
                        >
                          {user.status === 'suspended' ? (
                            <Play className="size-4 text-emerald-500" />
                          ) : (
                            <Ban className="size-4 text-amber-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 6 + 1}–{Math.min(page * 6, filtered.length)} of {filtered.length} users
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={page <= 1}>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={page >= totalPages}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the user</DialogDescription>
          </DialogHeader>
          {detailDialog.user && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-semibold">{detailDialog.user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{detailDialog.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-semibold">{detailDialog.user.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Domains</p>
                  <p className="font-semibold">{detailDialog.user.domainsCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(detailDialog.user.status || 'active')}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registered</p>
                  <p className="font-semibold">{formatDate(detailDialog.user.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, user: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Reactivate Dialog */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) => setSuspendDialog({ open, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendDialog.user?.status === 'suspended' ? 'Reactivate User' : 'Suspend User'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {suspendDialog.user?.status === 'suspended' ? 'reactivate' : 'suspend'}{' '}
              <span className="font-semibold">{suspendDialog.user?.name}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              variant={suspendDialog.user?.status === 'suspended' ? 'default' : 'destructive'}
              onClick={handleSuspend}
            >
              {suspendDialog.user?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Order Management Tab
// ============================================================

function OrdersTab({ orders, loading }: { orders: AdminOrder[]; loading: boolean }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        getOrderTypeLabel(o.type).toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const { page, totalPages, paginatedItems, goNext, goPrev } = usePagination(filtered, 8)

  if (loading) return <TableSkeleton rows={8} cols={6} />

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="size-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Domain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="size-8 mx-auto mb-2 opacity-50" />
                    No orders found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">{order.orderNumber}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{getOrderTypeLabel(order.type)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.amount, order.currency)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {order.domain?.domainName || <span className="text-slate-400">—</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * 8 + 1}–{Math.min(page * 8, filtered.length)} of {filtered.length} orders
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={page <= 1}>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={page >= totalPages}>
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Settings Tab
// ============================================================

function SettingsTab() {
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'DomainHub',
    supportEmail: 'support@domainhub.co',
    currency: 'TZS',
  })
  const [paymentSettings, setPaymentSettings] = useState({
    mpesaEnabled: true,
    airtelEnabled: false,
    testMode: false,
  })
  const [dnsSettings, setDnsSettings] = useState({
    nameserver1: 'ns1.domainhub.co.tz',
    nameserver2: 'ns2.domainhub.co.tz',
  })
  const [notificationSettings, setNotificationSettings] = useState({
    renewalReminders: true,
    expiryAlerts: true,
    paymentConfirmations: true,
    marketingEmails: false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSaving(false)
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="size-5 text-slate-500" />
              <div>
                <CardTitle className="text-base">General Settings</CardTitle>
                <CardDescription>Configure your platform preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={generalSettings.platformName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={generalSettings.supportEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={generalSettings.currency}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, currency: value })}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-slate-500" />
              <div>
                <CardTitle className="text-base">Payment Settings</CardTitle>
                <CardDescription>Configure payment gateways and options</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>M-Pesa (Vodacom Tanzania)</Label>
                  <p className="text-sm text-muted-foreground">Enable M-Pesa mobile money payments via Vodacom Tanzania</p>
                </div>
                <Switch
                  checked={paymentSettings.mpesaEnabled}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, mpesaEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Airtel Money Tanzania</Label>
                  <p className="text-sm text-muted-foreground">Enable Airtel Money Tanzania payments</p>
                </div>
                <Switch
                  checked={paymentSettings.airtelEnabled}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, airtelEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Test Mode</Label>
                  <p className="text-sm text-muted-foreground">Process payments in sandbox mode</p>
                </div>
                <Switch
                  checked={paymentSettings.testMode}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, testMode: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* DNS Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="size-5 text-slate-500" />
              <div>
                <CardTitle className="text-base">DNS Settings</CardTitle>
                <CardDescription>Default nameservers for new domains</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ns1">Primary Nameserver</Label>
                <Input
                  id="ns1"
                  value={dnsSettings.nameserver1}
                  onChange={(e) => setDnsSettings({ ...dnsSettings, nameserver1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ns2">Secondary Nameserver</Label>
                <Input
                  id="ns2"
                  value={dnsSettings.nameserver2}
                  onChange={(e) => setDnsSettings({ ...dnsSettings, nameserver2: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-slate-500" />
              <div>
                <CardTitle className="text-base">Notification Settings</CardTitle>
                <CardDescription>Configure email notifications for users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Renewal Reminders</Label>
                <p className="text-sm text-muted-foreground">Send reminders before domain expiry</p>
              </div>
              <Switch
                checked={notificationSettings.renewalReminders}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, renewalReminders: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">Send alerts when domains expire</p>
              </div>
              <Switch
                checked={notificationSettings.expiryAlerts}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, expiryAlerts: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Confirmations</Label>
                <p className="text-sm text-muted-foreground">Send payment confirmation emails</p>
              </div>
              <Switch
                checked={notificationSettings.paymentConfirmations}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, paymentConfirmations: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Send promotional emails and offers</p>
              </div>
              <Switch
                checked={notificationSettings.marketingEmails}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, marketingEmails: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// Main Admin Panel Component
// ============================================================

export function AdminPanel() {
  const { navigate, logout, user } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Data states
  const [domains, setDomains] = useState<AdminDomain[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)

  // Loading states
  const [loadingDomains, setLoadingDomains] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      // Fetch domains
      try {
        const res = await fetch('/api/domains')
        if (res.ok) {
          const data = await res.json()
          setDomains(data.domains || [])
        } else {
          throw new Error('Failed to fetch domains')
        }
      } catch {
        setDomains(mockDomains)
      } finally {
        setLoadingDomains(false)
      }

      // Fetch users
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users || [])
        } else {
          throw new Error('Failed to fetch users')
        }
      } catch {
        setUsers(mockUsers)
      } finally {
        setLoadingUsers(false)
      }

      // Fetch orders
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        } else {
          throw new Error('Failed to fetch orders')
        }
      } catch {
        setOrders(mockOrders)
      } finally {
        setLoadingOrders(false)
      }

      // Fetch stats
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        } else {
          throw new Error('Failed to fetch stats')
        }
      } catch {
        setStats(mockStats)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchData()
  }, [])

  const navItems = [
    { value: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { value: 'domains', label: 'Domains', icon: <Globe className="w-4 h-4" /> },
    { value: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { value: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { value: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ]

  const handleNavClick = useCallback((tab: string) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar - Desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">DomainHub</span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-1 ml-10">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => handleNavClick(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.value
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          ))}
          <Separator className="my-3" />
          <button
            onClick={() => navigate('dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="flex-1 text-left">View User Dashboard</span>
          </button>
          <button
            onClick={() => navigate('home')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="flex-1 text-left">Back to Site</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@domainhub.co'}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl z-50 lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-xl">DomainHub</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-amber-600 font-medium px-6 pb-2">Admin Panel</p>
              <nav className="px-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => handleNavClick(item.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.value
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
                <Separator className="my-3" />
                <button
                  onClick={() => { navigate('dashboard'); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>View User Dashboard</span>
                </button>
                <button
                  onClick={() => { navigate('home'); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Site</span>
                </button>
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Admin'}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@domainhub.co'}</p>
                  </div>
                  <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold text-slate-900">Admin Control Panel</h1>
            </div>
            <p className="text-sm text-muted-foreground">DomainHub Management Console</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('dashboard')}
              className="hidden sm:flex gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              User Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('home')}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Site</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' as const }}
            >
              {activeTab === 'overview' && (
                <OverviewTab stats={stats} loadingStats={loadingStats} />
              )}
              {activeTab === 'domains' && (
                <DomainsTab domains={domains} loading={loadingDomains} />
              )}
              {activeTab === 'users' && (
                <UsersTab users={users} loading={loadingUsers} />
              )}
              {activeTab === 'orders' && (
                <OrdersTab orders={orders} loading={loadingOrders} />
              )}
              {activeTab === 'settings' && (
                <SettingsTab />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
