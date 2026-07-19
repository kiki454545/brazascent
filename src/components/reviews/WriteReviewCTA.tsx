'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface WriteReviewCTAProps {
  productId: string
}

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : {}
}

// Trois cas gérés ici, jamais de formulaire pouvant échouer silencieusement
// à cause de la RLS :
// 1. Visiteur non connecté → message clair (lien envoyé après commande)
// 2. Connecté, a acheté ce produit sans avis → bouton qui émet un token et
//    redirige vers /avis/laisser (POST /api/reviews/eligibility)
// 3. Connecté mais n'a pas acheté ce produit → rien n'est affiché
export function WriteReviewCTA({ productId }: WriteReviewCTAProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      if (!user) return
      try {
        const headers = await authHeaders()
        const res = await fetch('/api/reviews/eligibility', { headers })
        const body = await res.json()
        if (cancelled) return
        const match = (body.products || []).find((p: { productId: string }) => p.productId === productId)
        setEligibleOrderId(match?.orderId ?? null)
      } catch {
        // ignore — le CTA reste simplement masqué
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [user, productId])

  const handleRequest = async () => {
    if (!eligibleOrderId) return
    setRequesting(true)
    const headers = await authHeaders()
    const res = await fetch('/api/reviews/eligibility', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId: eligibleOrderId, productId }),
    })
    const body = await res.json().catch(() => null)
    setRequesting(false)
    if (body?.reviewUrl) {
      const url = new URL(body.reviewUrl)
      router.push(`${url.pathname}${url.search}`)
    }
  }

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Vous avez acheté ce parfum ? Un lien sécurisé pour déposer votre avis vous est envoyé par email après votre commande.
      </p>
    )
  }

  if (checking) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  }

  if (!eligibleOrderId) return null

  return (
    <button
      onClick={handleRequest}
      disabled={requesting}
      className="btn-luxury px-6 py-2.5 bg-foreground text-background text-xs tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
      Laisser un avis
    </button>
  )
}
