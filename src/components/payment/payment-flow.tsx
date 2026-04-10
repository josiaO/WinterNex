'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone, CreditCard, CheckCircle, XCircle, Loader2, 
  ChevronLeft, Shield, Clock, ArrowRight, Lock, MessageSquare, BadgeCheck,
  X, ShoppingCart, Search, Globe, Zap, Timer, Download, Server,
  TrendingUp, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useAppStore, CartItem } from '@/store/app-store'
import { formatCurrency, SWAHILI, ENGLISH, TLD_PRICING } from '@/lib/domain-data'
import { toast } from 'sonner'

interface PaymentFlowProps {
  amount: number
  description: string
  onSuccess?: () => void
  onCancel?: () => void
}

type PaymentMethod = 'mpesa' | 'tigopesa' | 'airtel' | 'card'

const PAYMENT_METHODS: Record<PaymentMethod, { name: string; carrier: string; color: string; bgColor: string; borderColor: string; popular?: boolean }> = {
  mpesa: {
    name: 'M-Pesa',
    carrier: 'Vodacom Tanzania',
    color: 'bg-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    popular: true,
  },
  tigopesa: {
    name: 'Tigo Pesa',
    carrier: 'Tigo Tanzania',
    color: 'bg-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  airtel: {
    name: 'Airtel Money',
    carrier: 'Airtel Tanzania',
    color: 'bg-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
  },
  card: {
    name: 'Card',
    carrier: 'Visa / Mastercard',
    color: 'bg-slate-600',
    bgColor: 'bg-muted',
    borderColor: 'border-slate-500',
  },
}

export function PaymentFlow({ amount, description, onSuccess, onCancel }: PaymentFlowProps) {
  const { user, cart, clearCart, removeFromCart, navigate, locale } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH

  const [step, setStep] = useState<'method' | 'details' | 'processing' | 'success' | 'failed'>('method')
  const [method, setMethod] = useState<PaymentMethod>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('+255')
  const [transactionId, setTransactionId] = useState('')
  const [countdown, setCountdown] = useState(120)
  const [purchasedItems, setPurchasedItems] = useState<CartItem[]>([])
  const [redirectCountdown, setRedirectCountdown] = useState(10)
  const [redirectCancelled, setRedirectCancelled] = useState(false)
  const confettiContainerRef = useRef<HTMLDivElement>(null)

  // Countdown for payment timeout
  useEffect(() => {
    if (step !== 'processing') return
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          setStep('failed')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [step])

  // Success redirect countdown
  useEffect(() => {
    if (step !== 'success' || redirectCancelled) return
    if (redirectCountdown <= 0) {
      navigate('dashboard')
      onSuccess?.()
      return
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [step, redirectCountdown, redirectCancelled, navigate, onSuccess])

  // Create confetti particles on success
  useEffect(() => {
    if (step !== 'success') return
    const container = confettiContainerRef.current
    if (!container) return

    container.innerHTML = ''
    const colors = ['#059669', '#10b981', '#34d399', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']
    
    for (let i = 0; i < 60; i++) {
      const particle = document.createElement('div')
      const color = colors[Math.floor(Math.random() * colors.length)]
      const left = Math.random() * 100
      const delay = Math.random() * 2
      const duration = 2 + Math.random() * 3
      const size = 6 + Math.random() * 8
      const rotation = Math.random() * 360

      particle.style.cssText = `
        position: absolute;
        top: -10px;
        left: ${left}%;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${color};
        border-radius: 2px;
        transform: rotate(${rotation}deg);
        opacity: 0;
        animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
      `
      container.appendChild(particle)
    }
  }, [step])

  // Computed values for payment breakdown
  const feeBreakdown = useMemo(() => {
    let registration = 0
    let renewal = 0
    let transfer = 0

    cart.forEach(item => {
      const total = item.price * item.years
      if (item.type === 'registration') registration += total
      else if (item.type === 'renewal') renewal += total
      else if (item.type === 'transfer') transfer += total
    })

    return { registration, renewal, transfer }
  }, [cart])

  // Multi-year savings calculation
  const multiYearInfo = useMemo(() => {
    const multiYearItems = cart.filter(item => item.years > 1)
    if (multiYearItems.length === 0) return null

    let totalSavings = 0
    let totalYears = 0

    multiYearItems.forEach(item => {
      const tldData = TLD_PRICING[item.tld]
      if (tldData) {
        const priceKey = item.type === 'registration' ? 'register' : item.type === 'renewal' ? 'renew' : 'transfer'
        const basePrice = tldData[priceKey]
        const discountRates: Record<number, number> = { 2: 0.05, 3: 0.08, 4: 0.12, 5: 0.15 }
        const discountRate = discountRates[item.years] || 0
        totalSavings += Math.round(basePrice * discountRate * item.years)
        totalYears += item.years
      }
    })

    return { totalSavings, totalYears, items: multiYearItems.length }
  }, [cart])

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.years, 0)
  }, [cart])

  const handleRemoveFromCart = useCallback((domain: string) => {
    removeFromCart(domain)
    toast.success(locale === 'sw' ? 'Imeremewa kutoka gari' : 'Removed from cart')
  }, [removeFromCart, locale])

  const handleGoSearch = useCallback(() => {
    navigate('search')
  }, [navigate])

  const handleDownloadReceipt = useCallback(() => {
    toast.success(t.receiptSent)
  }, [t])

  const handleCancelRedirect = useCallback(() => {
    setRedirectCancelled(true)
  }, [])

  const handleInitiatePayment = async () => {
    if (method !== 'card' && (!phoneNumber || phoneNumber.length < 10)) {
      toast.error(locale === 'sw' ? 'Tafadhali ingiza nambari sahihi ya simu' : 'Please enter a valid phone number')
      return
    }

    if (method === 'card') {
      toast.error(locale === 'sw' ? 'Malipo ya kadi yakojezwa hivi karibuni' : 'Card payments coming soon')
      return
    }

    setStep('processing')
    setCountdown(120)

    try {
      // Create order first
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo',
          type: 'domain_registration',
          amount,
          currency: 'TZS',
          metadata: JSON.stringify({ description, cart }),
        }),
      })

      if (!orderRes.ok) {
        toast.error(locale === 'sw' ? 'Imeshindwa kuunda oda' : 'Failed to create order')
        setStep('method')
        return
      }

      const orderData = await orderRes.json()

      // Initiate payment
      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo',
          orderId: orderData.order.id,
          method,
          amount,
          phoneNumber,
        }),
      })

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json()
        setTransactionId(paymentData.payment.transactionId)

        // Simulate payment completion after delay
        setTimeout(async () => {
          try {
            await fetch('/api/payments', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId: paymentData.payment.id, status: 'completed' }),
            })

            // Register any domains from cart
            const currentCart = useAppStore.getState().cart
            // Save purchased items before clearing
            setPurchasedItems([...currentCart])
            
            for (const item of currentCart) {
              if (item.type === 'registration') {
                await fetch('/api/domains', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    domainName: item.domain.replace(item.tld, ''),
                    tld: item.tld,
                    userId: user?.id,
                  }),
                })
              }
            }

            setStep('success')
            setRedirectCountdown(10)
            setRedirectCancelled(false)
            clearCart()
            toast.success(t.paymentSuccess)
          } catch {
            setStep('failed')
          }
        }, 5000 + Math.random() * 5000) // 5-10 second simulation
      } else {
        toast.error(locale === 'sw' ? 'Anza malipo imeshindwa' : 'Payment initiation failed')
        setStep('method')
      }
    } catch {
      toast.error(locale === 'sw' ? 'Hitilafu ya malipo. Jaribu tena.' : 'Payment error. Please try again.')
      setStep('method')
    }
  }

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const currentMethod = PAYMENT_METHODS[method]

  // If cart is empty in method step, show empty state
  const isCartEmpty = cart.length === 0

  return (
    <div className="min-h-screen bg-muted relative">
      {/* Confetti container for success */}
      <div ref={confettiContainerRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden" />

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            {onCancel && (
              <button onClick={onCancel} className="text-white/60 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Shield className="w-5 h-5 text-emerald-300" />
            <span className="font-medium">{t.paymentSecure}</span>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {[
              locale === 'sw' ? 'Njia' : 'Method',
              locale === 'sw' ? 'Maelezo' : 'Details',
              locale === 'sw' ? 'Thibitisha' : 'Confirm',
            ].map((label, i) => {
              const stepOrder = ['method', 'details', 'processing'].indexOf(step)
              const isActive = i <= stepOrder
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/30'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-white/10'
                    }`}>
                      {i < stepOrder ? <CheckCircle className="w-3 h-3" /> : i + 1}
                    </span>
                    {label}
                  </div>
                  {i < 2 && <div className={`w-6 h-px ${isActive ? 'bg-white/30' : 'bg-white/10'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Step 1: Choose payment method */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              {/* Cart is empty state */}
              {isCartEmpty ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t.cartEmpty}</h3>
                    <p className="text-muted-foreground mb-6">{t.cartEmptyDesc}</p>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleGoSearch}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {t.goSearch}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* M-Pesa Trust Signals Enhancement */}
                  <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden">
                    {/* Animated background circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Animated M-Pesa Logo */}
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex-shrink-0 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg"
                      >
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-white" />
                        </div>
                      </motion.div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold">M-Pesa</span>
                          <Badge className="bg-white/20 text-white border-0 text-[10px] px-2 py-0">
                            {t.poweredBySelcom}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/80 mb-2">{t.mpesaTestimonial}</p>
                        <div className="flex items-center gap-1.5 text-xs text-white/70">
                          <Timer className="w-3.5 h-3.5" />
                          <span>{t.avgPaymentTime}</span>
                        </div>
                      </div>

                      {/* Star rating */}
                      <div className="hidden sm:flex flex-col items-center gap-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-[10px] text-white/60">4.9/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t.paymentMethod}</CardTitle>
                      <CardDescription>
                        {locale === 'sw' ? 'Chagua njia unayopenda kulipia' : 'Choose how you\'d like to pay'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="space-y-3">
                        {(Object.keys(PAYMENT_METHODS) as PaymentMethod[]).map((key) => {
                          const pm = PAYMENT_METHODS[key]
                          return (
                            <label
                              key={key}
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                method === key ? `${pm.borderColor} ${pm.bgColor}` : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <RadioGroupItem value={key} />
                              <div className={`w-10 h-10 ${pm.color} rounded-lg flex items-center justify-center`}>
                                {key === 'card' ? (
                                  <CreditCard className="w-5 h-5 text-white" />
                                ) : (
                                  <Smartphone className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{pm.name}</p>
                                <p className="text-xs text-muted-foreground">{pm.carrier}</p>
                              </div>
                              {pm.popular && (
                                <Badge className="bg-green-50 text-green-700">
                                  {locale === 'sw' ? 'Maarufu' : 'Popular'}
                                </Badge>
                              )}
                            </label>
                          )
                        })}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Trust Signals - stacked on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 bg-background rounded-xl border p-3">
                      <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">TCRA</p>
                        <p className="text-[10px] text-muted-foreground">{locale === 'sw' ? 'Imeidhinishwa' : 'Accredited'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-background rounded-xl border p-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Selcom</p>
                        <p className="text-[10px] text-muted-foreground">{locale === 'sw' ? 'Lango la malipo' : 'Payment Gateway'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-background rounded-xl border p-3">
                      <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">SSL</p>
                        <p className="text-[10px] text-muted-foreground">{locale === 'sw' ? 'Usimbaji fiche' : 'Encrypted'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-background rounded-xl border p-3">
                      <Shield className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold text-foreground leading-tight">
                          {locale === 'sw' ? 'Malipo salama' : 'Safe Payment'}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {locale === 'sw' ? 'Hatutaki PIN yako kamwe' : 'We never ask for PIN'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Cart Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        {t.orderSummary}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {/* Cart Items - scrollable */}
                      <div className="max-h-64 overflow-y-auto space-y-0 pr-1">
                        {cart.map((item, index) => (
                          <div key={item.domain}>
                            <div className="flex items-start gap-3 py-3 group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="font-medium text-foreground truncate">{item.domain}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground ml-6">
                                  <span>{t.itemTld}: <strong className="text-foreground">{item.tld}</strong></span>
                                  <span>{t.itemYears}: <strong className="text-foreground">{item.years}</strong></span>
                                  <span>{t.itemPricePerYear}: <strong className="text-foreground">{formatCurrency(item.price)}</strong></span>
                                </div>
                                <div className="ml-6 mt-1">
                                  <Badge variant="outline" className="text-[10px] capitalize">
                                    {item.type === 'registration' ? (locale === 'sw' ? 'Usajili' : 'Registration') :
                                     item.type === 'renewal' ? (locale === 'sw' ? 'Kusasisha' : 'Renewal') :
                                     (locale === 'sw' ? 'Uhamishaji' : 'Transfer')}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="font-bold text-foreground">{formatCurrency(item.price * item.years)}</span>
                                <button
                                  onClick={() => handleRemoveFromCart(item.domain)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 text-red-500"
                                  aria-label={t.removeItem}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {index < cart.length - 1 && <Separator />}
                          </div>
                        ))}
                      </div>

                      <Separator className="my-3" />

                      {/* Subtotal */}
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{t.subtotal}</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>

                      {/* Multi-year savings */}
                      {multiYearInfo && multiYearInfo.totalSavings > 0 && (
                        <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs text-emerald-700">
                            {t.payingForYears} {multiYearInfo.totalYears} {locale === 'sw' ? 'miaka' : 'years'} — {t.youSave} <strong>{formatCurrency(multiYearInfo.totalSavings)}</strong>
                          </span>
                        </div>
                      )}

                      {/* Fee breakdown */}
                      {(feeBreakdown.registration > 0 || feeBreakdown.renewal > 0 || feeBreakdown.transfer > 0) && (
                        <div className="bg-muted rounded-xl p-3 mb-3 space-y-1.5">
                          <p className="text-xs font-semibold text-foreground mb-2">{t.paymentBreakdown}</p>
                          {feeBreakdown.registration > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t.registrationFees}</span>
                              <span className="text-foreground">{formatCurrency(feeBreakdown.registration)}</span>
                            </div>
                          )}
                          {feeBreakdown.renewal > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t.renewalFees}</span>
                              <span className="text-foreground">{formatCurrency(feeBreakdown.renewal)}</span>
                            </div>
                          )}
                          {feeBreakdown.transfer > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t.transferFees}</span>
                              <span className="text-foreground">{formatCurrency(feeBreakdown.transfer)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Total - Large bold */}
                      <Separator />
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-lg font-bold text-foreground">{t.total}</span>
                        <span className="text-2xl font-extrabold text-emerald-600">{formatCurrency(amount)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Mobile: Sticky payment button at bottom */}
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 z-40">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 sm:py-6" onClick={() => setStep('details')}>
                      {locale === 'sw' ? 'Endelea kwa Malipo' : 'Continue to Payment'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>

                  {/* Extra bottom padding on mobile for sticky button */}
                  <div className="h-20 sm:h-0" />

                  {onCancel && (
                    <Button variant="ghost" className="w-full" onClick={onCancel}>
                      {locale === 'sw' ? 'Ghairi' : 'Cancel'}
                    </Button>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Enter phone details */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentMethod.name} {locale === 'sw' ? 'Malipo' : 'Payment'}
                  </CardTitle>
                  <CardDescription>
                    {method === 'card'
                      ? (locale === 'sw' ? 'Ingiza maelezo ya kadi yako' : 'Enter your card details')
                      : (locale === 'sw'
                          ? `Ingiza nambari yako ya ${currentMethod.carrier} kupokea ujumbe wa STK`
                          : `Enter your ${currentMethod.carrier} phone number to receive the STK push`)
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {method !== 'card' ? (
                    <div className="space-y-2">
                      <Label>{locale === 'sw' ? 'Nambari ya Simu' : 'Phone Number'}</Label>
                      <Input
                        type="tel"
                        placeholder={t.phonePlaceholder}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-xl sm:text-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        {locale === 'sw'
                          ? 'Ujumbe wa STK utatumwa kwenye nambari hii. Hakikisha simu yako iko karibu.'
                          : 'An STK push will be sent to this number. Please ensure your phone is nearby.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{locale === 'sw' ? 'Nambari ya Kadi' : 'Card Number'}</Label>
                        <Input type="text" placeholder="4242 XXXX XXXX XXXX" className="text-lg" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{locale === 'sw' ? 'Tarehe ya Mwisho' : 'Expiry'}</Label>
                          <Input type="text" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input type="text" placeholder="XXX" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                          {locale === 'sw' ? 'Arifa ya Usalama' : 'Security Notice'}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          {locale === 'sw'
                            ? 'Malipo salama, hatutaki PIN yako kamwe. DomainHub haitauli PIN yako kamwe.'
                            : 'Never share your PIN with anyone. DomainHub will never ask for your PIN.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{locale === 'sw' ? 'Kiasi' : 'Amount'}</span>
                      <span className="font-bold text-foreground text-lg">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{locale === 'sw' ? 'Njia' : 'Method'}</span>
                      <span className="text-foreground">{currentMethod.name} ({currentMethod.carrier})</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile: Sticky pay button at bottom */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 z-40">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('method')}>
                    {locale === 'sw' ? 'Nyuma' : 'Back'}
                  </Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleInitiatePayment}>
                    {t.payNow} {formatCurrency(amount)}
                  </Button>
                </div>
              </div>
              <div className="h-20 sm:h-0" />
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-emerald-200 rounded-full" />
                    <motion.div
                      className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Smartphone className="w-8 h-8 text-emerald-600" />
                      </motion.div>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-2">{t.processing}</h2>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 mb-4 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        {locale === 'sw' ? 'Ujumbe wa STK umetumwa' : 'STK push sent'}
                      </p>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {locale === 'sw'
                        ? `Tafadhali funga simu yako na weka PIN ya ${currentMethod.name}`
                        : `Check your phone and enter your ${currentMethod.name} PIN`}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {locale === 'sw'
                      ? 'An STK push imetumwa kwa'
                      : 'An STK push has been sent to'}{' '}
                    <strong>{phoneNumber}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.enterPin}
                  </p>

                  {transactionId && (
                    <Badge variant="outline" className="font-mono text-xs">
                      TXN: {transactionId}
                    </Badge>
                  )}

                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {locale === 'sw' ? 'Inangoja uthibitisho...' : 'Waiting for confirmation...'}{' '}
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <Card className="text-center">
                <CardContent className="p-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </motion.div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">{t.paymentSuccess}</h2>
                  
                  {/* Large amount display */}
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-emerald-600">{formatCurrency(amount)}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {transactionId && <>{locale === 'sw' ? 'Nambari ya Muamala' : 'Transaction ID'}: <span className="font-mono">{transactionId}</span></>}
                  </p>

                  {/* SMS notification notice */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 mb-6 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {locale === 'sw'
                          ? 'Utapokea ujumbe wa SMS kama uthibitisho'
                          : 'You will receive an SMS as confirmation'}
                      </p>
                    </div>
                  </div>

                  {/* Domains purchased */}
                  {purchasedItems.length > 0 && (
                    <div className="text-left mb-6">
                      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {t.domainsPurchased}
                      </h3>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {purchasedItems.map((item) => (
                          <div key={item.domain} className="bg-muted rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="font-semibold text-foreground text-sm">{item.domain}</span>
                              </div>
                              <span className="font-bold text-sm text-foreground">{formatCurrency(item.price * item.years)}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground ml-6">
                              <span className="capitalize">
                                {item.type === 'registration' ? (locale === 'sw' ? 'Usajili' : 'Registration') :
                                 item.type === 'renewal' ? (locale === 'sw' ? 'Kusasisha' : 'Renewal') :
                                 (locale === 'sw' ? 'Uhamishaji' : 'Transfer')}
                              </span>
                              <span>{t.itemYears}: {item.years}</span>
                              <span>{t.itemTld}: {item.tld}</span>
                            </div>
                            <div className="ml-6 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={() => {
                                  navigate('dashboard')
                                }}
                              >
                                <Server className="w-3 h-3 mr-1" />
                                {t.setUpDns}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What's next */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 text-left mb-6">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200 mb-2">
                      {locale === 'sw' ? 'Yanayofuata?' : 'What\'s next?'}
                    </p>
                    <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {locale === 'sw' ? 'Majina yako yanajiandikisha' : 'Your domain(s) are being registered'}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {locale === 'sw'
                          ? 'Utapokea barua pepe ya uthibitisho hivi karibuni'
                          : 'You\'ll receive a confirmation email shortly'}
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {locale === 'sw'
                          ? 'Simamia majina yako kutoka dashibodi'
                          : 'Manage your domains from the dashboard'}
                      </li>
                    </ul>
                  </div>

                  {/* Download Receipt */}
                  <Button 
                    variant="outline" 
                    className="w-full mb-4"
                    onClick={handleDownloadReceipt}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.downloadReceipt}
                  </Button>

                  {/* Action buttons */}
                  <div className="flex gap-3 mb-4">
                    <Button variant="outline" className="flex-1" onClick={() => navigate('home')}>
                      {locale === 'sw' ? 'Nyumbani' : 'Go Home'}
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                      navigate('dashboard')
                      onSuccess?.()
                    }}>
                      {locale === 'sw' ? 'Tazama Dashibodi' : 'View Dashboard'}
                    </Button>
                  </div>

                  {/* Redirect countdown */}
                  {!redirectCancelled && redirectCountdown > 0 && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{t.redirectingIn} {redirectCountdown} {t.seconds}...</span>
                      <button 
                        onClick={handleCancelRedirect}
                        className="text-xs text-primary hover:underline ml-1"
                      >
                        {t.cancelRedirect}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Failed */}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">{t.paymentFailed}</h2>
                  <p className="text-muted-foreground mb-6">
                    {locale === 'sw'
                      ? 'Ombi la malipo limeisha muda. Jaribu tena kwa nambari sahihi ya simu.'
                      : 'The payment request expired. Please try again with a valid phone number.'}
                  </p>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onCancel || (() => navigate('home'))}>
                      {locale === 'sw' ? 'Ghairi' : 'Cancel'}
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                      setStep('method')
                      setCountdown(120)
                    }}>
                      {locale === 'sw' ? 'Jaribu Tena' : 'Try Again'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confetti CSS keyframes */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg) scale(0.5);
          }
        }

        /* Custom scrollbar for cart items */
        .max-h-64::-webkit-scrollbar,
        .max-h-48::-webkit-scrollbar {
          width: 4px;
        }
        .max-h-64::-webkit-scrollbar-track,
        .max-h-48::-webkit-scrollbar-track {
          background: transparent;
        }
        .max-h-64::-webkit-scrollbar-thumb,
        .max-h-48::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 2px;
        }
        .max-h-64::-webkit-scrollbar-thumb:hover,
        .max-h-48::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  )
}
