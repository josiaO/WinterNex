'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Globe, Shield, Zap, Headphones, ArrowRight, Star, CheckCircle, Smartphone, Lock, BadgeCheck, MessageCircle, Sparkles, Rocket, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAppStore } from '@/store/app-store'
import { formatCurrency, BUNDLE_PRICING, TLD_PRICING, SWAHILI, ENGLISH } from '@/lib/domain-data'
import { ShimmerCard } from '@/components/effects/shimmer-card'
import { TextReveal } from '@/components/effects/text-reveal'
import { AnimatedSection, CountUp, GradientText, FloatElement } from '@/components/effects/animated-sections'

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
}

const slideInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

const slideInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

export function HeroSection() {
  const { locale, navigate, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
    } else {
      navigate('search')
    }
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white">
      {/* Animated background pattern */}
      <motion.div className="absolute inset-0 opacity-10" style={{ y: bgY }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </motion.div>
      
      {/* Animated gradient orbs */}
      <motion.div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl" animate={{ y: [0, 15, 0], scale: [1, 1.05, 1] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl" animate={{ rotate: [0, 360] }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} />

      {/* Animated sparkle dots */}
      {[12, 28, 45, 63, 71, 19, 53, 84, 37, 66, 91, 8].map((leftPct, i) => {
        const topPcts = [77, 47, 28, 55, 85, 15, 69, 50, 81, 88, 82, 20];
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full"
            style={{
              left: `${leftPct}%`,
              top: `${topPcts[i]}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2.5 + (i % 4) * 0.8,
              repeat: Infinity,
              delay: (i % 6) * 0.7,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      <motion.div
        ref={sectionRef}
        style={{ opacity }}
        className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm bg-white/10 text-emerald-300 border-white/20 hover:bg-white/15">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {t.heroBadge}
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
          >
            <TextReveal delay={0.2}>{t.heroTitle}</TextReveal>
            <br />
            <motion.span
              className="bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300 bg-clip-text text-transparent inline-block"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {t.heroTitleHighlight}
            </motion.span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* Search bar in hero */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl mx-auto mb-8"
          >
            <motion.div 
              className="flex items-center bg-white rounded-2xl p-2 shadow-2xl shadow-black/20 cursor-pointer"
              onClick={() => navigate('search')}
              whileHover={{ scale: 1.02, shadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Globe className="w-5 h-5 text-slate-400 ml-4" />
              <span className="flex-1 px-4 py-3 text-slate-400 text-left">
                {t.heroSearchPlaceholder}
              </span>
              <Button className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
                {t.heroSearchBtn}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" onClick={handleGetStarted} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-lg shadow-emerald-600/25">
                <Rocket className="w-4 h-4 mr-2" />
                {locale === 'sw' ? 'Anza Bure' : 'Get Started Free'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" onClick={() => navigate('search')} className="border-white/20 text-white hover:bg-white/10 rounded-xl px-8">
                {formatCurrency(TLD_PRICING['.co.tz'].register)}/{locale === 'sw' ? 'mwaka' : 'yr'} .co.tz
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicators with stagger */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.1, delayChildren: 0.9 } } }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-slate-400"
          >
            {[t.trustNoHidden, t.trustInstant, t.trustSupport, t.trustMpesa].map((text, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </motion.div>
                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export function FeaturesSection() {
  const { locale } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH

  const features = locale === 'sw' ? [
    {
      icon: Globe,
      title: 'Utafutaji wa Majina',
      description: 'Tafuta katika TLD 50+ ikijumuisha .co.tz, .tz, .com, .africa na zaidi. Usajili wa haraka na upatikanaji wa papo hapo.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Shield,
      title: 'Usimamizi wa DNS',
      description: 'Simamia DNS yako, nameserver, na kulinda jina la tovuti kwa urahisi — kila kitu kutoka dashibodi moja.',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      icon: Smartphone,
      title: 'Malipo ya M-Pesa',
      description: 'Lipa kwa M-Pesa kupitia Selcom. Chagua, ingiza nambari ya simu, pokea STK push, na umalize — rahisi na salama.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Headphones,
      title: 'KI Tengeneza Tovuti',
      description: 'Tengeneza tovuti ya kitaalamu kwa dakika. Eleza biashara yako na AI itafanya kazi — iko tayari kwa Kiswahili pia.',
      color: 'bg-purple-50 text-purple-600',
    },
  ] : [
    {
      icon: Globe,
      title: 'Domain Search',
      description: 'Search across 50+ TLDs including .co.tz, .tz, .com, .africa and more. Instant registration with real-time availability.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Shield,
      title: 'DNS Management',
      description: 'Manage your DNS, nameservers, and domain locking with ease — everything from one simple dashboard.',
      color: 'bg-teal-50 text-teal-600',
    },
    {
      icon: Smartphone,
      title: 'M-Pesa Payments',
      description: 'Pay via M-Pesa powered by Selcom. Choose your plan, enter your phone number, receive STK push, and confirm — easy & secure.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: Headphones,
      title: 'AI Website Builder',
      description: 'Generate a professional landing page in minutes. Describe your business and AI does the rest — Swahili-ready too.',
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p variants={fadeInUp} className="text-emerald-600 font-semibold mb-2 text-sm uppercase tracking-wider">
            {locale === 'sw' ? 'Kila Unachohitaji' : 'Everything You Need'}
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {locale === 'sw' ? 'Vipengele Vikali, Bei Rahisi' : 'Powerful Features, Simple Pricing'}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {locale === 'sw'
              ? 'Kutoka utafutaji wa majina hadi kujenga tovuti, tunatoa zana zote unazohitaji kuanzisha na kuua uwepo wako mtandaoni.'
              : 'From domain search to website building, we provide all the tools you need to establish and grow your online presence.'}
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <ShimmerCard className="h-full">
                <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 group bg-card">
                  <CardContent className="p-6">
                    <motion.div
                      className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
                      whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <feature.icon className="w-6 h-6" />
                    </motion.div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ShimmerCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  const { locale } = useAppStore()

  const testimonials = locale === 'sw' ? [
    {
      name: 'Fatma Hassan',
      role: 'CEO, DukaLa Digital, Dar es Salaam',
      content: 'DomainHub ilinifanya iwe rahisi sana kupata mkahawa wangu mtandaoni. Malipo ya M-Pesa yalikuwa laini na kijenga cha AI kilitengeneza ukurasa mzuri kwa dakika!',
      rating: 5,
    },
    {
      name: 'Joseph Mushi',
      role: 'Mwanzilishi, TechPeak Tanzania, Arusha',
      content: 'Niliweza kusajili majina 5 chini ya dakika 10. Dashibodi ni rahisi kutumia na usimamizi wa DNS ni bora zaidi. Huduma bora zaidi nchini Tanzania.',
      rating: 5,
    },
    {
      name: 'Neema Kimaro',
      role: 'Mmiliki, Zanzibar Couture, Zanzibar',
      content: 'Kifurushi cha jina + tovuti kilikuwa kamili kwa biashara yangu ndogo. Nilitoka bila uwepo mtandaoni hadi tovuti ya kitaalamu siku moja.',
      rating: 5,
    },
  ] : [
    {
      name: 'Fatma Hassan',
      role: 'CEO, DukaLa Digital, Dar es Salaam',
      content: 'DomainHub made it incredibly easy to get my restaurant online. The M-Pesa payment was seamless and the AI builder created a beautiful page in minutes!',
      rating: 5,
    },
    {
      name: 'Joseph Mushi',
      role: 'Founder, TechPeak Tanzania, Arusha',
      content: 'I registered 5 domains in under 10 minutes. The dashboard is intuitive and the DNS management is top-notch. Best domain service in Tanzania.',
      rating: 5,
    },
    {
      name: 'Neema Kimaro',
      role: 'Owner, Zanzibar Couture, Zanzibar',
      content: 'The domain + website bundle was perfect for my small business. I went from no online presence to a professional site in one afternoon.',
      rating: 5,
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-muted overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.p variants={fadeInUp} className="text-emerald-600 font-semibold mb-2 text-sm uppercase tracking-wider">
            {locale === 'sw' ? 'Wanaoaminiwa na Elfu' : 'Trusted by Thousands'}
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {locale === 'sw' ? 'Wateja Wetu Wanasema Nini' : 'What Our Customers Say'}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          variants={{ animate: { transition: { staggerChildren: 0.15 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {testimonials.map((testimonial, i) => (
            <motion.div key={testimonial.name} variants={fadeInUp}>
              <ShimmerCard className="h-full">
                <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 + j * 0.05 }}
                        >
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </ShimmerCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function PricingSection() {
  const { locale, navigate, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH

  const handleBundleClick = () => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
    } else {
      navigate('search')
    }
  }

  return (
    <section className="py-20 md:py-28 bg-background" id="pricing">
      {/* Animated stats banner */}
      <AnimatedSection className="mb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: 15800, suffix: '+', label: locale === 'sw' ? 'Majina Yasajiliwa' : 'Domains Registered' },
              { value: 99, suffix: '.9%', label: locale === 'sw' ? 'Uptime' : 'Uptime' },
              { value: 5000, suffix: '+', label: locale === 'sw' ? 'Wateja Wakurugenzi' : 'Happy Customers' },
              { value: 24, suffix: '/7', label: locale === 'sw' ? 'Msaada' : 'Support' },
            ].map((stat, i) => (
              <FloatElement key={i} amplitude={6} duration={3 + i * 0.5}>
                <div className="text-center p-4 rounded-2xl bg-muted/50">
                  <p className="text-3xl md:text-4xl font-bold text-emerald-600">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </FloatElement>
            ))}
          </div>
        </div>
      </AnimatedSection>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-emerald-600 font-semibold mb-2 text-sm uppercase tracking-wider">
            {locale === 'sw' ? 'Bei Wazi' : 'Transparent Pricing'}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {locale === 'sw' ? 'Bei Rahisi, Wazi' : 'Simple, Transparent Pricing'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {locale === 'sw'
              ? 'Bei wazi bila ada zilizofichwa. Lipa kwa Shilingi ya Tanzania.'
              : 'Transparent pricing with no hidden fees. Pay in Tanzanian Shillings.'}
          </p>
        </div>

        {/* Domain TLD pricing with both registration + renewal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16 max-w-6xl mx-auto">
          {Object.entries(TLD_PRICING).slice(0, 10).map(([tld, pricing]) => (
            <Card
              key={tld}
              className="border hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate('search')}
            >
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground mb-3">{tld}</p>
                <div className="space-y-1">
                  <div>
                    <p className="text-lg font-semibold text-emerald-600">{formatCurrency(pricing.register)}</p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'sw' ? 'Usajili' : 'Register'}/{locale === 'sw' ? 'mwaka' : 'yr'}
                    </p>
                  </div>
                  <div className="border-t border-border pt-1 mt-1">
                    <p className="text-sm font-medium text-muted-foreground">{formatCurrency(pricing.renew)}</p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'sw' ? 'Kusasisha' : 'Renewal'}/{locale === 'sw' ? 'mwaka' : 'yr'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bundles */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            {locale === 'sw' ? 'Vifurushi Bora' : 'Value Bundles'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.values(BUNDLE_PRICING).map((bundle, index) => {
              const isPopular = 'popular' in bundle && bundle.popular
              return (
                <Card key={bundle.id} className={`relative border ${isPopular ? 'border-emerald-400 shadow-lg shadow-emerald-100' : 'hover:border-emerald-200'} transition-all`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white">
                        {locale === 'sw' ? 'Bora Zaidi' : 'Best Value'}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h4 className="font-bold text-foreground text-lg mb-1">{bundle.name}</h4>
                    <p className="text-muted-foreground text-sm mb-4">{bundle.description}</p>
                    <div className="mb-4">
                      {bundle.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          {formatCurrency(bundle.originalPrice)}
                        </span>
                      )}
                      <span className="text-3xl font-bold text-foreground">{formatCurrency(bundle.price)}</span>
                      <span className="text-muted-foreground">/{bundle.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {bundle.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full rounded-xl ${isPopular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={handleBundleClick}
                    >
                      {locale === 'sw' ? 'Anza Sasa' : 'Get Started'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function TrustBanner() {
  const { locale } = useAppStore()

  return (
    <section className="py-12 bg-muted border-y border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* TCRA Accreditation */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  {locale === 'sw' ? 'Imeidhinishwa na TCRA' : 'TCRA Accredited'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {locale === 'sw'
                    ? 'Msajili rasmi wa majina nchini Tanzania'
                    : 'Official domain registrar in Tanzania'}
                </p>
              </div>
            </div>

            {/* Payment partners */}
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {locale === 'sw' ? 'Washirika wa Malipo' : 'Payment Partners'}
              </p>
              <div className="flex items-center gap-3">
                {['M-Pesa', 'Selcom', 'Tigo Pesa', 'VISA', 'MC'].map((name) => (
                  <div
                    key={name}
                    className="px-3 py-1.5 bg-background rounded-lg border border-border text-xs font-semibold text-muted-foreground shadow-sm"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>

            {/* SSL Badge */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center">
                <Lock className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">
                  {locale === 'sw' ? 'Linda na SSL' : 'Protected by SSL'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {locale === 'sw'
                    ? 'Cheti cha SSL bure kwa kila jina'
                    : 'Free SSL with every domain'}
                </p>
              </div>
            </div>
          </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}

export function FAQSection() {
  const { locale } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH

  const faqItems = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
  ]

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="text-center mb-12"
        >
          <motion.p variants={fadeInUp} className="text-emerald-600 font-semibold mb-2 text-sm uppercase tracking-wider">
            {locale === 'sw' ? 'Msaada' : 'Support'}
          </motion.p>
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.faqTitle}
          </motion.h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium text-foreground hover:text-emerald-600 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

export function CTASection() {
  const { locale, navigate } = useAppStore()

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white relative overflow-hidden">
      <motion.div className="absolute top-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" animate={{ y: [0, -30, 0], scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-10 left-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl" animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute top-1/2 left-1/3 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl" animate={{ rotate: [0, 180, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
      
      {/* Animated particles in CTA */}
      {[25, 64, 38, 78, 20, 48, 70, 33].map((leftPct, i) => {
        const topPcts = [30, 21, 80, 45, 32, 40, 52, 76];
        return (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-emerald-300 rounded-full"
            style={{ left: `${leftPct}%`, top: `${topPcts[i]}%` }}
            animate={{ opacity: [0, 0.8, 0], y: [0, -40] }}
            transition={{ duration: 3.2 + (i % 3) * 0.9, repeat: Infinity, delay: (i % 5) * 0.8, ease: 'easeOut' }}
          />
        );
      })}

      <AnimatedSection>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
          {locale === 'sw'
            ? 'Uko Tayari Kuanzisha Biashara Yako Mtandaoni?'
            : 'Ready to Launch Your Online Presence?'}
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
          {locale === 'sw'
            ? 'Jiunge na biashara nyingi Tanzania zinazoamini DomainHub kwa mahitaji yao ya majina na hosting. Anza utafutaji wa jina leo.'
            : 'Join thousands of Tanzanian businesses who trust DomainHub for their domain and hosting needs. Start with a domain search today.'}
          </p>
          <div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => navigate('search')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 text-lg shadow-lg shadow-emerald-600/30"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                {locale === 'sw' ? 'Tafuta Majina Sasa' : 'Search Domains Now'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  )
}

export function Footer() {
  const { locale, navigate } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-xl">DomainHub</span>
            </div>
            <p className="text-sm leading-relaxed">
              {t.footerTagline}
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">{t.footerDomains}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('search')} className="hover:text-emerald-400 transition-colors">{t.search} {t.domains}</button></li>
              <li><button onClick={() => navigate('search')} className="hover:text-emerald-400 transition-colors">.co.tz {t.domains}</button></li>
              <li><button onClick={() => navigate('premium-domains')} className="hover:text-emerald-400 transition-colors">{t.premium} {t.domains}</button></li>
              <li><button onClick={() => navigate('search')} className="hover:text-emerald-400 transition-colors">{locale === 'sw' ? 'Hamisha Jina' : 'Domain Transfer'}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.footerServices}</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('hosting')} className="hover:text-emerald-400 transition-colors">{t.hosting}</button></li>
              <li><button onClick={() => navigate('email')} className="hover:text-emerald-400 transition-colors">{t.email}</button></li>
              <li><button onClick={() => navigate('ssl')} className="hover:text-emerald-400 transition-colors">{t.ssl}</button></li>
              <li><button onClick={() => navigate('builder')} className="hover:text-emerald-400 transition-colors">{t.builder}</button></li>
              <li><button onClick={() => navigate('bundles')} className="hover:text-emerald-400 transition-colors">{t.bundles}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.footerSupport}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp {locale === 'sw' ? 'Msaada' : 'Support'}
                </span>
              </li>
              <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">{locale === 'sw' ? 'Kituo cha Msaada' : 'Help Center'}</span></li>
              <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">{locale === 'sw' ? 'Wasiliana Nasi' : 'Contact Us'}</span></li>
              <li><span className="hover:text-emerald-400 transition-colors cursor-pointer">{locale === 'sw' ? 'Hali ya Huduma' : 'Status Page'}</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} DomainHub. {locale === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              {locale === 'sw' ? 'Sera ya Faragha' : 'Privacy Policy'}
            </span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">
              {locale === 'sw' ? 'Masharti ya Huduma' : 'Terms of Service'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
