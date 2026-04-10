'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail, CheckCircle, ArrowRight, ChevronRight, HelpCircle,
  Shield, Users, Globe, Calendar, Smartphone, Star,
  FileText, MessageSquare, Video, HardDrive, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/components/ui/accordion'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, EMAIL_PLANS } from '@/lib/domain-data'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const PROVIDER_COMPARISON = [
  { feature: 'Price per User/Year', custom: 'From TZS 25,000', zoho: 'TZS 60,000', google: 'TZS 150,000' },
  { feature: 'Storage per User', custom: '5 – 50 GB', zoho: '5 GB', google: '30 GB' },
  { feature: 'Email Aliases', custom: 'Yes', zoho: 'Yes', google: 'Yes' },
  { feature: 'Calendar & Contacts', custom: 'Yes', zoho: 'Yes', google: 'Yes' },
  { feature: 'Office Suite', custom: 'No', zoho: 'Writer, Sheet, Show', google: 'Docs, Sheets, Slides' },
  { feature: 'Video Conferencing', custom: 'No', zoho: 'Meeting (Basic)', google: 'Meet (100 users)' },
  { feature: 'Cloud Storage', custom: 'No', zoho: '5 GB Drive', google: '30 GB Drive' },
  { feature: 'Chat / Messaging', custom: 'No', zoho: 'Cliq', google: 'Chat' },
  { feature: 'Mobile Apps', custom: 'Yes', zoho: 'Yes', google: 'Yes' },
  { feature: 'Admin Console', custom: 'Yes', zoho: 'Yes', google: 'Yes' },
  { feature: 'Custom Branding', custom: 'Yes', zoho: 'Yes', google: 'Yes' },
  { feature: 'Spam Protection', custom: 'Yes', zoho: 'Yes', google: 'Advanced' },
  { feature: '99.9% SLA', custom: 'Yes', zoho: 'Yes', google: '99.9%' },
  { feature: 'Support', custom: 'Email & Chat', zoho: 'Email & Chat', google: 'Email & Phone' },
]

const FAQS = [
  {
    q: 'What is custom business email?',
    a: 'Custom business email uses your own domain name (e.g., you@yourcompany.com) instead of a generic email provider. It looks more professional, builds trust with clients, and gives you full control over your email infrastructure.'
  },
  {
    q: 'Can I use my email with Outlook or Gmail app?',
    a: 'Yes! All our email plans support standard protocols (IMAP, POP3, SMTP), so you can use any email client including Microsoft Outlook, Apple Mail, Gmail app, Mozilla Thunderbird, and more. We also provide webmail access for browser-based email.'
  },
  {
    q: 'What\'s the difference between custom email and Google Workspace / Zoho?',
    a: 'Custom email gives you professional email addresses with your domain. Google Workspace and Zoho Workplace are complete productivity suites that include email PLUS additional tools like cloud storage, office apps, video conferencing, and team chat. Choose a suite if you need collaboration tools beyond email.'
  },
  {
    q: 'Can I migrate from my current email provider?',
    a: 'Absolutely! We provide free migration assistance for all email plans. Our team will help you migrate all existing emails, contacts, and calendars from your current provider with zero downtime. Just contact our support team to get started.'
  },
  {
    q: 'How many email accounts can I create?',
    a: 'The number depends on your plan: Starter includes 1 account, Business includes 10, and Enterprise includes unlimited accounts. For Google Workspace and Zoho, you can add as many users as needed at the per-user price.'
  },
  {
    q: 'Do you offer email hosting with spam and virus protection?',
    a: 'Yes, all our email plans include robust spam filtering and virus scanning at the server level. Enterprise plans include advanced security features like email archiving, policy-based routing, and additional malware protection.'
  },
]

export function EmailPage() {
  const { isAuthenticated, setAuthModalOpen, setAuthModalMode, startCheckout } = useAppStore()

  const customPlans = EMAIL_PLANS.filter(p => p.provider === 'custom')
  const providerPlans = EMAIL_PLANS.filter(p => p.provider !== 'custom')

  const handleGetStarted = (plan: typeof EMAIL_PLANS[number]) => {
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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4 px-4 py-1.5 text-sm">
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Professional Email Solutions
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Business Email That{' '}
              <span className="text-emerald-400">Impresses</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Get a professional email address with your domain name. Choose from our custom email hosting
              or integrate with Google Workspace and Zoho for a complete productivity suite.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base"
                onClick={() => {
                  const plan = EMAIL_PLANS.find(p => p.id === 'email-business')
                  if (plan) handleGetStarted(plan)
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
              { value: '99.9%', label: 'Uptime' },
              { value: '5K+', label: 'Mailboxes' },
              { value: '3', label: 'Providers' },
              { value: '24/7', label: 'Support' },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/5 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Custom Email Plans */}
      <section id="plans" className="container mx-auto px-4 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">
              <Mail className="w-3.5 h-3.5 mr-1.5" />
              Custom Email Plans
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Professional Email Hosting
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Get custom email addresses like hello@yourdomain.com with webmail, mobile sync,
              and spam protection included.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {customPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
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
                        plan.popular ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <Badge variant="secondary" className="text-xs">Custom Email</Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-slate-400 text-sm">/yr</span>
                      </div>
                      {plan.price > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          {formatCurrency(Math.round(plan.price / 12))}/month billed annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

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

          {/* Provider Integrations */}
          <motion.div variants={fadeInUp} className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Provider Integrations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Workspace Solutions
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Get the full power of Google Workspace or Zoho Workplace with professional
              email and a complete productivity suite.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {providerPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
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
                        Best Value
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        plan.provider === 'google'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <Globe className="w-4 h-4" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {plan.provider === 'google' ? 'Google Workspace' : 'Zoho Workplace'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-slate-900">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-slate-400 text-sm">/user/yr</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatCurrency(Math.round(plan.price / 12))}/month per user
                      </p>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

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
        </motion.div>
      </section>

      {/* Email Features Highlights */}
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
                Everything You Need for Professional Email
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Our email solutions come packed with features to keep your team productive and secure
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Shield className="w-6 h-6 text-emerald-600" />,
                  title: 'Spam & Virus Protection',
                  desc: 'Advanced filtering keeps your inbox clean and protects against phishing, malware, and spam.',
                },
                {
                  icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
                  title: 'Mobile Sync',
                  desc: 'Access your email on any device with seamless sync across phone, tablet, and desktop.',
                },
                {
                  icon: <Calendar className="w-6 h-6 text-emerald-600" />,
                  title: 'Calendar & Contacts',
                  desc: 'Manage your schedule and contacts with built-in calendar and address book integration.',
                },
                {
                  icon: <Users className="w-6 h-6 text-emerald-600" />,
                  title: 'Team Collaboration',
                  desc: 'Shared mailboxes, distribution lists, and team features to keep everyone aligned.',
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

      {/* Provider Comparison Table */}
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
                Provider Comparison
              </h2>
              <p className="text-slate-500">
                Compare custom email, Zoho Workplace, and Google Workspace side by side
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700 py-4 px-4 min-w-[160px]">Feature</TableHead>
                        <TableHead className="font-semibold text-emerald-700 py-4 px-4 text-center bg-emerald-50/50 min-w-[140px]">
                          Custom Email
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center min-w-[160px]">
                          Zoho Workplace
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center min-w-[160px]">
                          Google Workspace
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PROVIDER_COMPARISON.map((row) => (
                        <TableRow key={row.feature}>
                          <TableCell className="py-3 px-4 font-medium text-slate-700">{row.feature}</TableCell>
                          <TableCell className="py-3 px-4 text-center text-slate-600 bg-emerald-50/20">{row.custom}</TableCell>
                          <TableCell className="py-3 px-4 text-center text-slate-600">{row.zoho}</TableCell>
                          <TableCell className="py-3 px-4 text-center text-slate-600">{row.google}</TableCell>
                        </TableRow>
                      ))}
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
                Learn more about our email hosting services
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
                Get Your Professional Email Today
              </h3>
              <p className="text-emerald-100 text-sm">
                Start with a custom email or choose a full workspace suite. Setup in minutes.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 h-12 font-semibold shadow-lg"
              onClick={() => {
                const plan = EMAIL_PLANS.find(p => p.id === 'email-business')
                if (plan) handleGetStarted(plan)
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
