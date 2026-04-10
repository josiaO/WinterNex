'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, BUNDLE_PRICING } from '@/lib/domain-data'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Gift,
  HelpCircle,
  Zap,
  Crown,
  Rocket,
  ArrowRight,
  Package,
  Shield,
  Mail,
  Globe,
  Lock,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

const bundles = [BUNDLE_PRICING.starter, BUNDLE_PRICING.business, BUNDLE_PRICING.premium]

const bundleIcons: Record<string, React.ReactNode> = {
  starter: <Rocket className="h-7 w-7" />,
  business: <Zap className="h-7 w-7" />,
  premium: <Crown className="h-7 w-7" />,
}

const includeIcons: Record<string, React.ReactNode> = {
  Domain: <Globe className="h-3.5 w-3.5" />,
  Hosting: <Package className="h-3.5 w-3.5" />,
  SSL: <Shield className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
  Escrow: <Lock className="h-3.5 w-3.5" />,
}

const colorClasses: Record<string, { border: string; bg: string; text: string; badge: string; cardShadow: string; accentBg: string }> = {
  emerald: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cardShadow: 'hover:shadow-emerald-500/10',
    accentBg: 'bg-emerald-50',
  },
  blue: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cardShadow: 'hover:shadow-emerald-500/10',
    accentBg: 'bg-emerald-50',
  },
  amber: {
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    cardShadow: 'hover:shadow-amber-500/10',
    accentBg: 'bg-amber-50',
  },
}

const comparisonFeatures = [
  { feature: 'Custom Domain', starter: true, business: true, premium: true },
  { feature: 'Hosting Storage', starter: '—', business: '25 GB SSD', premium: '100 GB NVMe' },
  { feature: 'SSL Certificate', starter: 'Standard', business: 'Standard', premium: 'Wildcard' },
  { feature: 'Email Accounts', starter: '5 Accounts', business: '25 Accounts', premium: 'Unlimited' },
  { feature: 'Control Panel', starter: '—', business: 'cPanel', premium: 'cPanel + WHM' },
  { feature: 'Backups', starter: '—', business: 'Daily', premium: 'Real-time' },
  { feature: 'Dedicated IP', starter: false, business: false, premium: true },
  { feature: 'Domain Escrow', starter: false, business: false, premium: true },
  { feature: 'Priority Support', starter: false, business: true, premium: true },
  { feature: 'AI Website Builder', starter: false, business: false, premium: true },
  { feature: 'Free Domain Renewal', starter: false, business: true, premium: true },
]

const faqItems = [
  {
    question: 'What exactly is included in a bundle?',
    answer: 'Each bundle includes all the services listed in the "includes" section. For example, the Business Pack includes a domain registration, hosting, SSL certificate, and email hosting — all at a discounted price compared to purchasing individually.',
  },
  {
    question: 'Can I upgrade my bundle later?',
    answer: 'Yes! You can upgrade to a higher tier at any time. We\'ll prorate the remaining value of your current bundle and apply it to the new plan. Just contact our support team or visit your account settings.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept M-Pesa, Tigo Pesa, Airtel Money Tanzania, and bank transfers. All payments are processed securely through our platform via Selcom. We also support annual and monthly billing options for select plans.',
  },
  {
    question: 'Is there a money-back guarantee?',
    answer: 'Yes, all bundles come with a 30-day money-back guarantee. If you\'re not satisfied with the services, we\'ll issue a full refund — no questions asked.',
  },
  {
    question: 'How does domain escrow protection work?',
    answer: 'Domain escrow protection (included in the Premium Pack) securely holds your domain ownership details. This adds an extra layer of security, ensuring your domain is protected from unauthorized transfers.',
  },
  {
    question: 'Can I use my own domain with a bundle?',
    answer: 'Absolutely! If you already own a domain, you can connect it to any bundle. Alternatively, each bundle includes a new domain registration (or transfer) as part of the package.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-gray-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left bg-white transition-colors hover:bg-gray-50"
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 text-gray-600 leading-relaxed">{answer}</div>
      </motion.div>
    </div>
  )
}

export function BundlesPage() {
  const { startCheckout, isAuthenticated, setAuthModalOpen, setAuthModalMode, navigate } = useAppStore()

  const handleGetStarted = (price: number, name: string) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      toast.info('Please sign up to get started')
      return
    }
    startCheckout(price, name)
  }

  const handleLearnMore = () => {
    navigate('hosting')
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Badge className="mb-4 bg-white/15 text-white border-white/20 hover:bg-white/20 text-sm px-4 py-1.5">
              <Gift className="h-4 w-4 mr-1.5" />
              Save up to 29%
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Save More with Bundles
            </h1>
            <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              Get everything you need to launch online — domain, hosting, SSL, and email — all in one
              package at an unbeatable price.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-emerald-200">
              <Shield className="h-4 w-4" />
              <span className="text-sm">30-day money-back guarantee on all bundles</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bundle Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5">
          {bundles.map((bundle, index) => {
            const color = bundle.color ?? 'emerald'
            const colors = colorClasses[color] || colorClasses.emerald
            const savingsPercent = Math.round(
              ((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100
            )
            const isPopular = bundle.id === 'business'
            const isPremium = bundle.id === 'premium'

            return (
              <motion.div
                key={bundle.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className={isPopular ? 'lg:-mt-4 lg:mb-[-16px]' : ''}
              >
                <Card
                  className={`relative overflow-hidden border-2 border-t-4 ${colors.border} bg-white hover:shadow-xl ${colors.cardShadow} transition-all duration-300 ${
                    isPopular ? 'shadow-lg' : ''
                  }`}
                >
                  {/* Badges */}
                  <div className="absolute top-0 right-0 flex flex-col gap-2 p-3 z-10">
                    {isPopular && (
                      <Badge className={`${colors.bg} text-white border-0 shadow-sm font-semibold text-xs`}>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}
                    {isPremium && (
                      <Badge className="bg-amber-500 text-white border-0 shadow-sm font-semibold text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Best Value
                      </Badge>
                    )}
                    {savingsPercent > 0 && (
                      <Badge className={`${colors.badge} border shadow-sm text-xs font-semibold`}>
                        Save {savingsPercent}%
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-6 pt-5">
                    {/* Header */}
                    <div className="mb-5">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors.accentBg} ${colors.text} mb-3`}>
                        {bundleIcons[bundle.id]}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{bundle.name}</h3>
                      <p className={`text-sm font-medium ${colors.text} mt-0.5`}>{bundle.tagline}</p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">
                      {bundle.description}
                    </p>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatCurrency(bundle.price)}
                        </span>
                        <span className="text-gray-500 text-sm">/{bundle.period}</span>
                      </div>
                      {bundle.originalPrice > bundle.price && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(bundle.originalPrice)}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-red-200">
                            Save {formatCurrency(bundle.originalPrice - bundle.price)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Includes Badges */}
                    <div className="mb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Includes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bundle.includes.map((item) => (
                          <Badge
                            key={item}
                            variant="outline"
                            className="text-xs font-medium border-gray-200 text-gray-700 bg-gray-50 py-1 px-2.5"
                          >
                            <span className="mr-1">{includeIcons[item]}</span>
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                        Features
                      </p>
                      <ul className="space-y-2.5">
                        {bundle.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${colors.text}`} />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={`w-full font-semibold py-5 text-sm ${
                        isPopular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                          : isPremium
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                          : 'bg-gray-900 hover:bg-gray-800 text-white shadow-md shadow-gray-900/10'
                      } transition-all duration-200`}
                      size="lg"
                      onClick={() => handleGetStarted(bundle.price, bundle.name)}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3 border-gray-300 text-gray-600">
            <Package className="h-3.5 w-3.5 mr-1.5" />
            Compare Plans
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Feature Comparison</h2>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">
            See exactly what&apos;s included in each bundle to find the perfect fit for your needs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left py-4 px-5 text-sm font-semibold text-gray-900 w-1/3">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700">
                      Starter
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold bg-emerald-50/60">
                      <div className="flex flex-col items-center">
                        <span>Business</span>
                        <Badge className="mt-1 bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0">
                          Popular
                        </Badge>
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700">
                      <div className="flex flex-col items-center">
                        <span>Premium</span>
                        <Badge className="mt-1 bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0">
                          Best Value
                        </Badge>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <td className="py-3.5 px-5 text-sm text-gray-700 font-medium">
                        {row.feature}
                      </td>
                      {(['starter', 'business', 'premium'] as const).map((plan) => {
                        const value = row[plan]
                        const isBool = typeof value === 'boolean'
                        const isCol = plan === 'business'

                        return (
                          <td
                            key={plan}
                            className={`py-3.5 px-4 text-center text-sm ${
                              isCol ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            {isBool ? (
                              value ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                              ) : (
                                <span className="text-gray-300">—</span>
                              )
                            ) : (
                              <span className={value === '—' ? 'text-gray-300' : 'text-gray-700'}>
                                {String(value)}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="py-4 px-5 text-sm font-bold text-gray-900">Starting Price</td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(BUNDLE_PRICING.starter.price)}
                      </div>
                      <div className="text-xs text-gray-500">/year</div>
                    </td>
                    <td className="py-4 px-4 text-center bg-emerald-50/50">
                      <div className="text-lg font-bold text-emerald-700">
                        {formatCurrency(BUNDLE_PRICING.business.price)}
                      </div>
                      <div className="text-xs text-gray-500">/year</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(BUNDLE_PRICING.premium.price)}
                      </div>
                      <div className="text-xs text-gray-500">/year</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <Badge variant="outline" className="mb-3 border-gray-300 text-gray-600">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            FAQ
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-500 mt-2">
            Got questions? We&apos;ve got answers about our bundles.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3"
        >
          {faqItems.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 mb-5">
              <Gift className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Ready to Launch Your Online Presence?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Choose a bundle that fits your needs and save up to 29% compared to individual purchases.
              Get started in minutes with our all-in-one packages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 shadow-lg shadow-emerald-600/25 transition-all duration-200"
                onClick={() => handleGetStarted(BUNDLE_PRICING.business.price, BUNDLE_PRICING.business.name)}
              >
                Get Business Pack — {formatCurrency(BUNDLE_PRICING.business.price)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-white/10 font-semibold px-8 transition-all duration-200"
                onClick={handleLearnMore}
              >
                View Individual Services
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
