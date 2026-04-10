'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Lock, CheckCircle, ArrowRight, ChevronRight, HelpCircle,
  ShieldCheck, Globe, AlertTriangle, Award, Star, Search,
  Zap, RefreshCw, Key, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/components/ui/accordion'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, SSL_PLANS } from '@/lib/domain-data'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const TYPE_LABELS: Record<string, string> = {
  free: 'Free SSL',
  dv: 'Domain Validated',
  wildcard: 'Wildcard',
  ev: 'Extended Validation',
  san: 'Multi-Domain',
}

const TYPE_COLORS: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  dv: 'bg-emerald-100 text-emerald-700',
  wildcard: 'bg-amber-100 text-amber-700',
  ev: 'bg-purple-100 text-purple-700',
  san: 'bg-cyan-100 text-cyan-700',
}

const FAQS = [
  {
    q: 'What is an SSL certificate?',
    a: 'An SSL (Secure Sockets Layer) certificate is a digital certificate that encrypts data transmitted between a website and its visitors. It ensures sensitive information like passwords, credit card details, and personal data cannot be intercepted by attackers. SSL certificates also enable the HTTPS protocol and display the padlock icon in browsers.'
  },
  {
    q: 'Why do I need an SSL certificate?',
    a: 'SSL certificates are essential for three reasons: Security — they encrypt data in transit. Trust — they show visitors your site is safe with the padlock icon. SEO — Google gives ranking preference to HTTPS sites. Most modern browsers will flag websites without SSL as "Not Secure," which can drive visitors away.'
  },
  {
    q: 'What is the difference between DV, Wildcard, EV, and Multi-Domain SSL?',
    a: 'DV (Domain Validated) is the most basic, validating only domain ownership. Wildcard SSL covers a domain and all its subdomains (*.yourdomain.com). EV (Extended Validation) requires thorough business verification and displays the company name in the address bar for maximum trust. Multi-Domain (SAN) secures up to 5 different domains with a single certificate.'
  },
  {
    q: 'How long does it take to get an SSL certificate?',
    a: 'Free SSL (Let\'s Encrypt) and DV certificates are issued within minutes through automated validation. Wildcard and Multi-Domain SSLs are typically issued within 1-24 hours. EV certificates require manual business verification and can take 1-7 business days, depending on how quickly you complete the verification steps.'
  },
  {
    q: 'What is the SSL warranty?',
    a: 'An SSL warranty is a financial guarantee from the certificate authority. If the CA fails to properly validate your identity and a visitor suffers financial loss as a result, the warranty covers up to the specified amount. Higher-value warranties come with more rigorous validation processes, providing greater assurance to your visitors.'
  },
  {
    q: 'Do you offer free SSL certificates?',
    a: 'Yes! We offer free Let\'s Encrypt SSL certificates with all our hosting plans. These provide 256-bit encryption, auto-renewal, and are recognized by all major browsers. They\'re perfect for personal sites, blogs, and small business websites. For e-commerce or sites handling sensitive data, we recommend upgrading to a paid certificate.'
  },
  {
    q: 'Can I upgrade my SSL certificate later?',
    a: 'Yes, you can upgrade at any time. We\'ll help you install the new certificate and remove the old one seamlessly. The remaining value of your current certificate will be prorated toward the upgrade.'
  },
]

export function SslPage() {
  const { isAuthenticated, setAuthModalOpen, setAuthModalMode, startCheckout } = useAppStore()
  const [sslCheckDomain, setSslCheckDomain] = useState('')
  const [sslCheckResult, setSslCheckResult] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const handleGetStarted = (plan: typeof SSL_PLANS[number]) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }
    startCheckout(plan.price, `${plan.name} - ${plan.period === 'month' ? 'Monthly' : 'Annual'} Plan`)
  }

  const handleSslCheck = () => {
    if (!sslCheckDomain.trim()) return

    setSslCheckResult({ status: 'checking', message: 'Checking SSL certificate...' })

    // Simulated SSL check
    setTimeout(() => {
      const hasSsl = sslCheckDomain.includes('.com') || sslCheckDomain.includes('.tz') || sslCheckDomain.includes('.org')
      if (hasSsl) {
        setSslCheckResult({
          status: 'valid',
          message: `${sslCheckDomain} has a valid SSL certificate. Issuer: Let's Encrypt | Valid Until: Dec 15, 2025`,
        })
      } else {
        setSslCheckResult({
          status: 'invalid',
          message: `${sslCheckDomain} does not have a valid SSL certificate. Your visitors may see security warnings.`,
        })
      }
    }, 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSslCheck()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-800 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/3 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4 px-4 py-1.5 text-sm">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              SSL Certificates
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Secure Your Website with{' '}
              <span className="text-emerald-400">SSL</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Protect your visitors and boost your search rankings with SSL certificates.
              From free Let&apos;s Encrypt to Extended Validation — we&apos;ve got you covered.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base"
                onClick={() => {
                  const plan = SSL_PLANS.find(p => p.id === 'ssl-positive')
                  if (plan) handleGetStarted(plan)
                }}
              >
                Get SSL Certificate
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base"
                onClick={() => {
                  const el = document.getElementById('ssl-checker')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                Check Your SSL
              </Button>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-4xl mx-auto mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: '256-bit', label: 'Encryption' },
              { value: '99.9%', label: 'Browser Trust' },
              { value: '15 min', label: 'Quick Issuance' },
              { value: '$250K', label: 'Max Warranty' },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/5 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SSL Checker Tool */}
      <section id="ssl-checker" className="bg-white border-b border-slate-200 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="max-w-2xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                SSL Checker
              </h2>
              <p className="text-slate-500">
                Enter your domain to check its SSL certificate status
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g., example.com"
                        value={sslCheckDomain}
                        onChange={(e) => {
                          setSslCheckDomain(e.target.value)
                          if (sslCheckResult.status !== 'idle') {
                            setSslCheckResult({ status: 'idle', message: '' })
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        className="pl-10 h-11"
                      />
                    </div>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11"
                      onClick={handleSslCheck}
                      disabled={sslCheckResult.status === 'checking'}
                    >
                      {sslCheckResult.status === 'checking' ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Checking
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Check SSL
                        </>
                      )}
                    </Button>
                  </div>

                  {sslCheckResult.status !== 'idle' && sslCheckResult.status !== 'checking' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                        sslCheckResult.status === 'valid'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : sslCheckResult.status === 'invalid'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      {sslCheckResult.status === 'valid' ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-semibold ${
                          sslCheckResult.status === 'valid' ? 'text-emerald-800' : 'text-red-800'
                        }`}>
                          {sslCheckResult.status === 'valid' ? 'SSL Certificate Valid' : 'SSL Certificate Not Found'}
                        </p>
                        <p className={`text-sm mt-0.5 ${
                          sslCheckResult.status === 'valid' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {sslCheckResult.message}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SSL Plans */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              SSL Certificate Plans
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Choose the right SSL certificate for your website. All plans include free installation
              on our hosting and unlimited free reissues.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SSL_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                transition={{ delay: index * 0.08 }}
              >
                <Card
                  className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    plan.popular
                      ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-emerald-600 text-white px-3 py-1 shadow-md">
                        <Star className="w-3 h-3 mr-1 fill-white" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        TYPE_COLORS[plan.type] || 'bg-slate-100 text-slate-500'
                      }`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {TYPE_LABELS[plan.type] || plan.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">
                          {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-slate-400 text-sm">/yr</span>
                        )}
                      </div>
                      {/* Warranty info */}
                      {plan.features.some(f => f.includes('Warranty')) && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs text-amber-600 font-medium">
                            {plan.features.find(f => f.includes('Warranty'))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features
                        .filter(f => !f.includes('Warranty'))
                        .map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className={`w-full h-11 text-sm font-medium ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : plan.price === 0
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                      onClick={() => handleGetStarted(plan)}
                    >
                      {plan.price === 0 ? 'Activate Free SSL' : 'Get Started'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why SSL Matters */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-6xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Why SSL Matters
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                An SSL certificate is no longer optional — it&apos;s essential for every website
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Lock className="w-6 h-6 text-emerald-600" />,
                  title: 'Data Encryption',
                  desc: 'Encrypts all data transmitted between your site and visitors, protecting sensitive information from interception.',
                },
                {
                  icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
                  title: 'Builds Trust',
                  desc: 'The padlock icon and HTTPS prefix signal to visitors that your site is safe, increasing conversions and credibility.',
                },
                {
                  icon: <Eye className="w-6 h-6 text-emerald-600" />,
                  title: 'SEO Boost',
                  desc: 'Google uses HTTPS as a ranking signal. Sites with SSL certificates rank higher in search results.',
                },
                {
                  icon: <Key className="w-6 h-6 text-emerald-600" />,
                  title: 'Compliance',
                  desc: 'Meet PCI DSS and GDPR requirements. SSL is mandatory for any site that collects personal or payment data.',
                },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeInUp}>
                  <Card className="h-full border-slate-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                        {item.icon}
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SSL Types Comparison */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-5xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                SSL Certificate Types
              </h2>
              <p className="text-slate-500">
                Understand the different SSL certificate types to choose the right one for your needs
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Type</th>
                        <th className="text-center py-4 px-4 font-semibold text-slate-700">Validation Level</th>
                        <th className="text-center py-4 px-4 font-semibold text-slate-700">Domains Covered</th>
                        <th className="text-center py-4 px-4 font-semibold text-slate-700">Issuance Time</th>
                        <th className="text-center py-4 px-4 font-semibold text-slate-700">Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'Free SSL', validation: 'Domain', domains: 'Single', time: 'Minutes', bestFor: 'Blogs & Personal Sites' },
                        { type: 'PositiveSSL (DV)', validation: 'Domain', domains: 'Single', time: '15 min', bestFor: 'Small Business Sites' },
                        { type: 'Wildcard SSL', validation: 'Domain', domains: '*.domain + subs', time: '1-24 hrs', bestFor: 'Multi-subdomain Sites' },
                        { type: 'EV SSL', validation: 'Extended', domains: 'Single', time: '1-7 days', bestFor: 'E-commerce & Finance' },
                        { type: 'Multi-Domain', validation: 'Domain', domains: 'Up to 5 domains', time: '1-24 hrs', bestFor: 'Portfolio & Agencies' },
                      ].map((row) => (
                        <tr key={row.type} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900">{row.type}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.validation}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.domains}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.time}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{row.bestFor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                SSL Certificate FAQ
              </h2>
              <p className="text-slate-500">
                Common questions about SSL certificates and website security
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-2">
                {FAQS.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="bg-slate-50 rounded-lg px-4 border border-slate-100"
                  >
                    <AccordionTrigger className="text-left text-slate-900 font-medium hover:text-emerald-700 hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sticky Bottom CTA */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-white mb-1">
                Secure Your Website Today
              </h3>
              <p className="text-emerald-100 text-sm">
                Protect your visitors and boost your SEO with an SSL certificate. Free installation included.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 h-12 font-semibold shadow-lg"
              onClick={() => {
                const plan = SSL_PLANS.find(p => p.id === 'ssl-positive')
                if (plan) handleGetStarted(plan)
              }}
            >
              Get SSL Certificate
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
