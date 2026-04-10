import { create } from 'zustand'

export type AppPage = 
  | 'home' 
  | 'search' 
  | 'dashboard' 
  | 'domains' 
  | 'domain-detail' 
  | 'checkout'
  | 'builder' 
  | 'builder-editor' 
  | 'billing' 
  | 'settings'
  | 'premium-domains'
  | 'admin'
  | 'hosting'
  | 'email'
  | 'ssl'
  | 'bundles'

export interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
}

export interface DomainResult {
  domain: string
  tld: string
  available: boolean
  price: number
  currency: string
  premium: boolean
}

export interface CartItem {
  domain: string
  tld: string
  price: number
  type: 'registration' | 'renewal' | 'transfer'
  years: number
}

export interface AppState {
  // Navigation
  currentPage: AppPage
  previousPage: AppPage | null
  navigate: (page: AppPage) => void
  goBack: () => void

  // Auth
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void

  // Search
  searchQuery: string
  searchResults: DomainResult[]
  isSearching: boolean
  setSearchQuery: (query: string) => void
  setSearchResults: (results: DomainResult[]) => void
  setIsSearching: (searching: boolean) => void

  // Cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (domain: string) => void
  clearCart: () => void
  cartTotal: () => number

  // Selected domain for detail view
  selectedDomain: string | null
  setSelectedDomain: (domain: string | null) => void

  // Language
  locale: 'sw' | 'en'
  setLocale: (locale: 'sw' | 'en') => void

  // Payment
  paymentMethod: 'mpesa' | 'tigopesa' | 'airtel' | 'card' | null
  setPaymentMethod: (method: 'mpesa' | 'tigopesa' | 'airtel' | 'card' | null) => void
  paymentStatus: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
  setPaymentStatus: (status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed') => void

  // Checkout
  checkoutAmount: number
  checkoutDescription: string
  startCheckout: (amount: number, description: string) => void

  // AI Builder
  builderStep: 'form' | 'generating' | 'preview' | 'editing' | 'publishing'
  setBuilderStep: (step: 'form' | 'generating' | 'preview' | 'editing' | 'publishing') => void
  generatedHTML: string | null
  setGeneratedHTML: (html: string | null) => void

  // UI State
  authModalOpen: boolean
  setAuthModalOpen: (open: boolean) => void
  authModalMode: 'login' | 'signup'
  setAuthModalMode: (mode: 'login' | 'signup') => void
  paymentModalOpen: boolean
  setPaymentModalOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Admin
  isAdmin: boolean
  setAdmin: (admin: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'home',
  previousPage: null,
  navigate: (page) => set((state) => ({ 
    previousPage: state.currentPage, 
    currentPage: page,
    sidebarOpen: false,
  })),
  goBack: () => set((state) => ({
    currentPage: state.previousPage || 'home',
    previousPage: null,
  })),

  // Auth
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true, authModalOpen: false }),
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    currentPage: 'home',
    cart: [],
  }),

  // Search
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (searching) => set({ isSearching: searching }),

  // Cart
  cart: [],
  addToCart: (item) => set((state) => {
    const exists = state.cart.find(c => c.domain === item.domain)
    if (exists) return state
    return { cart: [...state.cart, item] }
  }),
  removeFromCart: (domain) => set((state) => ({
    cart: state.cart.filter(c => c.domain !== domain),
  })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((total, item) => total + item.price * item.years, 0),

  // Selected domain
  selectedDomain: null,
  setSelectedDomain: (domain) => set({ selectedDomain: domain }),

  // Language (Swahili default for Tanzania)
  locale: 'sw',
  setLocale: (locale) => set({ locale }),

  // Payment
  paymentMethod: null,
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  paymentStatus: 'idle',
  setPaymentStatus: (status) => set({ paymentStatus: status }),

  // Checkout
  checkoutAmount: 0,
  checkoutDescription: '',
  startCheckout: (amount, description) => set({ checkoutAmount: amount, checkoutDescription: description, currentPage: 'checkout' }),

  // AI Builder
  builderStep: 'form',
  setBuilderStep: (step) => set({ builderStep: step }),
  generatedHTML: null,
  setGeneratedHTML: (html) => set({ generatedHTML: html }),

  // UI State
  authModalOpen: false,
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  authModalMode: 'login',
  setAuthModalMode: (mode) => set({ authModalMode: mode }),
  paymentModalOpen: false,
  setPaymentModalOpen: (open) => set({ paymentModalOpen: open }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Admin
  isAdmin: false,
  setAdmin: (admin) => set({ isAdmin: admin }),
}))
