'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe, Search, LayoutDashboard, Sparkles, ShoppingCart, LogIn, LogOut, Shield, Server, Mail, Lock, Package, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

import { HeroSection, FeaturesSection, TestimonialsSection, PricingSection, TrustBanner, FAQSection, CTASection, Footer } from '@/components/landing'
import { AuthModal } from '@/components/auth/auth-modal'
import { DomainSearch } from '@/components/search/domain-search'
import { Dashboard } from '@/components/dashboard/dashboard'
import { AIWebsiteBuilder } from '@/components/builder/website-builder'
import { PaymentFlow } from '@/components/payment/payment-flow'
import { PremiumDomainsPage } from '@/components/landing/premium-domains'
import { AdminPanel } from '@/components/admin/admin-panel'
import { HostingPage } from '@/components/services/hosting-page'
import { EmailPage } from '@/components/services/email-page'
import { SslPage } from '@/components/services/ssl-page'
import { BundlesPage } from '@/components/services/bundles-page'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { WhatsAppWidget } from '@/components/shared/whatsapp-widget'

// Pages that show the marketing navigation bar + footer
const MARKETING_PAGES = new Set([
  'home', 'premium-domains', 'hosting', 'email', 'ssl', 'bundles'
])

function AppContent() {
  const {
    currentPage, isAuthenticated, user, cart, navigate,
    setAuthModalOpen, setAuthModalMode, logout, cartTotal,
    checkoutAmount, checkoutDescription, startCheckout,
    locale, setLocale, sidebarOpen, setSidebarOpen,
  } = useAppStore()

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const showNav = MARKETING_PAGES.has(currentPage)

  const handleCartClick = () => {
    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }
    if (cart.length > 0) {
      const total = cartTotal()
      const desc = cart.map(c => c.domain).join(', ')
      startCheckout(total, desc)
    } else {
      navigate('dashboard')
    }
  }

  const handlePaymentSuccess = () => {
    // Will navigate back to dashboard after payment
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      {showNav && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button onClick={() => navigate('home')} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl text-foreground hidden sm:block">DomainHub</span>
              </button>
              <nav className="hidden lg:flex items-center gap-1">
                <button onClick={() => navigate('search')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  Domains
                </button>
                <button onClick={() => navigate('hosting')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  Hosting
                </button>
                <button onClick={() => navigate('email')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  Email
                </button>
                <button onClick={() => navigate('ssl')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  SSL
                </button>
                <button onClick={() => navigate('bundles')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  Bundles
                </button>
                <button onClick={() => navigate('premium-domains')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  Premium
                </button>
                <button onClick={() => navigate('builder')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent">
                  AI Builder
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocale(locale === 'sw' ? 'en' : 'sw')}
                className="text-xs font-bold px-2.5 h-8 gap-1"
              >
                {locale === 'sw' ? '🇹🇿 SW' : '🇬🇧 EN'}
              </Button>

              {cart.length > 0 && (
                <button
                  onClick={handleCartClick}
                  className="relative p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 rounded-full text-white text-xs flex items-center justify-center">
                    {cart.length}
                  </span>
                </button>
              )}

              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <button onClick={logout} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true) }}>
                    <LogIn className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true) }}>
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-lg">
              <div className="container mx-auto px-4 py-3 space-y-1">
                <button onClick={() => { navigate('search'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  Domains
                </button>
                <button onClick={() => { navigate('hosting'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  Hosting
                </button>
                <button onClick={() => { navigate('email'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  Email
                </button>
                <button onClick={() => { navigate('ssl'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  SSL
                </button>
                <button onClick={() => { navigate('bundles'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  Bundles
                </button>
                <button onClick={() => { navigate('premium-domains'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  Premium
                </button>
                <button onClick={() => { navigate('builder'); setMobileMenuOpen(false) }} className="w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2.5 rounded-lg hover:bg-accent">
                  AI Builder
                </button>
                <div className="border-t border-border pt-2 mt-2 sm:hidden">
                  {isAuthenticated ? (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate('dashboard'); setMobileMenuOpen(false) }}>
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        Dashboard
                      </Button>
                      <Button variant="ghost" size="sm" onClick={logout}>
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => { setAuthModalMode('login'); setAuthModalOpen(true); setMobileMenuOpen(false) }}>
                        <LogIn className="w-4 h-4 mr-1" />
                        Sign In
                      </Button>
                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true); setMobileMenuOpen(false) }}>
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Page content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HeroSection />
              <FeaturesSection />
              <PricingSection />
              <TestimonialsSection />
              <TrustBanner />
              <FAQSection />
              <CTASection />
            </motion.div>
          )}

          {currentPage === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DomainSearch />
            </motion.div>
          )}

          {currentPage === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard />
            </motion.div>
          )}

          {currentPage === 'domains' && (
            <motion.div key="domains" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard />
            </motion.div>
          )}

          {currentPage === 'checkout' && (
            <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentFlow
                amount={checkoutAmount}
                description={checkoutDescription}
                onSuccess={handlePaymentSuccess}
                onCancel={() => navigate('search')}
              />
            </motion.div>
          )}

          {currentPage === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIWebsiteBuilder />
            </motion.div>
          )}

          {currentPage === 'billing' && (
            <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard />
            </motion.div>
          )}

          {currentPage === 'premium-domains' && (
            <motion.div key="premium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PremiumDomainsPage />
            </motion.div>
          )}

          {currentPage === 'hosting' && (
            <motion.div key="hosting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HostingPage />
            </motion.div>
          )}

          {currentPage === 'email' && (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmailPage />
            </motion.div>
          )}

          {currentPage === 'ssl' && (
            <motion.div key="ssl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SslPage />
            </motion.div>
          )}

          {currentPage === 'bundles' && (
            <motion.div key="bundles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BundlesPage />
            </motion.div>
          )}

          {currentPage === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer (only on marketing pages) */}
      {showNav && <Footer />}

      {/* Auth Modal */}
      <AuthModal />

      {/* WhatsApp Support Widget — always visible */}
      <WhatsAppWidget />
    </div>
  )
}

export default function Home() {
  return <AppContent />
}
