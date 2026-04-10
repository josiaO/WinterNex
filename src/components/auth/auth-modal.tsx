'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Shield, Zap, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/store/app-store'
import { SWAHILI, ENGLISH } from '@/lib/domain-data'
import { toast } from 'sonner'

// ── Client-side mock users (no API call needed) ──
const MOCK_USERS: Record<string, { id: string; email: string; name: string; phone: string; isAdmin: boolean }> = {
  'admin@domainhub.co.tz': {
    id: 'user_admin',
    email: 'admin@domainhub.co.tz',
    name: 'Juma Mwangi',
    phone: '+255 713 456 789',
    isAdmin: true,
  },
  'fatma@dukaladigital.co.tz': {
    id: 'user_fatma',
    email: 'fatma@dukaladigital.co.tz',
    name: 'Fatma Hassan',
    phone: '+255 786 123 456',
    isAdmin: false,
  },
}

function mockLogin(email: string, name?: string) {
  const existing = MOCK_USERS[email.toLowerCase().trim()]
  if (existing) {
    return { user: existing, isAdmin: existing.isAdmin }
  }
  // Auto-create new user for any email
  return {
    user: {
      id: `user_${Date.now()}`,
      email: email.toLowerCase().trim(),
      name: name || email.split('@')[0],
      phone: '',
      isAdmin: false,
    },
    isAdmin: false,
  }
}

export function AuthModal() {
  const { authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, login, setAdmin, navigate, locale } = useAppStore()
  const t = locale === 'sw' ? SWAHILI : ENGLISH
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('admin@domainhub.co.tz')
  const [loginPassword, setLoginPassword] = useState('')

  // Signup form
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('+255')
  const [signupPassword, setSignupPassword] = useState('')
  const [contactPrivacy, setContactPrivacy] = useState(true)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail) {
      toast.error(locale === 'sw' ? 'Tafadhali ingiza barua pepe yako' : 'Please enter your email')
      return
    }

    setLoading(true)
    // Simulate network delay
    setTimeout(() => {
      try {
        const result = mockLogin(loginEmail)
        login(result.user)
        if (result.isAdmin) {
          setAdmin(true)
          navigate('admin')
        }
        toast.success(locale === 'sw' ? 'Karibu tena!' : 'Welcome back!')
      } catch {
        toast.error(locale === 'sw' ? 'Kuingia kumeshindwa. Jaribu tena.' : 'Login failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupEmail || !signupName) {
      toast.error(locale === 'sw' ? 'Tafadhali jaza sehemu zote zinazohitajika' : 'Please fill in all required fields')
      return
    }

    setLoading(true)
    setTimeout(() => {
      try {
        const result = mockLogin(signupEmail, signupName)
        login(result.user)
        toast.success(locale === 'sw' ? 'Akaunti imeundwa kwa mafanikio!' : 'Account created successfully!')
      } catch {
        toast.error(locale === 'sw' ? 'Usajili umeshindwa. Jaribu tena.' : 'Signup failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 500)
  }

  const quickLogin = (email: string, isAdmin: boolean) => {
    setLoading(true)
    setTimeout(() => {
      const result = mockLogin(email)
      login(result.user)
      setAdmin(isAdmin)
      if (isAdmin) {
        navigate('admin')
      }
      toast.success(isAdmin
        ? (locale === 'sw' ? 'Umengia kama Admin (Juma Mwangi)' : 'Signed in as Admin')
        : (locale === 'sw' ? 'Umengia kama mtumiaji mpya' : 'Signed in as new user')
      )
      setLoading(false)
    }, 400)
  }

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setAuthModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-2xl">
                  {locale === 'sw' ? 'Karibu kwa DomainHub' : 'Welcome to DomainHub'}
                </CardTitle>
                <CardDescription>
                  {locale === 'sw'
                    ? 'Simamia majina yako na jenga uwepo wako mtandaoni'
                    : 'Manage your domains and build your online presence'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={authModalMode} onValueChange={(v) => setAuthModalMode(v as 'login' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">{t.signIn}</TabsTrigger>
                    <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t.email}</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">{t.password}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={locale === 'sw' ? 'Ingiza nenosiri lako' : 'Enter your password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {locale === 'sw' ? 'Inaingia...' : 'Signing in...'}
                          </>
                        ) : (
                          t.signIn
                        )}
                      </Button>

                      {/* WhatsApp login hint */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-muted-foreground">
                          {locale === 'sw'
                            ? 'Au wasiliana nasi kupitia WhatsApp kwa msaada'
                            : 'Or contact us via WhatsApp for help'}
                        </p>
                      </div>

                      {/* Quick demo sign-in */}
                      <div className="pt-2">
                        <p className="text-xs text-center text-muted-foreground mb-3">
                          {locale === 'sw' ? 'Ingia haraka kwa Demo' : 'Quick Demo Sign In'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={loading}
                            onClick={() => quickLogin('admin@domainhub.co.tz', true)}
                          >
                            <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            {locale === 'sw' ? 'Admin' : 'Admin'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            disabled={loading}
                            onClick={() => quickLogin('user@example.com', false)}
                          >
                            <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            {locale === 'sw' ? 'Mtumiaji Mpya' : 'New User'}
                          </Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-2">
                          {locale === 'sw'
                            ? 'Au ingiza barua pepe yoyote hapo juu na bonyeza Ingia'
                            : 'Or enter any email above and click Sign In'}
                        </p>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">
                          {locale === 'sw' ? 'Jina Kamili' : 'Full Name'} *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder={locale === 'sw' ? 'Juma Mwangi' : 'John Kamau'}
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t.email} *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">
                          {locale === 'sw' ? 'Simu (si lazima)' : 'Phone (optional)'}
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder={t.phonePlaceholder}
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t.password}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={locale === 'sw' ? 'Unda nenosiri' : 'Create a password'}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Contact Privacy toggle */}
                      <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            {locale === 'sw' ? 'Faragha ya Mawasiliano' : 'Contact Privacy'}
                          </Label>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {locale === 'sw'
                              ? 'Ficha maelezo yako kutoka kwa umma'
                              : 'Hide your details from the public'}
                          </p>
                        </div>
                        <Switch
                          checked={contactPrivacy}
                          onCheckedChange={setContactPrivacy}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>

                      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {locale === 'sw' ? 'Inaunda akaunti...' : 'Creating account...'}
                          </>
                        ) : (
                          t.createAccount
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
