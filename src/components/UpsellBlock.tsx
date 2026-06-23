'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/format'
import { Product } from '@/types'
import { captureEvent } from '@/lib/analytics'
import { generateProductImageAlt } from '@/lib/image-seo'

interface RecoProduct {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  price: number
  images: string[]
  stock: number
  priceBySize?: Record<string, number>
  size?: string[]
}

interface UpsellBlockProps {
  compact?: boolean
  className?: string
}

function getMinPrice(p: RecoProduct): number {
  if (p.priceBySize) {
    const prices = Object.values(p.priceBySize).filter(v => v > 0)
    if (prices.length > 0) return Math.min(...prices)
  }
  return p.price
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="border border-border animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded w-full mt-1" />
      </div>
    </div>
  )
}

export function UpsellBlock({ compact = false, className = '' }: UpsellBlockProps) {
  const { items, addItem, getTotal } = useCartStore()
  const [recos, setRecos] = useState<RecoProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const fetchRecos = useCallback(async () => {
    if (items.length === 0) {
      setRecos([])
      return
    }
    setLoading(true)
    setIsFallback(false)
    try {
      const productIds = items.map(i => i.product.id)
      const brands = [...new Set(items.map(i => i.product.brand).filter(Boolean))]
      const categories = [...new Set(items.map(i => i.product.category).filter(Boolean))]
      const cartTotal = getTotal()

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, brands, categories, cartTotal, limit: compact ? 2 : 6 }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const results: RecoProduct[] = data.recommendations || []
      setRecos(results)

      // Detect if it's a fallback (no brand/category signal)
      setIsFallback(brands.length === 0 && categories.length === 0)

      if (results.length > 0) {
        captureEvent('upsell_view', { cart_total: cartTotal, reco_count: results.length, compact })
      }
    } catch (err) {
      console.error('UpsellBlock fetch error:', err)
      setRecos([])
    } finally {
      setLoading(false)
    }
  }, [items, getTotal, compact])

  useEffect(() => { fetchRecos() }, [fetchRecos])

  const handleAdd = (product: RecoProduct) => {
    const sizes = product.size?.length ? product.size : (product.priceBySize ? Object.keys(product.priceBySize) : [])
    const firstSize = sizes[0] || '10ml'
    setAddingId(product.id)
    addItem(product as unknown as Product, firstSize, 1)
    captureEvent('upsell_add_to_cart', { product_id: product.id, product_name: product.name, size: firstSize })
    setTimeout(() => setAddingId(null), 800)
  }

  // ── Compact mode (CartDrawer) ────────────────────────────────────────────
  if (compact) {
    if (loading) return null // compact: ne montre rien pendant le chargement
    const reco = recos[0]
    if (!reco) return null

    return (
      <div className={`border-t pt-4 ${className}`}>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.12em] mb-3">Vous aimerez aussi</p>
        <div className="flex items-center gap-3">
          <Link href={`/parfum/${reco.slug}`} className="relative w-14 h-14 bg-cream flex-shrink-0 hover:opacity-80 transition-opacity">
            <Image src={reco.images[0]} alt={generateProductImageAlt(reco.name, reco.brand, 'product-card')} fill className="object-cover" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{reco.name}</p>
            <p className="text-xs text-muted-foreground">{reco.brand}</p>
            <p className="text-sm font-medium text-primary mt-0.5">dès {formatPrice(getMinPrice(reco))} €</p>
          </div>
          <button
            onClick={() => handleAdd(reco)}
            disabled={addingId === reco.id}
            className="p-2 bg-foreground text-background hover:bg-primary transition-colors disabled:opacity-50 flex-shrink-0"
            title="Ajouter"
          >
            {addingId === reco.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  // ── Full mode (/panier) — toujours affiché si panier non vide ───────────
  if (items.length === 0) return null

  const title = isFallback || recos.length === 0 ? 'Découvrez aussi' : 'Compléter ma sélection'
  const subtitle = isFallback || recos.length === 0
    ? 'Nos best-sellers du moment.'
    : 'Ajoutez une découverte pour comparer les fragrances avant de choisir votre coup de cœur.'

  return (
    <div className={`mt-12 pt-8 border-t ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-light tracking-[0.12em] uppercase mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : recos.map(product => {
              const minPrice = getMinPrice(product)
              const sizes = product.size?.length ? product.size : (product.priceBySize ? Object.keys(product.priceBySize) : [])
              const hasSingleSize = sizes.length <= 1
              const isAdding = addingId === product.id

              return (
                <div key={product.id} className="group border border-border bg-background hover:border-primary/40 transition-colors">
                  <Link href={`/parfum/${product.slug}`} className="block relative aspect-square bg-cream overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={generateProductImageAlt(product.name, product.brand, 'product-card')}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
                    <Link href={`/parfum/${product.slug}`} className="text-sm font-medium leading-tight hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </Link>
                    <p className="text-sm font-medium mt-1">dès {formatPrice(minPrice)} €</p>
                    {hasSingleSize ? (
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={isAdding}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 border border-foreground text-xs tracking-[0.1em] uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                      >
                        {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        {isAdding ? 'Ajouté' : 'Ajouter'}
                      </button>
                    ) : (
                      <Link
                        href={`/parfum/${product.slug}`}
                        className="mt-2 block w-full text-center py-2 border border-foreground text-xs tracking-[0.1em] uppercase hover:bg-foreground hover:text-background transition-colors"
                      >
                        Choisir
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
