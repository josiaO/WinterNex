'use client'

import { useState } from 'react'
import { MessageCircle, X, Send, Phone, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { AnimatePresence, motion } from 'framer-motion'

export function WhatsAppWidget() {
  const { locale } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const phoneNumber = '+255712345678'
  const message = encodeURIComponent(
    locale === 'sw'
      ? 'Habari DomainHub! Natafuta msaada kuhusu majina ya tovuti.'
      : 'Hi DomainHub! I need help with domain registration.'
  )

  const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-80 rounded-2xl bg-background border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">DomainHub Support</h3>
                  <p className="text-xs text-emerald-100">
                    {locale === 'sw' ? 'Typically replies in minutes' : 'Typically replies in minutes'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {/* Agent message */}
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none px-3 py-2 max-w-[85%]">
                  <p className="text-sm text-foreground">
                    {locale === 'sw'
                      ? 'Karibu! 👋 Naweza kutusaidia kwa maswali kuhusu majina ya tovuti, malipo, DNS, au kujenga tovuti. Tumia kitufe cha WhatsApp au wasiliana nasi hapa.'
                      : 'Welcome! 👋 We can help you with domain questions, payments, DNS, or building a website. Use the WhatsApp button or chat with us here.'}
                  </p>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="space-y-1.5">
                <button
                  onClick={() => window.open(whatsappUrl, '_blank')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {locale === 'sw' ? 'Anza Mazungumzo ya WhatsApp' : 'Start WhatsApp Chat'}
                </button>
                <button
                  onClick={() => window.open(`tel:${phoneNumber}`)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {locale === 'sw' ? 'Piga Simu' : 'Call Us'}
                </button>
              </div>

              {/* Operating hours */}
              <p className="text-xs text-center text-muted-foreground">
                {locale === 'sw'
                  ? 'Masaa: Jumatatu - Ijumaa, 8:00 asubuhi - 8:00 jioni (EAT)'
                  : 'Hours: Mon-Fri, 8:00 AM - 8:00 PM (EAT)'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isOpen && !isMinimized) {
            setIsMinimized(true)
          } else if (isMinimized) {
            setIsMinimized(false)
          } else {
            setIsOpen(true)
          }
        }}
        className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse indicator */}
      {!isOpen && (
        <span className="absolute top-0 right-0 w-4 h-4">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
        </span>
      )}
    </div>
  )
}
