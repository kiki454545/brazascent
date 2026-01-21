'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cart'

// Générer un ID de session unique
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Récupérer ou créer le session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('tracking_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem('tracking_session_id', sessionId)
  }
  return sessionId
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { items, getCartTotal } = useCartStore()
  const lastPathRef = useRef<string>('')
  const pageStartTimeRef = useRef<number>(Date.now())
  const sessionStartRef = useRef<number>(Date.now())
  const isInitializedRef = useRef(false)

  // Envoyer les données de tracking
  const track = useCallback(async (action: string, data?: Record<string, unknown>) => {
    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })
    } catch (error) {
      // Silently fail - tracking shouldn't break the site
      console.debug('Tracking error:', error)
    }
  }, [])

  // Initialisation - enregistrer la visite
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const sessionId = getSessionId()
    track('visit', { sessionId })
  }, [track])

  // Tracker les changements de page
  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return

    const sessionId = getSessionId()

    // Envoyer le temps passé sur la page précédente
    if (lastPathRef.current) {
      const timeOnPage = Math.round((Date.now() - pageStartTimeRef.current) / 1000)
      // On n'envoie pas ici car le pageview a déjà été envoyé
    }

    // Enregistrer la nouvelle page vue
    track('pageview', {
      pageUrl: pathname,
      pageTitle: document.title,
      referrer: document.referrer,
      sessionId,
    })

    lastPathRef.current = pathname
    pageStartTimeRef.current = Date.now()
  }, [pathname, track])

  // Tracker les changements de panier
  useEffect(() => {
    if (items.length === 0) return

    const sessionId = getSessionId()
    const cartItems = items.map(item => ({
      product_id: item.product.id,
      name: item.product.name,
      size: item.selectedSize,
      quantity: item.quantity,
      price: item.product.priceBySize?.[item.selectedSize] || item.product.price,
      image: item.product.images?.[0],
    }))

    // Débounce pour éviter trop de requêtes
    const timeout = setTimeout(() => {
      track('cart', {
        items: cartItems,
        subtotal: getCartTotal(),
        sessionId,
      })
    }, 2000)

    return () => clearTimeout(timeout)
  }, [items, getCartTotal, track])

  // Tracker la fin de session (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionId = getSessionId()
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000)

      // Utiliser sendBeacon pour garantir l'envoi
      navigator.sendBeacon('/api/tracking', JSON.stringify({
        action: 'end_session',
        data: { sessionId, duration }
      }))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return <>{children}</>
}
