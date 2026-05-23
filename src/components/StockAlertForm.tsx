'use client'

import { useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import posthog from 'posthog-js'

export function StockAlertForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setStatus('loading')
    try {
      const res = await fetch('/api/stock-alert/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      })

      if (res.ok) {
        posthog.capture('stock_alert_subscribed', { product_id: productId })
        setStatus('success')
        setMessage('Vous serez alerté dès le retour en stock !')
        setEmail('')
      } else {
        throw new Error()
      }
    } catch {
      setStatus('error')
      setMessage('Une erreur est survenue. Réessayez.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm">
        <Check className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    )
  }

  return (
    <div className="border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium tracking-[0.05em] uppercase">Alerte retour en stock</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Ce produit est actuellement indisponible. Laissez votre email pour être notifié dès son retour.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Votre adresse email"
          disabled={status === 'loading'}
          className="flex-1 px-4 py-2.5 text-sm border border-border focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email}
          className="px-5 py-2.5 bg-foreground text-background text-sm tracking-[0.1em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          M'alerter
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600">{message}</p>
      )}
    </div>
  )
}
