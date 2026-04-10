'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Star, TrendingUp, ShoppingCart, Globe, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, PREMIUM_DOMAINS } from '@/lib/domain-data'
import { toast } from 'sonner'

const CATEGORIES = ['All', 'Geo', 'Tech', 'E-commerce', 'Finance', 'Media', 'Travel', 'Food', 'Education', 'Health', 'Gaming']

export function PremiumDomainsPage() {
  const { addToCart, cart, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useAppStore()
  const [searchFilter, setSearchFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const filteredDomains = PREMIUM_DOMAINS.filter(d => {
    const matchesSearch = d.domain.toLowerCase().includes(searchFilter.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddToCart = (domain: string, price: number) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }

    const isInCart = cart.some(item => item.domain === domain)
    if (isInCart) {
      toast.info(`${domain} is already in your cart`)
      return
    }

    addToCart({
      domain,
      tld: '.' + domain.split('.').slice(1).join('.'),
      price,
      type: 'registration',
      years: 1,
    })
    toast.success(`${domain} added to cart!`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-slate-800 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 px-4 py-1.5 rounded-full mb-4">
              <Crown className="w-4 h-4 text-amber-300" />
              <span className="text-amber-200 text-sm font-medium">Premium Domain Marketplace</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Premium Domains</h1>
            <p className="text-amber-100/80 text-lg">
              Invest in a premium domain name that elevates your brand. Short, memorable, and brandable domains ready for your business.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search premium domains..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? 'default' : 'outline'}
                className={categoryFilter === cat ? 'bg-amber-600 hover:bg-amber-700' : ''}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Domain stats */}
        <div className="max-w-6xl mx-auto mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{PREMIUM_DOMAINS.length}</p>
              <p className="text-sm text-slate-500">Premium Domains</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(Math.min(...PREMIUM_DOMAINS.map(d => d.price)))}
              </p>
              <p className="text-sm text-slate-500">Starting From</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{CATEGORIES.length - 1}</p>
              <p className="text-sm text-slate-500">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">100%</p>
              <p className="text-sm text-slate-500">Secure Transfer</p>
            </CardContent>
          </Card>
        </div>

        {/* Domains grid */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{filteredDomains.length} domain{filteredDomains.length !== 1 ? 's' : ''} found</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDomains.map(domain => {
              const inCart = cart.some(item => item.domain === domain.domain)
              return (
                <Card key={domain.domain} className="hover:shadow-md transition-all border-amber-100">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <p className="font-bold text-slate-900 text-lg">{domain.domain}</p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700">{domain.category}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 mb-4">{formatCurrency(domain.price)}</p>
                    <p className="text-xs text-slate-400 mb-4">One-time purchase • Instant transfer</p>
                    <Button
                      className={`w-full ${inCart ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      onClick={() => handleAddToCart(domain.domain, domain.price)}
                    >
                      {inCart ? (
                        <><ShoppingCart className="w-4 h-4 mr-1" /> In Cart</>
                      ) : (
                        <><ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredDomains.length === 0 && (
            <Card className="mt-8">
              <CardContent className="p-12 text-center">
                <Crown className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No domains found</h3>
                <p className="text-slate-500">Try adjusting your search or filter criteria</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Why premium */}
        <div className="max-w-6xl mx-auto mt-16">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Why Premium Domains?</h2>
                <p className="text-slate-500">Invest in a domain that drives business growth</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Higher Credibility</h3>
                  <p className="text-sm text-slate-500">Premium domains build instant trust and credibility with your customers</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Better SEO</h3>
                  <p className="text-sm text-slate-500">Short, keyword-rich domains rank higher in search results</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Brand Value</h3>
                  <p className="text-sm text-slate-500">A premium domain is an appreciating digital asset for your brand</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
