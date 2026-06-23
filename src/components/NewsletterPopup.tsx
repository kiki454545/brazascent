'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Mail, Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { captureEvent } from '@/lib/analytics'

const STORAGE_KEY = 'brazascent-newsletter-popup'
const DELAY_MS = 20000 // 20 secondes

export function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Ne pas afficher si déjà fermé / inscrit
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return

    const timer = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'dismissed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setStatus('loading')
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'popup' })

      if (error && error.code !== '23505') throw error

      // Email de bienvenue
      fetch('/api/email/newsletter-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(console.error)

      captureEvent('newsletter_subscribed', { source: 'popup' })
      setStatus('success')
      setMessage('Merci ! Retrouvez votre code BIENVENUE10 dans votre email.')
      localStorage.setItem(STORAGE_KEY, 'subscribed')
      setTimeout(() => setVisible(false), 4000)
    } catch {
      setStatus('error')
      setMessage('Une erreur est survenue. Réessayez.')
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={dismiss}
          />
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-background w-full max-w-md pointer-events-auto relative overflow-hidden">
              {/* Décor */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

              <button
                onClick={dismiss}
                aria-label="Fermer la popup"
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 pt-10">
                {/* Icône */}
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-7 h-7 text-primary" />
                </div>

                <div className="text-center mb-6">
                  <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2">Offre exclusive</p>
                  <h2 className="text-2xl font-light tracking-[0.1em] uppercase mb-3">
                    −10% sur votre<br />première commande
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Inscrivez-vous à notre newsletter et recevez votre code promo ainsi que nos nouveautés en avant-première.
                  </p>
                </div>

                {status === 'success' ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{message}</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      disabled={status === 'loading'}
                      className="w-full px-4 py-3 text-sm border border-border focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                      required
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading' || !email}
                      className="w-full py-3 bg-primary text-white text-sm tracking-[0.15em] uppercase hover:bg-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                      Obtenir mon code −10%
                    </button>
                    {status === 'error' && (
                      <p className="text-xs text-red-600 text-center">{message}</p>
                    )}
                  </form>
                )}

                <button
                  onClick={dismiss}
                  className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Non merci, je préfère payer plein tarif
                </button>
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
