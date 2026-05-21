'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flame, Tag, ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

interface SupabaseProductRow {
  id: string
  name: string
  slug: string
  description?: string | null
  short_description?: string | null
  price: number
  original_price?: number | null
  price_by_size?: Record<string, number> | string | null
  images?: string[] | null
  sizes?: string[] | null
  category?: string | null
  collection?: string | null
  brand?: string | null
  notes_top?: string[] | null
  notes_heart?: string[] | null
  notes_base?: string[] | null
  stock?: number | null
  is_new?: boolean
  is_bestseller?: boolean
  is_promo?: boolean
}

export default function PromosClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchPromoProducts = async () => {
      try {
        // Récupérer tous les produits actifs en promo (flag is_promo OU original_price > price)
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!isMounted) return

        if (error) {
          console.error('Erreur récupération promos:', error)
          setLoading(false)
          return
        }

        const promoProducts = (data as SupabaseProductRow[])
          .filter((p) =>
            p.is_promo === true ||
            (p.original_price !== null && p.original_price !== undefined && p.original_price > p.price)
          )
          .map((p): Product => {
            const parsedPriceBySize = typeof p.price_by_size === 'string'
              ? JSON.parse(p.price_by_size)
              : (p.price_by_size || {})

            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description || '',
              shortDescription: p.short_description || '',
              price: p.price,
              originalPrice: p.original_price ?? undefined,
              priceBySize: parsedPriceBySize,
              images: p.images || [],
              size: p.sizes || [],
              category: p.category || 'unisexe',
              collection: p.collection || undefined,
              brand: p.brand || undefined,
              notes: {
                top: p.notes_top || [],
                heart: p.notes_heart || [],
                base: p.notes_base || [],
              },
              stock: p.stock ?? 1,
              inStock: (p.stock ?? 1) > 0,
              new: p.is_new,
              bestseller: p.is_bestseller,
              promo: p.is_promo ?? false,
            }
          })

        setProducts(promoProducts)
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        console.error('Erreur:', err)
        setLoading(false)
      }
    }

    fetchPromoProducts()

    return () => {
      isMounted = false
    }
  }, [])

  // Calculer la remise maximum pour afficher dans le hero
  const maxDiscount = products.reduce((max, p) => {
    if (!p.originalPrice) return max
    const discount = Math.round((1 - p.price / p.originalPrice) * 100)
    return discount > max ? discount : max
  }, 0)

  return (
    <div className="min-h-screen">
      {/* Hero rouge "Soldes" */}
      <section className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white py-24 lg:py-32 overflow-hidden">
        {/* Effet décoratif en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10">
            <Flame className="w-40 h-40" />
          </div>
          <div className="absolute bottom-10 right-10">
            <Tag className="w-32 h-32" />
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-6">
              <Flame className="w-4 h-4" />
              <span className="text-sm tracking-[0.2em] uppercase font-medium">
                Offres limitées
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-[0.1em] uppercase mb-6">
              Promos
            </h1>

            <p className="text-lg lg:text-xl text-white/90 max-w-2xl mx-auto mb-8 font-light">
              Découvrez nos parfums à prix réduits. Une sélection de fragrances de luxe et de niche, à saisir avant qu'elles ne disparaissent.
            </p>

            {maxDiscount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
                className="inline-block px-8 py-3 bg-white text-red-700 text-2xl lg:text-3xl font-bold tracking-wider"
              >
                Jusqu'à -{maxDiscount}%
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Accueil
            </Link>
            <span>/</span>
            <span className="text-foreground">Promos</span>
          </div>
        </div>
      </div>

      {/* Grille des produits */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="text-center py-24">
              <div className="inline-block w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-muted-foreground">Chargement des promos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <Tag className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-2xl font-light tracking-wider mb-2">
                Aucune promo en cours
              </h2>
              <p className="text-muted-foreground mb-8">
                Revenez bientôt pour découvrir nos prochaines offres exceptionnelles.
              </p>
              <Link
                href="/parfums"
                className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
              >
                Découvrir tous les parfums
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-muted-foreground">
                  {products.length} parfum{products.length > 1 ? 's' : ''} en promotion
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}