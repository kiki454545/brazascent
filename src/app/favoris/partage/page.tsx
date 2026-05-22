'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cart'
import { Product } from '@/types'

function mapProduct(p: any): Product {
  const priceBySize = typeof p.price_by_size === 'string'
    ? JSON.parse(p.price_by_size)
    : (p.price_by_size || {})
  const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
  const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    shortDescription: p.short_description || '',
    price: displayPrice,
    originalPrice: p.original_price,
    priceBySize,
    images: p.images || [],
    size: p.sizes || [],
    category: p.category || 'unisexe',
    collection: p.collection,
    brand: p.brand || '',
    notes: { top: p.notes_top || [], heart: p.notes_heart || [], base: p.notes_base || [] },
    stock: p.stock ?? 1,
    inStock: (p.stock || 0) > 0,
    new: p.is_new,
    bestseller: p.is_bestseller,
    featured: p.is_bestseller,
    promo: p.is_promo ?? false,
  }
}

export default function WishlistSharePage() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem, openCart } = useCartStore()

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false)
      return
    }
    supabase
      .from('products')
      .select('*')
      .in('id', ids)
      .eq('is_active', true)
      .then(({ data }) => {
        setProducts((data || []).map(mapProduct))
        setLoading(false)
      })
  }, [ids.join(',')])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Heart className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
          <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-4">
            Liste introuvable
          </h1>
          <p className="text-muted-foreground mb-8">
            Ce lien de partage ne contient aucun produit disponible.
          </p>
          <Link href="/parfums" className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors">
            Découvrir nos parfums
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="px-6 sm:px-10 lg:px-20">
        <div className="mb-10 text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-primary mb-3 block">Sélection partagée</span>
          <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-3">
            Liste de favoris
          </h1>
          <p className="text-muted-foreground">
            {products.length} parfum{products.length > 1 ? 's' : ''} sélectionné{products.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {products.map(product => (
            <div key={product.id} className="group">
              <div className="relative aspect-[3/4] bg-cream mb-3 overflow-hidden">
                <Link href={`/parfum/${product.slug}`}>
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white/90 text-foreground text-xs px-3 py-1 uppercase tracking-wider">Indisponible</span>
                  </div>
                )}
                {product.inStock && (
                  <button
                    onClick={() => { addItem(product, product.size[0]); openCart() }}
                    className="absolute bottom-3 left-3 right-3 py-2.5 bg-white text-xs tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground hover:text-background"
                  >
                    Ajouter au panier
                  </button>
                )}
              </div>
              <Link href={`/parfum/${product.slug}`}>
                <p className="text-xs text-primary tracking-[0.2em] uppercase mb-1">{product.brand}</p>
                <h3 className="text-sm font-light tracking-[0.05em] uppercase mb-1 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                <p className="text-sm">À partir de {product.price} €</p>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/parfums" className="inline-flex items-center gap-3 px-8 py-4 border border-foreground text-sm tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors">
            Voir tous nos parfums
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
