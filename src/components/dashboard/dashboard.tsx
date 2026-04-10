'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Settings, RefreshCw, Lock, Unlock, Calendar, AlertTriangle,
  ChevronRight, ChevronDown, ExternalLink, Plus, Trash2, Shield, Clock, CheckCircle,
  LayoutDashboard, CreditCard, FileText, Search, Sparkles, Menu, X, LogOut, User,
  Edit3, Eye, EyeOff, ArrowRightLeft, KeyRound, AlertCircle, Crown, Filter, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, type AppPage } from '@/store/app-store'
import { formatCurrency, getDaysUntilExpiry, getExpiryStatus, TLD_PRICING, SWAHILI, ENGLISH } from '@/lib/domain-data'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────────────

interface Domain {
  id: string
  domainName: string
  tld: string
  status: string
  registeredAt: string | null
  expiresAt: string | null
  locked: boolean
  autoRenew: boolean
  whoisPrivacy?: boolean
  transferCode?: string
  dnsRecords?: DnsRecord[]
}

interface DnsRecord {
  id: string
  type: string
  name: string
  value: string
  priority: number | null
  ttl: number
}

interface Order {
  id: string
  orderNumber: string
  type: string
  status: string
  amount: number
  currency: string
  createdAt: string
  domain?: Domain | null
}

// ── Constants ──────────────────────────────────────────────────────────────

const DNS_RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'] as const
type DnsType = (typeof DNS_RECORD_TYPES)[number]

const DNS_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  A:     { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200' },
  AAAA:  { bg: 'bg-teal-50',     text: 'text-teal-700',     border: 'border-teal-200' },
  CNAME: { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200' },
  MX:    { bg: 'bg-sky-50',      text: 'text-sky-700',      border: 'border-sky-200' },
  TXT:   { bg: 'bg-violet-50',   text: 'text-violet-700',   border: 'border-violet-200' },
  NS:    { bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-200' },
  SRV:   { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200' },
}

const DNS_TYPE_PLACEHOLDERS: Record<string, string> = {
  A:     '192.168.1.1',
  AAAA:  '2001:0db8:85a3::8a2e:0370:7334',
  CNAME: 'www.example.com',
  MX:    'mail.example.com',
  TXT:   'v=spf1 include:_spf.example.com ~all',
  NS:    'ns1.domainhub.co.tz',
  SRV:   '_sip._tcp.example.com',
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    registered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    available: 'bg-blue-50 text-blue-700 border-blue-200',
    transferring: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return styles[status] || 'bg-muted text-slate-700'
}

function getOrderTypeBadge(type: string) {
  const styles: Record<string, string> = {
    domain_registration: 'bg-emerald-50 text-emerald-700',
    domain_renewal: 'bg-blue-50 text-blue-700',
    hosting: 'bg-purple-50 text-purple-700',
    email: 'bg-amber-50 text-amber-700',
    ssl: 'bg-teal-50 text-teal-700',
    website: 'bg-pink-50 text-pink-700',
  }
  const labels: Record<string, string> = {
    domain_registration: 'Registration',
    domain_renewal: 'Renewal',
    hosting: 'Hosting',
    email: 'Email',
    ssl: 'SSL',
    website: 'Website',
  }
  return (
    <Badge variant="outline" className={styles[type] || ''}>
      {labels[type] || type}
    </Badge>
  )
}

function getDnsTypeBadge(type: string) {
  const style = DNS_TYPE_STYLES[type] || { bg: 'bg-muted', text: 'text-slate-700', border: 'border-border' }
  return (
    <Badge variant="outline" className={`font-mono text-xs font-semibold ${style.bg} ${style.text} ${style.border}`}>
      {type}
    </Badge>
  )
}

// ── Fade-in animation ──────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: 'easeOut' },
}

// ══════════════════════════════════════════════════════════════════════════
// Main Dashboard Component
// ══════════════════════════════════════════════════════════════════════════

export function Dashboard() {
  const { navigate, logout, user, cart, isAdmin } = useAppStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [domains, setDomains] = useState<Domain[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([])
  const [dnsLoading, setDnsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // DNS filter
  const [dnsFilter, setDnsFilter] = useState<string>('all')

  // Add DNS dialog state
  const [dnsDialogOpen, setDnsDialogOpen] = useState(false)
  const [newDnsType, setNewDnsType] = useState<DnsType>('A')
  const [newDnsName, setNewDnsName] = useState('@')
  const [newDnsValue, setNewDnsValue] = useState('')
  const [newDnsPriority, setNewDnsPriority] = useState('')
  const [newDnsTtl, setNewDnsTtl] = useState('3600')
  const [dnsSubmitting, setDnsSubmitting] = useState(false)

  // Edit DNS dialog state
  const [editDnsDialogOpen, setEditDnsDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null)
  const [editDnsType, setEditDnsType] = useState<DnsType>('A')
  const [editDnsName, setEditDnsName] = useState('')
  const [editDnsValue, setEditDnsValue] = useState('')
  const [editDnsPriority, setEditDnsPriority] = useState('')
  const [editDnsTtl, setEditDnsTtl] = useState('3600')

  // Transfer dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferCode, setTransferCode] = useState('')
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false)
  const [transferring, setTransferring] = useState(false)

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDnsId, setDeletingDnsId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [domainsRes, ordersRes] = await Promise.all([
        fetch('/api/domains'),
        fetch('/api/orders'),
      ])
      if (domainsRes.ok) {
        const data = await domainsRes.json()
        setDomains(data.domains)
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(data.orders)
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDomainClick = useCallback(async (domain: Domain) => {
    setSelectedDomain(domain)
    setDnsLoading(true)
    setDnsFilter('all')
    setActiveTab('domain-detail')
    try {
      const res = await fetch(`/api/dns?domainId=${domain.id}`)
      if (res.ok) {
        const data = await res.json()
        setDnsRecords(data.records)
      }
    } catch {
      toast.error('Failed to load DNS records')
    } finally {
      setDnsLoading(false)
    }
  }, [])

  const updateDomainState = useCallback((updatedDomain: Domain) => {
    setDomains(prev => prev.map(d => d.id === updatedDomain.id ? updatedDomain : d))
    setSelectedDomain(updatedDomain)
  }, [])

  const handleToggleLock = useCallback(async () => {
    if (!selectedDomain) return
    try {
      const res = await fetch('/api/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: selectedDomain.id, locked: !selectedDomain.locked }),
      })
      if (res.ok) {
        const data = await res.json()
        updateDomainState(data.domain)
        toast.success(data.domain.locked ? 'Domain locked successfully' : 'Domain unlocked successfully')
      }
    } catch {
      toast.error('Failed to update domain lock')
    }
  }, [selectedDomain, updateDomainState])

  const handleToggleAutoRenew = useCallback(async () => {
    if (!selectedDomain) return
    try {
      const res = await fetch('/api/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: selectedDomain.id, autoRenew: !selectedDomain.autoRenew }),
      })
      if (res.ok) {
        const data = await res.json()
        updateDomainState(data.domain)
        toast.success(data.domain.autoRenew ? 'Auto-renewal enabled' : 'Auto-renewal disabled')
      }
    } catch {
      toast.error('Failed to update auto-renewal')
    }
  }, [selectedDomain, updateDomainState])

  const handleToggleWhoisPrivacy = useCallback(async () => {
    if (!selectedDomain) return
    try {
      const res = await fetch('/api/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: selectedDomain.id, whoisPrivacy: !selectedDomain.whoisPrivacy }),
      })
      if (res.ok) {
        const data = await res.json()
        updateDomainState(data.domain)
        toast.success(data.domain.whoisPrivacy ? 'WHOIS privacy protection enabled' : 'WHOIS privacy protection disabled')
      }
    } catch {
      toast.error('Failed to update WHOIS privacy')
    }
  }, [selectedDomain, updateDomainState])

  const handleRenew = useCallback((domain: Domain) => {
    const { startCheckout } = useAppStore.getState()
    startCheckout(1500, `Domain Renewal: ${domain.domainName}`)
  }, [])

  // ── DNS operations ──

  const openAddDnsDialog = useCallback(() => {
    setNewDnsType('A')
    setNewDnsName('@')
    setNewDnsValue('')
    setNewDnsPriority('')
    setNewDnsTtl('3600')
    setDnsDialogOpen(true)
  }, [])

  const handleAddDns = useCallback(async () => {
    if (!selectedDomain || !newDnsValue.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    setDnsSubmitting(true)
    try {
      const res = await fetch('/api/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: selectedDomain.id,
          type: newDnsType,
          name: newDnsName,
          value: newDnsValue,
          priority: newDnsPriority ? parseInt(newDnsPriority) : null,
          ttl: parseInt(newDnsTtl),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDnsRecords(prev => [...prev, data.record])
        setDnsDialogOpen(false)
        toast.success(`${newDnsType} record added successfully`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add DNS record')
      }
    } catch {
      toast.error('Failed to add DNS record')
    } finally {
      setDnsSubmitting(false)
    }
  }, [selectedDomain, newDnsType, newDnsName, newDnsValue, newDnsPriority, newDnsTtl])

  const openEditDnsDialog = useCallback((record: DnsRecord) => {
    setEditingRecord(record)
    setEditDnsType(record.type as DnsType)
    setEditDnsName(record.name)
    setEditDnsValue(record.value)
    setEditDnsPriority(record.priority?.toString() || '')
    setEditDnsTtl(record.ttl.toString())
    setEditDnsDialogOpen(true)
  }, [])

  const handleEditDns = useCallback(async () => {
    if (!editingRecord || !editDnsValue.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    setDnsSubmitting(true)
    try {
      const res = await fetch('/api/dns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          type: editDnsType,
          name: editDnsName,
          value: editDnsValue,
          priority: editDnsPriority ? parseInt(editDnsPriority) : null,
          ttl: parseInt(editDnsTtl),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setDnsRecords(prev => prev.map(r => r.id === data.record.id ? data.record : r))
        setEditDnsDialogOpen(false)
        setEditingRecord(null)
        toast.success(`${editDnsType} record updated successfully`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update DNS record')
      }
    } catch {
      toast.error('Failed to update DNS record')
    } finally {
      setDnsSubmitting(false)
    }
  }, [editingRecord, editDnsType, editDnsName, editDnsValue, editDnsPriority, editDnsTtl])

  const confirmDeleteDns = useCallback((id: string) => {
    setDeletingDnsId(id)
    setDeleteConfirmOpen(true)
  }, [])

  const handleDeleteDns = useCallback(async () => {
    if (!deletingDnsId) return
    try {
      const res = await fetch(`/api/dns?id=${deletingDnsId}`, { method: 'DELETE' })
      if (res.ok) {
        setDnsRecords(prev => prev.filter(r => r.id !== deletingDnsId))
        toast.success('DNS record deleted')
      }
    } catch {
      toast.error('Failed to delete DNS record')
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingDnsId(null)
    }
  }, [deletingDnsId])

  // ── Transfer operations ──

  const handleOpenTransferDialog = useCallback(() => {
    setTransferCode('')
    setTransferDialogOpen(true)
  }, [])

  const handleTransferSubmit = useCallback(() => {
    if (!transferCode.trim()) {
      toast.error('Please enter the authorization code')
      return
    }
    setTransferConfirmOpen(true)
  }, [transferCode])

  const handleConfirmTransfer = useCallback(async () => {
    if (!selectedDomain) return
    setTransferring(true)
    try {
      const res = await fetch('/api/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: selectedDomain.id,
          action: 'transfer',
          transferCode,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        updateDomainState(data.domain)
        toast.success('Transfer initiated successfully. Check your email for confirmation.')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Transfer failed')
      }
    } catch {
      toast.error('Failed to initiate transfer')
    } finally {
      setTransferring(false)
      setTransferConfirmOpen(false)
      setTransferDialogOpen(false)
    }
  }, [selectedDomain, transferCode, updateDomainState])

  // ── Computed ──

  const filteredDnsRecords = useMemo(() => {
    if (dnsFilter === 'all') return dnsRecords
    return dnsRecords.filter(r => r.type === dnsFilter)
  }, [dnsRecords, dnsFilter])

  const activeDnsTypes = useMemo(() => {
    const types = new Set(dnsRecords.map(r => r.type))
    return DNS_RECORD_TYPES.filter(t => types.has(t))
  }, [dnsRecords])

  const totalSpent = useMemo(
    () => orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0),
    [orders]
  )
  const expiringDomains = useMemo(
    () => domains.filter(d => d.expiresAt && getDaysUntilExpiry(d.expiresAt) <= 90),
    [domains]
  )

  // ── Navigation ──

  const navItems: { label: string; icon: React.ReactNode; page: AppPage; badge?: number }[] = useMemo(() => [
    { label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, page: 'dashboard' },
    { label: 'My Domains', icon: <Globe className="w-4 h-4" />, page: 'domains', badge: domains.length },
    { label: 'Search Domains', icon: <Search className="w-4 h-4" />, page: 'search' },
    { label: 'AI Builder', icon: <Sparkles className="w-4 h-4" />, page: 'builder' },
    { label: 'Billing', icon: <CreditCard className="w-4 h-4" />, page: 'billing' },
    { label: 'Premium', icon: <Crown className="w-4 h-4" />, page: 'premium-domains' },
  ], [domains.length])

  const adminNavItem = useMemo(() => ({
    label: 'Admin Panel', icon: <Shield className="w-4 h-4" />, page: 'admin' as AppPage,
  }), [])

  const handleNavClick = useCallback((page: AppPage) => {
    if (page === 'dashboard' || page === 'domains') {
      setActiveTab(page === 'domains' ? 'domains' : 'overview')
      setSelectedDomain(null)
    } else {
      navigate(page)
    }
    setSidebarOpen(false)
  }, [navigate])

  // ════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-muted flex">
      {/* ── Sidebar - Desktop ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-background border-r border-border fixed h-screen">
        <div className="p-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
            <Globe className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-xl text-foreground">DomainHub</span>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                (item.page === 'dashboard' && activeTab === 'overview' && !selectedDomain) ||
                (item.page === 'domains' && activeTab === 'domains')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <Badge variant="secondary" className="text-xs bg-muted">{item.badge}</Badge>
              )}
            </button>
          ))}
          {isAdmin && (
            <>
              <Separator className="my-3" />
              <button
                onClick={() => handleNavClick(adminNavItem.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {adminNavItem.icon}
                <span className="flex-1 text-left">{adminNavItem.label}</span>
              </button>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          {cart.length > 0 && (
            <Button
              variant="outline"
              className="w-full mb-3 justify-between text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => {
                const total = cart.reduce((s, i) => s + i.price * i.years, 0)
                const desc = cart.map(c => c.domain).join(', ')
                useAppStore.getState().startCheckout(total, desc)
              }}
            >
              <span>Cart ({cart.length})</span>
              <span>{formatCurrency(cart.reduce((s, i) => s + i.price * i.years, 0))}</span>
            </Button>
          )}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-red-500 transition-colors">
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
              className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-xl z-50 lg:hidden"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-6 h-6 text-emerald-600" />
                  <span className="font-bold text-xl">DomainHub</span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="px-3 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.page)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <Badge variant="secondary" className="text-xs bg-muted ml-auto">{item.badge}</Badge>
                    )}
                  </button>
                ))}
                {isAdmin && (
                  <>
                    <Separator className="my-3" />
                    <button
                      onClick={() => handleNavClick(adminNavItem.page)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent"
                    >
                      {adminNavItem.icon}
                      <span>{adminNavItem.label}</span>
                    </button>
                  </>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="bg-background border-b border-border px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {selectedDomain ? selectedDomain.domainName : 'Dashboard'}
            </h1>
            {selectedDomain && (
              <button
                onClick={() => { setSelectedDomain(null); setActiveTab('domains') }}
                className="text-sm text-emerald-600 hover:underline"
              >
                ← Back to domains
              </button>
            )}
          </div>
          <Button onClick={() => navigate('search')} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Search className="w-4 h-4 mr-1" /> Search
          </Button>
        </header>

        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {/* Domain Detail View */}
            {selectedDomain ? (
              <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' as const }}>
                <DomainDetailView
                  domain={selectedDomain}
                  dnsRecords={filteredDnsRecords}
                  allDnsRecords={dnsRecords}
                  dnsLoading={dnsLoading}
                  dnsFilter={dnsFilter}
                  activeDnsTypes={activeDnsTypes}
                  onFilterChange={setDnsFilter}
                  onToggleLock={handleToggleLock}
                  onToggleAutoRenew={handleToggleAutoRenew}
                  onToggleWhoisPrivacy={handleToggleWhoisPrivacy}
                  onRenew={() => handleRenew(selectedDomain)}
                  onAddDns={openAddDnsDialog}
                  onEditDns={openEditDnsDialog}
                  onDeleteDns={confirmDeleteDns}
                  onTransfer={handleOpenTransferDialog}
                />
              </motion.div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' as const }}>
                    <OverviewTab
                      domains={domains}
                      orders={orders}
                      loading={loading}
                      totalSpent={totalSpent}
                      expiringDomains={expiringDomains}
                      onDomainClick={handleDomainClick}
                      onNavigate={navigate}
                      setActiveTab={setActiveTab}
                    />
                  </motion.div>
                )}
                {activeTab === 'domains' && (
                  <motion.div key="domains" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' as const }}>
                    <DomainsTab
                      domains={domains}
                      loading={loading}
                      onDomainClick={handleDomainClick}
                      onNavigate={navigate}
                    />
                  </motion.div>
                )}
                {activeTab === 'billing' && (
                  <motion.div key="billing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: 'easeOut' as const }}>
                    <BillingTab orders={orders} loading={loading} />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Add DNS Record Dialog ── */}
      <Dialog open={dnsDialogOpen} onOpenChange={setDnsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Add DNS Record
            </DialogTitle>
            <DialogDescription>Add a new DNS record for {selectedDomain?.domainName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Record Type</Label>
              <Select value={newDnsType} onValueChange={(v: DnsType) => { setNewDnsType(v); setNewDnsValue('') }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DNS_RECORD_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name / Host</Label>
              <Input placeholder="@" value={newDnsName} onChange={(e) => setNewDnsName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Value / Points to</Label>
              <Input
                placeholder={DNS_TYPE_PLACEHOLDERS[newDnsType] || 'Value'}
                value={newDnsValue}
                onChange={(e) => setNewDnsValue(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority (optional)</Label>
                <Input placeholder="10" value={newDnsPriority} onChange={(e) => setNewDnsPriority(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>TTL (seconds)</Label>
                <Input placeholder="3600" value={newDnsTtl} onChange={(e) => setNewDnsTtl(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDnsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddDns} disabled={dnsSubmitting}>
              {dnsSubmitting ? 'Adding...' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit DNS Record Dialog ── */}
      <Dialog open={editDnsDialogOpen} onOpenChange={setEditDnsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-600" />
              Edit DNS Record
            </DialogTitle>
            <DialogDescription>Modify the {editingRecord?.type} record for {selectedDomain?.domainName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Record Type</Label>
              <Select value={editDnsType} onValueChange={(v: DnsType) => setEditDnsType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DNS_RECORD_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name / Host</Label>
              <Input value={editDnsName} onChange={(e) => setEditDnsName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Value / Points to</Label>
              <Input
                placeholder={DNS_TYPE_PLACEHOLDERS[editDnsType] || 'Value'}
                value={editDnsValue}
                onChange={(e) => setEditDnsValue(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority (optional)</Label>
                <Input placeholder="10" value={editDnsPriority} onChange={(e) => setEditDnsPriority(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>TTL (seconds)</Label>
                <Input placeholder="3600" value={editDnsTtl} onChange={(e) => setEditDnsTtl(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDnsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleEditDns} disabled={dnsSubmitting}>
              {dnsSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete DNS Confirmation ── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DNS Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this DNS record? This action cannot be undone and may affect your domain&apos;s DNS resolution.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDns} className="bg-red-600 hover:bg-red-700">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Transfer Out Dialog ── */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-600" />
              Transfer Domain Out
            </DialogTitle>
            <DialogDescription>
              Initiate a transfer of {selectedDomain?.domainName} to another registrar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDomain?.locked && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Domain is locked</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You must unlock the domain before transferring. Go back and disable the Domain Lock toggle.
                  </p>
                </div>
              </div>
            )}
            {selectedDomain?.whoisPrivacy && (
              <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-sky-800">WHOIS Privacy Active</p>
                  <p className="text-xs text-sky-700 mt-0.5">
                    Consider disabling WHOIS privacy to speed up the transfer process.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="transfer-code" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                EPP / Authorization Code
              </Label>
              <Input
                id="transfer-code"
                placeholder="Enter the authorization code from your new registrar"
                value={transferCode}
                onChange={(e) => setTransferCode(e.target.value)}
                disabled={!!selectedDomain?.locked}
              />
              <p className="text-xs text-muted-foreground">
                This code is typically provided by the gaining registrar.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={handleTransferSubmit}
              disabled={!!selectedDomain?.locked || !transferCode.trim()}
            >
              <KeyRound className="w-4 h-4 mr-1" /> Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Confirmation ── */}
      <AlertDialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Confirm Domain Transfer
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to initiate a transfer of <strong>{selectedDomain?.domainName}</strong> to another registrar.
              This process typically takes 5-7 days to complete. During this time, the domain will remain active
              but cannot be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transferring}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransfer}
              disabled={transferring}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {transferring ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Initiating...
                </>
              ) : (
                'Initiate Transfer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Overview Tab Component
// ══════════════════════════════════════════════════════════════════════════

function OverviewTab({ domains, orders, loading, totalSpent, expiringDomains, onDomainClick, onNavigate, setActiveTab }: {
  domains: Domain[]; orders: Order[]; loading: boolean; totalSpent: number;
  expiringDomains: Domain[]; onDomainClick: (d: Domain) => void; onNavigate: (p: AppPage) => void;
  setActiveTab: (t: string) => void;
}) {
  const { locale } = useAppStore()
  const [bannerExpanded, setBannerExpanded] = useState(true)
  const t = locale === 'sw' ? SWAHILI : ENGLISH
  const completedOrders = orders.filter(o => o.status === 'completed')

  // Classify expiring domains by urgency
  const criticalDomains = useMemo(() =>
    expiringDomains.filter(d => d.expiresAt && getDaysUntilExpiry(d.expiresAt) <= 30),
    [expiringDomains]
  )
  const hasCritical = criticalDomains.length > 0
  const showBanner = expiringDomains.length > 0

  const getTrafficLightBadge = (days: number) => {
    if (days <= 0) return { label: t.expired, classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800' }
    if (days <= 7) return { label: t.criticalBadge, classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800' }
    if (days <= 30) return { label: t.warningBadge, classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' }
    return { label: t.soonBadge, classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' }
  }

  const handleQuickRenew = useCallback((domain: Domain) => {
    const { startCheckout } = useAppStore.getState()
    const renewPrice = TLD_PRICING[domain.tld]?.renew || 25000
    startCheckout(renewPrice, `Domain Renewal: ${domain.domainName}`)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Expiry Warning Banner */}
      {showBanner && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className={`rounded-xl border p-4 ${
            hasCritical
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
          }`}>
            {/* Banner header - clickable to collapse/expand */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setBannerExpanded(!bannerExpanded)}
              role="button"
              tabIndex={0}
              aria-expanded={bannerExpanded}
              aria-label={t.expiringSoon}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBannerExpanded(!bannerExpanded) } }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${hasCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                <h3 className={`font-semibold text-sm sm:text-base truncate ${hasCritical ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  ⚠️ {criticalDomains.length} {hasCritical ? t.expiryBannerCritical : t.expiryBannerWarning}
                </h3>
                <Badge className={`flex-shrink-0 ${hasCritical ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                  {expiringDomains.length}
                </Badge>
              </div>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${bannerExpanded ? 'rotate-180' : ''} ${hasCritical ? 'text-red-500' : 'text-amber-500'}`} />
            </div>

            {/* Collapsible domain list */}
            <AnimatePresence>
              {bannerExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 max-h-64 overflow-y-auto space-y-2 pr-1">
                    {expiringDomains.map(d => {
                      const days = getDaysUntilExpiry(d.expiresAt!)
                      const badge = getTrafficLightBadge(days)
                      return (
                        <div
                          key={d.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg transition-colors ${
                            hasCritical ? 'bg-white/70 dark:bg-black/10 hover:bg-white dark:hover:bg-black/20' : 'bg-white/70 dark:bg-black/10 hover:bg-white dark:hover:bg-black/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <button
                                onClick={() => onDomainClick(d)}
                                className="font-medium text-foreground truncate hover:text-emerald-600 transition-colors text-left"
                              >
                                {d.domainName}
                              </button>
                              <p className="text-xs text-muted-foreground">
                                {t.expiresLabel} {new Date(d.expiresAt!).toLocaleDateString()} · {days} {t.daysLabel}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className={`text-xs font-medium ${badge.classes}`}>
                              {badge.label}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleQuickRenew(d) }}
                              className={`text-xs whitespace-nowrap ${
                                hasCritical
                                  ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30'
                                  : 'border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                              {t.renewViaMpesa}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Domains</p>
                  <p className="text-2xl font-bold text-foreground">{domains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{completedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${expiringDomains.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <AlertTriangle className={`w-5 h-5 ${expiringDomains.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold text-foreground">{expiringDomains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: <Search className="w-8 h-8 text-emerald-600 mx-auto mb-3" />, title: 'Search Domains', desc: 'Find and register new domains', onClick: () => onNavigate('search') },
          { icon: <Globe className="w-8 h-8 text-sky-600 mx-auto mb-3" />, title: 'Manage Domains', desc: 'DNS, nameservers, settings', onClick: () => setActiveTab('domains') },
          { icon: <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-3" />, title: 'AI Website Builder', desc: 'Build a site in minutes', onClick: () => onNavigate('builder') },
        ].map((action, i) => (
          <motion.div key={action.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
            <Card className="cursor-pointer hover:border-emerald-300 transition-all group" onClick={action.onClick}>
              <CardContent className="p-6 text-center">
                {action.icon}
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-emerald-700 transition-colors">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <button onClick={() => setActiveTab('billing')} className="text-sm text-emerald-600 hover:underline">
              View all →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(order.amount)}</p>
                  <Badge variant="outline" className={`text-xs ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-muted text-slate-700'}`}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Domains Tab Component
// ══════════════════════════════════════════════════════════════════════════

function DomainsTab({ domains, loading, onDomainClick, onNavigate }: {
  domains: Domain[]; loading: boolean; onDomainClick: (d: Domain) => void; onNavigate: (p: AppPage) => void;
}) {
  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Domains</h2>
          <p className="text-sm text-muted-foreground">{domains.length} domain{domains.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => onNavigate('search')} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1" /> Register New
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No domains yet</h3>
            <p className="text-muted-foreground mb-6">Start by searching for your perfect domain name</p>
            <Button onClick={() => onNavigate('search')} className="bg-emerald-600 hover:bg-emerald-700">
              Search Domains
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {domains.map((domain, idx) => {
            const days = domain.expiresAt ? getDaysUntilExpiry(domain.expiresAt) : null
            const status = days !== null ? getExpiryStatus(days) : null

            return (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className="hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => onDomainClick(domain)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onDomainClick(domain) }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Globe className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{domain.domainName}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <Badge variant="outline" className={getStatusBadge(domain.status)}>{domain.status}</Badge>
                            {domain.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                            {domain.autoRenew && <Badge variant="outline" className="text-xs bg-sky-50 text-sky-600">Auto-renew</Badge>}
                            {domain.whoisPrivacy && <Badge variant="outline" className="text-xs bg-violet-50 text-violet-600">Privacy</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {status && <Badge className={status.color}>{status.label}</Badge>}
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Registered</p>
                          <p className="text-sm text-muted-foreground">{domain.registeredAt ? new Date(domain.registeredAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Domain Detail View
// ══════════════════════════════════════════════════════════════════════════

function DomainDetailView({ domain, dnsRecords, allDnsRecords, dnsLoading, dnsFilter, activeDnsTypes, onFilterChange, onToggleLock, onToggleAutoRenew, onToggleWhoisPrivacy, onRenew, onAddDns, onEditDns, onDeleteDns, onTransfer }: {
  domain: Domain
  dnsRecords: DnsRecord[]
  allDnsRecords: DnsRecord[]
  dnsLoading: boolean
  dnsFilter: string
  activeDnsTypes: string[]
  onFilterChange: (f: string) => void
  onToggleLock: () => void
  onToggleAutoRenew: () => void
  onToggleWhoisPrivacy: () => void
  onRenew: () => void
  onAddDns: () => void
  onEditDns: (r: DnsRecord) => void
  onDeleteDns: (id: string) => void
  onTransfer: () => void
}) {
  const days = domain.expiresAt ? getDaysUntilExpiry(domain.expiresAt) : null
  const expiryStatus = days !== null ? getExpiryStatus(days) : null

  return (
    <div className="space-y-6">
      {/* ── Domain header card ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-foreground">{domain.domainName}</h2>
                <Badge variant="outline" className={getStatusBadge(domain.status)}>{domain.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Registered: {domain.registeredAt ? new Date(domain.registeredAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                {domain.expiresAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Expires: {new Date(domain.expiresAt).toLocaleDateString()}</span>
                    {expiryStatus && <Badge className={`ml-1 ${expiryStatus.color}`}>{expiryStatus.label}</Badge>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onRenew}>
                <RefreshCw className="w-4 h-4 mr-1" /> Renew
              </Button>
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={onTransfer}>
                <ArrowRightLeft className="w-4 h-4 mr-1" /> Transfer Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Settings cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Domain Lock */}
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${domain.locked ? 'bg-muted' : 'bg-muted'}`}>
                    {domain.locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Domain Lock</p>
                    <p className="text-xs text-muted-foreground">Prevent unauthorized transfers</p>
                  </div>
                </div>
                <Switch checked={domain.locked} onCheckedChange={onToggleLock} />
              </div>
              {domain.locked && (
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-emerald-50 rounded-md">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-700 font-medium">Domain is protected</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Auto-Renewal */}
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${domain.autoRenew ? 'bg-emerald-50' : 'bg-muted'}`}>
                    <RefreshCw className={`w-4 h-4 ${domain.autoRenew ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Auto-Renewal</p>
                    <p className="text-xs text-muted-foreground">Automatically renew before expiry</p>
                  </div>
                </div>
                <Switch checked={domain.autoRenew} onCheckedChange={onToggleAutoRenew} />
              </div>
              {domain.autoRenew && (
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-emerald-50 rounded-md">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-700 font-medium">Auto-renewal enabled</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* WHOIS Privacy */}
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${domain.whoisPrivacy ? 'bg-violet-50' : 'bg-muted'}`}>
                    {domain.whoisPrivacy ? <EyeOff className="w-4 h-4 text-violet-600" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">WHOIS Privacy</p>
                    <p className="text-xs text-muted-foreground">Hide your personal info</p>
                  </div>
                </div>
                <Switch checked={!!domain.whoisPrivacy} onCheckedChange={onToggleWhoisPrivacy} />
              </div>
              {domain.whoisPrivacy ? (
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-violet-50 rounded-md">
                  <Shield className="w-3.5 h-3.5 text-violet-600" />
                  <span className="text-xs text-violet-700 font-medium">Privacy protection active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-amber-50 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs text-amber-700 font-medium">Personal info is public</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── DNS Records ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">DNS Records</CardTitle>
              <CardDescription className="mt-0.5">{allDnsRecords.length} record{allDnsRecords.length !== 1 ? 's' : ''} configured</CardDescription>
            </div>
            <Button size="sm" onClick={onAddDns} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> Add Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Inline type filter tabs */}
          {allDnsRecords.length > 0 && (
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => onFilterChange('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  dnsFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-slate-200'
                }`}
              >
                <Filter className="w-3 h-3" />
                All ({allDnsRecords.length})
              </button>
              {activeDnsTypes.map(type => {
                const count = allDnsRecords.filter(r => r.type === type).length
                const style = DNS_TYPE_STYLES[type]
                return (
                  <button
                    key={type}
                    onClick={() => onFilterChange(type)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold font-mono whitespace-nowrap transition-colors border ${
                      dnsFilter === type
                        ? `${style.bg} ${style.text} ${style.border}`
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {type}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      dnsFilter === type ? 'bg-white/60' : 'bg-slate-200'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* DNS table */}
          {dnsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : dnsRecords.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {dnsFilter !== 'all' ? `No ${dnsFilter} records found` : 'No DNS records configured'}
              </p>
              {dnsFilter !== 'all' && (
                <Button variant="link" className="text-emerald-600 mt-1" onClick={() => onFilterChange('all')}>
                  Show all records
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">TTL</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dnsRecords.map(record => (
                    <tr key={record.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4">
                        {getDnsTypeBadge(record.type)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{record.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-700 max-w-[240px] truncate" title={record.value}>
                        {record.value}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{record.priority || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{record.ttl}s</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditDns(record)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteDns(record.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// Billing Tab Component
// ══════════════════════════════════════════════════════════════════════════

function BillingTab({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const totalSpent = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)

  if (loading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Billing & Orders</h2>
          <p className="text-sm text-muted-foreground">Total spent: {formatCurrency(totalSpent)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order, idx) => (
          <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
            <Card className="hover:shadow-sm transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.orderNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getOrderTypeBadge(order.type)}
                        <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(order.amount)}</p>
                      <Badge variant="outline" className={`text-xs ${
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                        order.status === 'failed' ? 'bg-red-50 text-red-700' :
                        'bg-muted text-slate-700'
                      }`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
