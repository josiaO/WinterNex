'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Check, X, ShoppingCart, Star, Loader2, Sparkles, TrendingUp, Lightbulb, Flame, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, type DomainResult } from '@/store/app-store'
import { formatCurrency, TLD_PRICING, POPULAR_TLDS, PREMIUM_DOMAINS, SWAHILI_SUGGESTIONS, SWAHILI, ENGLISH } from '@/lib/domain-data'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  domain: string
  name: string
  tld: string
  available: boolean
  price: number
  renewPrice: number
  currency: string
  premium: boolean
  premiumPrice: number | null
}

interface SimilarSuggestion {
  domain: string
  tld: string
  price: number
  renewPrice: number
}

type TldGroupKey = 'tanzania' | 'international' | 'new'

// ─── TLD Groups ──────────────────────────────────────────────────────────────

const TLD_GROUPS: Record<TldGroupKey, { tlds: string[]; icon: typeof Globe }> = {
  tanzania: { tlds: ['.co.tz', '.tz', '.ac.tz', '.or.tz', '.go.tz'], icon: Globe },
  international: { tlds: ['.com', '.net', '.org', '.africa'], icon: Zap },
  new: { tlds: ['.io', '.tech', '.online', '.site', '.store'], icon: Sparkles },
}

const TLD_GROUP_LABELS: Record<TldGroupKey, { sw: string; en: string }> = {
  tanzania: { sw: 'Tanzania', en: 'Tanzania' },
  international: { sw: 'Kimataifa', en: 'International' },
  new: { sw: 'TLD Mpya', en: 'New TLDs' },
}

// ─── Popular Tanzania Searches (mock) ────────────────────────────────────────

const POPULAR_TZ_SEARCHES: Array<{ domain: string; tld: string; price: number; available: boolean }> = [
  { domain: 'biashara.co.tz', tld: '.co.tz', price: 35000, available: true },
  { domain: 'duka.co.tz', tld: '.co.tz', price: 35000, available: true },
  { domain: 'safari.tz', tld: '.tz', price: 25000, available: true },
  { domain: 'tech.co.tz', tld: '.co.tz', price: 35000, available: false },
  { domain: 'habari.co.tz', tld: '.co.tz', price: 35000, available: true },
  { domain: 'shule.tz', tld: '.tz', price: 25000, available: false },
]

// ─── Multi-year discount rates ───────────────────────────────────────────────

function getYearDiscount(years: number): number {
  if (years <= 1) return 0
  if (years === 2) return 0.05
  if (years === 3) return 0.08
  if (years === 4) return 0.12
  return 0.15 // 5 years
}

// ─── Similar domain name generator ───────────────────────────────────────────

function generateSimilarDomains(domain: string): SimilarSuggestion[] {
  const parts = domain.split('.')
  const name = parts[0]
  const tld = '.' + parts.slice(1).join('.')
  const pricing = TLD_PRICING[tld]

  if (!pricing) return []

  const suggestions: SimilarSuggestion[] = []

  // Variation 1: name-tz.{tld}
  if (!name.endsWith('-tz')) {
    suggestions.push({ domain: `${name}-tz${tld}`, tld, price: pricing.register, renewPrice: pricing.renew })
  }

  // Variation 2: get{name}.{tld}
  if (!name.startsWith('get')) {
    suggestions.push({ domain: `get${name}${tld}`, tld, price: pricing.register, renewPrice: pricing.renew })
  }

  // Variation 3: {name}online.{tld}
  if (!name.endsWith('online')) {
    suggestions.push({ domain: `${name}online${tld}`, tld, price: pricing.register, renewPrice: pricing.renew })
  }

  // Variation 4: my{name}.{tld}
  if (!name.startsWith('my') && suggestions.length < 3) {
    suggestions.push({ domain: `my${name}${tld}`, tld, price: pricing.register, renewPrice: pricing.renew })
  }

  // Variation 5: {name}hub.{tld}
  if (!name.endsWith('hub') && suggestions.length < 3) {
    suggestions.push({ domain: `${name}hub${tld}`, tld, price: pricing.register, renewPrice: pricing.renew })
  }

  // Variation 6: {name}pro.{tld}
  if (!name.endsWith('pro') && suggestions.length < 3) {
    suggestions.push({ domain: `${name}pro${tld}`, tld, price: pricing.register, renewPrice: pricing.renew })
  }

  return suggestions.slice(0, 3)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DomainSearch() {
  const {
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    isSearching, setIsSearching,
    addToCart, cart,
    navigate, isAuthenticated, locale,
    setAuthModalOpen, setAuthModalMode,
  } = useAppStore()

  const t = locale === 'sw' ? SWAHILI : ENGLISH

  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [showResults, setShowResults] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // TLD group filter state — Tanzania selected by default
  const [selectedGroups, setSelectedGroups] = useState<Set<TldGroupKey>>(
    new Set(['tanzania'])
  )

  // Year selections per domain (1-5)
  const [yearSelections, setYearSelections] = useState<Record<string, number>>({})

  // Toggle a TLD group on/off (at least one must stay selected)
  const toggleGroup = useCallback((group: TldGroupKey) => {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group) && next.size > 1) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }, [])

  // Get all enabled TLDs from selected groups
  const enabledTlds = useMemo(() => {
    const tlds = new Set<string>()
    for (const group of selectedGroups) {
      for (const tld of TLD_GROUPS[group].tlds) {
        tlds.add(tld)
      }
    }
    return tlds
  }, [selectedGroups])

  // Filter results by enabled TLDs
  const filteredResults = useMemo(() => {
    if (enabledTlds.size === 3) return searchResults // all selected, no filter needed
    return searchResults.filter((r: SearchResult) => enabledTlds.has(r.tld))
  }, [searchResults, enabledTlds])

  // ─── Debounced search ────────────────────────────────────────────────────

  useEffect(() => {
    if (localQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setHasSearched(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(localQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results)
          setShowResults(true)
        }
      } catch {
        toast.error(locale === 'sw' ? 'Utafutaji haukufaulu. Jaribu tena.' : 'Search failed. Please try again.')
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [localQuery, setIsSearching, setSearchResults, locale])

  // ─── Cart handler with year support ──────────────────────────────────────

  const handleAddToCart = (result: SearchResult, years: number = 1) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }

    const cartKey = `${result.domain}-${years}`
    const isInCart = cart.some(item => item.domain === result.domain)
    if (isInCart) {
      toast.info(`${result.domain} ${locale === 'sw' ? 'tayari iko kwenye gari' : 'is already in your cart'}`)
      return
    }

    const basePrice = result.premium ? (result.premiumPrice || result.price) : result.price
    const discount = getYearDiscount(years)
    const totalPrice = Math.round(basePrice * years * (1 - discount))

    addToCart({
      domain: result.domain,
      tld: result.tld,
      price: totalPrice,
      type: 'registration',
      years,
    })
    toast.success(`${result.domain} (${years} ${locale === 'sw' ? t.years.toLowerCase() : t.years.toLowerCase()}) ${locale === 'sw' ? 'imeongezwa kwenye gari!' : 'added to cart!'}`)
    void cartKey // prevent unused lint warning
  }

  const handleAddSimilarToCart = (suggestion: SimilarSuggestion, years: number = 1) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }

    const isInCart = cart.some(item => item.domain === suggestion.domain)
    if (isInCart) {
      toast.info(`${suggestion.domain} ${locale === 'sw' ? 'tayari iko kwenye gari' : 'is already in your cart'}`)
      return
    }

    const basePrice = suggestion.price
    const discount = getYearDiscount(years)
    const totalPrice = Math.round(basePrice * years * (1 - discount))

    addToCart({
      domain: suggestion.domain,
      tld: suggestion.tld,
      price: totalPrice,
      type: 'registration',
      years,
    })
    toast.success(`${suggestion.domain} ${locale === 'sw' ? 'imeongezwa kwenye gari!' : 'added to cart!'}`)
  }

  const isInCart = (domain: string) => cart.some(item => item.domain === domain)

  const availableResults = filteredResults.filter((r: SearchResult) => r.available)
  const takenResults = filteredResults.filter((r: SearchResult) => !r.available)

  // ─── Year selector component ─────────────────────────────────────────────

  const YearSelector = ({ domain, basePrice }: { domain: string; basePrice: number }) => {
    const years = yearSelections[domain] || 1
    const discount = getYearDiscount(years)
    const totalBeforeDiscount = basePrice * years
    const savings = Math.round(totalBeforeDiscount * discount)
    const totalPrice = totalBeforeDiscount - savings

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={String(years)}
          onValueChange={(v) => setYearSelections(prev => ({ ...prev, [domain]: Number(v) }))}
        >
          <SelectTrigger size="sm" className="w-[90px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map(y => (
              <SelectItem key={y} value={String(y)} className="text-xs">
                {y} {locale === 'sw' ? 'yr' : 'yr'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(totalPrice)}
          </p>
          {years > 1 && (
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground line-through">
                {formatCurrency(totalBeforeDiscount)}
              </p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-0 h-4">
                {locale === 'sw' ? t.save : t.save} {formatCurrency(savings)}
              </Badge>
            </div>
          )}
          {years === 1 && (
            <p className="text-[10px] text-muted-foreground">
              {formatCurrency(basePrice)}{t.perYear}
            </p>
          )}
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted">
      {/* Search Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <button
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
            >
              ← {locale === 'sw' ? 'Rudi Nyumbani' : 'Back to Home'}
            </button>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {t.searchTitle}
            </h1>
            <p className="text-slate-300 mb-8 text-lg">
              {t.searchSubtitle}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="flex items-center bg-background rounded-2xl p-2 shadow-2xl shadow-black/20">
                <Globe className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 border-0 text-foreground text-base sm:text-lg focus-visible:ring-0 px-3 sm:px-4 min-w-0"
                  autoFocus
                />
                <div className="relative flex-shrink-0">
                  <Button 
                    className="rounded-xl px-4 sm:px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isSearching || localQuery.length < 2}
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 sm:mr-1.5" />
                    )}
                    <span className="hidden sm:inline ml-1.5">{t.search}</span>
                  </Button>
                  {cart.length > 0 && (
                    <button
                      onClick={() => navigate('dashboard')}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      {cart.length}
                    </button>
                  )}
                </div>
              </div>

              {/* TLD Quick Filter Chips — horizontally scrollable on mobile */}
              <div className="mt-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap sm:justify-center md:flex-wrap">
                  {(Object.keys(TLD_GROUPS) as TldGroupKey[]).map((groupKey) => {
                    const group = TLD_GROUPS[groupKey]
                    const isActive = selectedGroups.has(groupKey)
                    const label = TLD_GROUP_LABELS[groupKey]
                    const GroupIcon = group.icon
                    return (
                      <button
                        key={groupKey}
                        onClick={() => toggleGroup(groupKey)}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                          transition-all whitespace-nowrap flex-shrink-0 border cursor-pointer select-none
                          ${isActive
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-transparent text-slate-400 border-white/20 hover:border-white/40 hover:text-slate-200'
                          }
                        `}
                      >
                        <GroupIcon className="w-3.5 h-3.5" />
                        {locale === 'sw' ? label.sw : label.en}
                        <span className="text-xs opacity-70">({group.tlds.length})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {showResults && filteredResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  {locale === 'sw' ? 'Matokeo kwa' : 'Results for'} <strong className="text-foreground">{localQuery}</strong>
                </p>
                <div className="flex items-center gap-2">
                  {selectedGroups.size < 3 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {enabledTlds.size} TLD{enabledTlds.size > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-sm">
                    {availableResults.length} {t.available}
                  </Badge>
                </div>
              </div>

              {/* Available domains */}
              <div className="space-y-3 mb-8">
                {availableResults.map((result: SearchResult) => {
                  const basePrice = result.premium ? (result.premiumPrice || result.price) : result.price
                  const years = yearSelections[result.domain] || 1

                  return (
                    <Card key={result.domain} className="border hover:border-emerald-300 hover:shadow-md transition-all">
                      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{result.domain}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{t.available}</Badge>
                              {result.premium && (
                                <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                                  <Star className="w-3 h-3 mr-1 fill-amber-500" /> {t.premiumTag}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-shrink-0">
                          <YearSelector domain={result.domain} basePrice={basePrice} />
                          <Button
                            size="sm"
                            className={isInCart(result.domain) ? 'bg-muted text-muted-foreground hover:bg-slate-200 flex-shrink-0' : 'bg-emerald-600 hover:bg-emerald-700 flex-shrink-0'}
                            onClick={() => handleAddToCart(result, years)}
                          >
                            {isInCart(result.domain) ? (
                              <><ShoppingCart className="w-4 h-4 mr-1" /> {t.inCart}</>
                            ) : (
                              <><ShoppingCart className="w-4 h-4 mr-1" /> {t.addToCart}</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Taken domains with similar name suggestions */}
              {takenResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {t.taken} ({takenResults.length})
                  </h3>
                  <div className="space-y-3">
                    {takenResults.map((result: SearchResult) => {
                      const similarDomains = generateSimilarDomains(result.domain)

                      return (
                        <Card key={result.domain} className="border-border bg-muted/50 overflow-hidden">
                          <CardContent className="p-3 sm:p-4">
                            {/* Taken domain row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <X className="w-4 h-4 text-red-500" />
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{result.domain}</p>
                              </div>
                              <Badge variant="outline" className="text-xs text-muted-foreground flex-shrink-0 ml-2">{t.taken}</Badge>
                            </div>

                            {/* Similar domain suggestions */}
                            {similarDomains.length > 0 && (
                              <div className="mt-3 ml-8 sm:ml-11">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  {t.similarAvailable} — {t.tryInstead}
                                </p>
                                <div className="space-y-2">
                                  {similarDomains.map((similar) => {
                                    const simYears = yearSelections[similar.domain] || 1
                                    return (
                                      <div
                                        key={similar.domain}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-background rounded-lg p-2.5 border border-border/50"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                          <p className="text-sm font-medium text-foreground truncate">{similar.domain}</p>
                                          <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0 h-4 flex-shrink-0">{t.available}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-shrink-0">
                                          <YearSelector domain={similar.domain} basePrice={similar.price} />
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className={`text-xs h-7 flex-shrink-0 ${isInCart(similar.domain) ? 'opacity-60' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                                            onClick={() => handleAddSimilarToCart(similar, simYears)}
                                            disabled={isInCart(similar.domain)}
                                          >
                                            {isInCart(similar.domain) ? (
                                              <><ShoppingCart className="w-3 h-3 mr-1" /> {t.inCart}</>
                                            ) : (
                                              <><ShoppingCart className="w-3 h-3 mr-1" /> {t.addToCart}</>
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {showResults && filteredResults.length === 0 && hasSearched && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Globe className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">
                {locale === 'sw' ? 'Hakuna matokeo' : 'No results found'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {locale === 'sw'
                  ? 'Badilisha filters au jaribu jina lingine'
                  : 'Try changing the TLD filters or a different name'}
              </p>
              <div className="flex gap-2">
                {(Object.keys(TLD_GROUPS) as TldGroupKey[]).map((groupKey) => {
                  if (!selectedGroups.has(groupKey)) {
                    const label = TLD_GROUP_LABELS[groupKey]
                    return (
                      <Button
                        key={groupKey}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleGroup(groupKey)}
                        className="text-xs"
                      >
                        + {locale === 'sw' ? label.sw : label.en}
                      </Button>
                    )
                  }
                  return null
                })}
              </div>
            </motion.div>
          )}

          {showResults && isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
              <p className="text-muted-foreground">{locale === 'sw' ? 'Inatafuta majina...' : 'Searching domains...'}</p>
            </motion.div>
          )}

          {!showResults && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              {/* Popular Tanzania Searches */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-foreground">{t.popularSearches}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t.popularSearchesDesc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {POPULAR_TZ_SEARCHES.map((item) => (
                    <Card
                      key={item.domain}
                      className="cursor-pointer hover:shadow-md transition-all border hover:border-emerald-300"
                      onClick={() => setLocalQuery(item.domain.split('.')[0])}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.available ? 'bg-emerald-50' : 'bg-red-50'}`}>
                            {item.available
                              ? <Check className="w-4 h-4 text-emerald-600" />
                              : <X className="w-4 h-4 text-red-500" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{item.domain}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.available ? t.available : t.taken}
                            </p>
                          </div>
                        </div>
                        {item.available && (
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(item.price)}{t.perYear}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Swahili Suggestions / Mawazo ya Kiswahili */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-foreground">
                    {locale === 'sw' ? 'Mawazo ya Kiswahili' : 'Swahili Ideas'}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {locale === 'sw'
                    ? 'Bonyeza moja ya maneno haya ili kuitafuta haraka'
                    : 'Click a word to search for it instantly'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SWAHILI_SUGGESTIONS.map((word) => (
                    <Badge
                      key={word}
                      variant="outline"
                      className="cursor-pointer px-3 py-1.5 text-sm border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                      onClick={() => setLocalQuery(word)}
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Premium domains showcase */}
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-foreground">{locale === 'sw' ? 'Majina ya Premium' : 'Premium Domains'}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PREMIUM_DOMAINS.map((pd) => (
                    <Card key={pd.domain} className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-background hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <p className="font-bold text-foreground">{pd.domain}</p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 text-xs">{pd.category}</Badge>
                        </div>
                        <p className="text-lg font-semibold text-emerald-600">{formatCurrency(pd.price)}</p>
                        <p className="text-xs text-muted-foreground">{locale === 'sw' ? 'Ununuzi wa mara moja' : 'One-time purchase'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* AI Builder CTA */}
              <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {locale === 'sw' ? 'KI Tengeneza Tovuti' : 'AI Website Builder'}
                    </h3>
                    <p className="text-muted-foreground">
                      {locale === 'sw'
                        ? 'Tengeneza ukurasa wa wavuti wa kitaalamu kwa dakika. Eleza biashara yako na AI itakutengenezea.'
                        : 'Generate a professional landing page in minutes. Just describe your business and let AI create it for you.'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('builder')}
                    className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap"
                  >
                    {locale === 'sw' ? 'Jaribu Bure' : 'Try It Free'}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
