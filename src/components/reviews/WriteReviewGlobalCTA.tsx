'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShoppingBag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface EligibleProduct {
  orderId: string
  productId: string
  productName: string
  productSlug: string
}

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } : {}
}

// Page /avis — jamais la liste des 200 produits du catalogue : uniquement
// ce que l'utilisateur connecté a réellement acheté et pas encore noté.
export function WriteReviewGlobalCTA() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<EligibleProduct[]>([])
  const [requestingId, setRequestingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) return
      try {
        const headers = await authHeaders()
        const res = await fetch('/api/reviews/eligibility', { headers })
        const body = await res.json()
        if (!cancelled) setProducts(body.products || [])
      } catch {
        // ignore — la liste reste vide
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  const handleRequest = async (product: EligibleProduct) => {
    setRequestingId(product.productId)
    const headers = await authHeaders()
    const res = await fetch('/api/reviews/eligibility', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId: product.orderId, productId: product.productId }),
    })
    const body = await res.json().catch(() => null)
    setRequestingId(null)
    if (body?.reviewUrl) {
      const url = new URL(body.reviewUrl)
      router.push(`${url.pathname}${url.search}`)
    }
  }

  if (!user) {
    return (
      <div>
        <p className="font-medium tracking-wide">Vous avez testé un de nos décants ?</p>
        <p className="text-sm text-muted-foreground mt-1.5">
          Un lien sécurisé pour déposer votre avis vous est envoyé par email après chaque commande — pas besoin de compte.
        </p>
      </div>
    )
  }

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  }

  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Vous avez déjà donné votre avis sur tous vos achats — merci !
      </p>
    )
  }

  return (
    <div>
      <p className="font-medium tracking-wide mb-3">Donnez votre avis sur vos achats</p>
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={`${p.orderId}:${p.productId}`} className="flex items-center justify-between gap-4 border border-border p-3">
            <Link href={`/parfum/${p.productSlug}`} className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors min-w-0">
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{p.productName}</span>
            </Link>
            <button
              onClick={() => handleRequest(p)}
              disabled={requestingId === p.productId}
              className="flex-shrink-0 px-4 py-2 bg-foreground text-background text-xs tracking-[0.1em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {requestingId === p.productId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Laisser un avis
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
