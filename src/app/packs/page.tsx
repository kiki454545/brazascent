'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { Gift, Loader2 } from 'lucide-react'
import { Benefits } from '@/components/Benefits'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cart'

interface Pack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  product_ids: string[]
  tag: string | null
  is_active: boolean
}

interface Product {
  id: string
  name: string
}

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    let isMounted = true

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted')
    }

    const fetchData = async () => {
      try {
        // Fetch packs
        const { data: packsData, error: packsError } = await supabase
          .from('packs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!isMounted) return
        if (packsError) throw packsError

        // Fetch products for names
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')

        if (!isMounted) return
        if (productsError) throw productsError

        // Create products lookup
        const productsLookup: Record<string, Product> = {}
        productsData?.forEach(p => {
          productsLookup[p.id] = p
        })

        setPacks(packsData || [])
        setProducts(productsLookup)
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('Error fetching packs:', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map(id => products[id]?.name)
      .filter(Boolean)
      .join(', ')
  }

  const handleAddToCart = (pack: Pack) => {
    // Créer un objet Product compatible pour le panier
    const packAsProduct = {
      id: pack.id,
      name: pack.name,
      slug: pack.slug,
      description: pack.description,
      shortDescription: pack.description.substring(0, 100),
      price: pack.price,
      originalPrice: pack.original_price || undefined,
      images: [pack.image],
      category: 'collection' as const,
      notes: { top: [], heart: [], base: [] },
      size: ['Pack'],
      inStock: true,
    }
    addItem(packAsProduct, 'Pack', 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[360px] overflow-hidden">
        <Image
          src="/images/packs-hero.webp"
          alt="Nos Coffrets"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Packs
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4">
              Notre Sélection
            </h1>
            <p className="text-sm sm:text-lg font-light max-w-xl mx-auto">
              Explorez une sélection de packs soigneusement composés pour vous faire voyager à travers différentes maisons et univers olfactifs.
            </p>
          </m.div>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          {packs.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Aucun pack disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {packs.map((pack, index) => (
                <m.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Link href={`/packs/${pack.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden mb-6 bg-cream">
                      <Image
                        src={pack.image}
                        alt={pack.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {pack.tag && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-xs tracking-wider uppercase">
                          {pack.tag}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-2 group-hover:text-primary transition-colors truncate">
                      {pack.name}
                    </h2>

                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 break-words">
                      {pack.description}
                    </p>

                    {pack.product_ids?.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-4">
                        <p className="line-clamp-1 break-words">Contient : {getProductNames(pack.product_ids)}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-medium">{pack.price} €</span>
                      {pack.original_price && (
                        <span className="text-muted-foreground/60 line-through">{pack.original_price} €</span>
                      )}
                      {pack.original_price && (
                        <span className="text-xs text-primary font-medium">
                          -{Math.round((1 - pack.price / pack.original_price) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => handleAddToCart(pack)}
                    className="w-full mt-4 py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
                  >
                    Ajouter au panier
                  </button>
                </m.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Benefits />

    </div>
  )
}
