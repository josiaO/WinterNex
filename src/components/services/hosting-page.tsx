'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Server, Zap, Cloud, Shield, CheckCircle, ArrowRight,
  HardDrive, Cpu, Globe, Clock, Headphones, RefreshCw,
  ChevronRight, HelpCircle, Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/components/ui/accordion'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, HOSTING_PLANS } from '@/lib/domain-data'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

type HostingType = 'all' | 'shared' | 'vps' | 'cloud'

const TYPE_LABELS: Record<string, string> = {
  shared: 'Shared Hosting',
  vps: 'VPS',
  cloud: 'Cloud'
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  shared: <Server className="w-5 h-5" />,
  vps: <Cpu className="w-5 h-5" />,
  cloud: <Cloud className="w-5 h-5" />
}

const COMPARISON_ROWS = [
  { feature: 'Storage', starter: '5 GB SSD', business: '25 GB SSD', enterprise: '100 GB NVMe' },
  { feature: 'Bandwidth', starter: '100 GB', business: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Websites', starter: '1', business: '10', enterprise: 'Unlimited' },
  { feature: 'Email Accounts', starter: '3', business: '25', enterprise: 'Unlimited' },
  { feature: 'SSL Certificate', starter: 'Free', business: 'Free', enterprise: 'Wildcard' },
  { feature: 'Control Panel', starter: 'cPanel', business: 'cPanel', enterprise: 'cPanel + WHM' },
  { feature: 'Free Domain', starter: '--', business: '.co.tz', enterprise: '.com' },
  { feature: 'Backups', starter: 'Daily', business: 'Daily', enterprise: 'Real-time' },
  { feature: 'Support', starter: 'Email', business: 'Priority', enterprise: '24/7 Phone' },
  { feature: 'Dedicated IP', starter: '--', business: '--', enterprise: 'Yes' },
]

const FAQS = [
  {
    q: 'What is shared hosting?',
    a: 'Shared hosting means your website shares server resources (CPU, RAM, bandwidth) with other websites on the same server. It\'s the most affordable option and perfect for beginners, personal blogs, and small business websites that don\'t require high resource allocation.'
  },
  {
    q: 'What is the difference between VPS and Cloud hosting?',
    a: 'VPS (Virtual Private Server) gives you dedicated resources on a single physical server. Cloud hosting distributes your site across multiple servers, offering better uptime, auto-scaling, and redundancy. Cloud hosting is ideal if you need high availability and expect traffic spikes.'
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Absolutely! You can upgrade your hosting plan at any time. We\'ll migrate your data seamlessly with zero downtime. The price difference will be prorated based on your remaining billing cycle.'
  },
  {
    q: 'Do you offer a money-back guarantee?',
    a: 'Yes, all our hosting plans come with a 30-day money-back guarantee. If you\'re not satisfied with our service, we\'ll issue a full refund within the first 30 days — no questions asked.'
  },
  {
    q: 'What kind of support do you provide?',
    a: 'We offer 24/7 technical support via live chat, email, and phone (Enterprise plan). Our support team is based locally and can assist with everything from server configuration to website troubleshooting.'
  },
  {
    q: 'Is cPanel included with all plans?',
    a: 'Yes, cPanel is included with all shared and VPS hosting plans. Enterprise hosting also includes WHM (Web Host Manager) for managing multiple cPanel accounts, giving you full control over your hosting environment.'
  },
]

export function HostingPage() {
  const { isAuthenticated, setAuthModalOpen, setAuthModalMode, startCheckout } = useAppStore()
  const [activeType, setActiveType] = useState<HostingType>('all')

  const filteredPlans = HOSTING_PLANS.filter(plan =>
    activeType === 'all' || plan.type === activeType
  )

  const handleGetStarted = (plan: typeof HOSTING_PLANS[number]) => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }
    startCheckout(plan.price, `${plan.name} - ${plan.period === 'month' ? 'Monthly' : 'Annual'} Plan`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-800 text-white py-16 md:py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-slate-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4 px-4 py-1.5 text-sm">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Blazing Fast Hosting
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Web Hosting Built for{' '}
              <span className="text-emerald-400">Performance</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              From shared hosting to enterprise cloud infrastructure — launch your website with
              enterprise-grade speed, security, and 99.9% uptime guaranteed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base"
                onClick={() => {
                  const businessPlan = HOSTING_PLANS.find(p => p.id === 'business')
                  if (businessPlan) handleGetStarted(businessPlan)
                }}
              >
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base"
                onClick={() => {
                  const el = document.getElementById('plans')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                View Plans
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
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '50+', label: 'Data Centers' },
              { value: '10K+', label: 'Websites Hosted' },
              { value: '24/7', label: 'Expert Support' },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/5 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Hosting Plans Section */}
      <section id="plans" className="container mx-auto px-4 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Choose Your Hosting Plan
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Select the perfect hosting solution for your needs. All plans include free SSL and 24/7 monitoring.
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-10">
            <Tabs value={activeType} onValueChange={(v) => setActiveType(v as HostingType)}>
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="all">All Plans</TabsTrigger>
                <TabsTrigger value="shared">Shared Hosting</TabsTrigger>
                <TabsTrigger value="vps">VPS</TabsTrigger>
                <TabsTrigger value="cloud">Cloud</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    plan.popular
                      ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Popular Badge */}
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
                        plan.popular ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {TYPE_ICONS[plan.type] || <Server className="w-5 h-5" />}
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
                          <span className="text-slate-400 text-sm">
                            /{plan.period === 'month' ? 'mo' : 'yr'}
                          </span>
                        )}
                      </div>
                      {plan.period === 'year' && plan.price > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          {formatCurrency(Math.round(plan.price / 12))}/month billed annually
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature) => (
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
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                      onClick={() => handleGetStarted(plan)}
                    >
                      Get Started
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredPlans.length === 0 && (
            <Card className="mt-4">
              <CardContent className="p-12 text-center">
                <Server className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No plans found</h3>
                <p className="text-slate-500">Try selecting a different category</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </section>

      {/* Why Choose Our Hosting */}
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
                Why Host With DomainHub?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Enterprise-grade infrastructure at affordable prices
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap className="w-6 h-6 text-emerald-600" />,
                  title: 'LiteSpeed Servers',
                  desc: 'NVMe SSD storage with LiteSpeed web servers for up to 20x faster page loads than traditional hosting.',
                },
                {
                  icon: <Shield className="w-6 h-6 text-emerald-600" />,
                  title: 'Advanced Security',
                  desc: 'Free SSL, DDoS protection, malware scanning, and automated backups keep your site safe around the clock.',
                },
                {
                  icon: <Clock className="w-6 h-6 text-emerald-600" />,
                  title: '99.9% Uptime SLA',
                  desc: 'Enterprise-grade infrastructure with redundant systems ensures your website is always online.',
                },
                {
                  icon: <Headphones className="w-6 h-6 text-emerald-600" />,
                  title: 'Expert Support',
                  desc: 'Local support team available 24/7 via live chat, email, and phone to help with any issue.',
                },
                {
                  icon: <RefreshCw className="w-6 h-6 text-emerald-600" />,
                  title: 'Easy Migration',
                  desc: 'Free website migration from your current host. We handle the entire process with zero downtime.',
                },
                {
                  icon: <Globe className="w-6 h-6 text-emerald-600" />,
                  title: 'Global CDN',
                  desc: 'Content delivery network included to serve your site fast to visitors anywhere in the world.',
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

      {/* Comparison Table */}
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
                Shared Hosting Comparison
              </h2>
              <p className="text-slate-500">See what&apos;s included in each shared hosting plan</p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700 py-4 px-4">Feature</TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center">Starter</TableHead>
                        <TableHead className="font-semibold text-emerald-700 py-4 px-4 text-center bg-emerald-50/50">
                          Business
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center">Enterprise</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {COMPARISON_ROWS.map((row) => (
                        <TableRow key={row.feature}>
                          <TableCell className="py-3 px-4 font-medium text-slate-700">{row.feature}</TableCell>
                          <TableCell className="py-3 px-4 text-center text-slate-600">{row.starter}</TableCell>
                          <TableCell className="py-3 px-4 text-center text-emerald-700 font-medium bg-emerald-50/30">{row.business}</TableCell>
                          <TableCell className="py-3 px-4 text-center text-slate-600">{row.enterprise}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50">
                        <TableCell className="py-4 px-4 font-bold text-slate-900">Price</TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <span className="font-bold text-slate-900">{formatCurrency(3000)}/yr</span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center bg-emerald-50/30">
                          <span className="font-bold text-emerald-700">{formatCurrency(8000)}/yr</span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                          <span className="font-bold text-slate-900">{formatCurrency(18000)}/yr</span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
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
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500">
                Everything you need to know about our hosting services
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
                Ready to Launch Your Website?
              </h3>
              <p className="text-emerald-100 text-sm">
                Get started with reliable hosting today. 30-day money-back guarantee.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 h-12 font-semibold shadow-lg"
              onClick={() => {
                const businessPlan = HOSTING_PLANS.find(p => p.id === 'business')
                if (businessPlan) handleGetStarted(businessPlan)
              }}
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
