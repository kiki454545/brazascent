'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Building2, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { ProductCard } from '@/components/ProductCard'
import { Benefits } from '@/components/Benefits'

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
}

export default function BrandPage() {
  const params = useParams()
  const slug = params.slug as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Forcer loading à true au démarrage
    setLoading(true)
    setBrand(null)
    setProducts([])

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted') || message.includes('signal')
    }

    const fetchBrandAndProducts = async () => {
      try {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!isMounted) return

        if (brandError || !brandData) {
          if (!isAbortError(brandError)) {
            console.error('Error fetching brand:', brandError)
          }
          setLoading(false)
          return
        }

        setBrand(brandData)

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('brand', brandData.name)
          .eq('is_active', true)
          .order('display_order', { ascending: true })

        if (!isMounted) return

        if (productsError) {
          if (!isAbortError(productsError)) {
            console.error('Error fetching products:', productsError)
          }
        } else if (productsData) {
          const mappedProducts: Product[] = productsData.map((p: any) => {
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
              notes: {
                top: p.notes_top || [],
                heart: p.notes_heart || [],
                base: p.notes_base || []
              },
              inStock: (p.stock || 0) > 0,
              new: p.is_new,
              bestseller: p.is_bestseller,
              featured: p.is_bestseller
            }
          })
          setProducts(mappedProducts)
        }
      } catch (err) {
        if (!isMounted) return
        if (!isAbortError(err)) {
          console.error('Error:', err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (slug) {
      fetchBrandAndProducts()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl mb-4">Marque non trouvée</h1>
          <Link href="/marques" className="text-primary hover:underline">
            Retour aux marques
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[40vh] min-h-[240px] sm:min-h-[300px] overflow-hidden">
        {brand.logo ? (
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Maison
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 break-words">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-sm sm:text-lg font-light max-w-2xl mx-auto line-clamp-3 break-words">
                {brand.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="px-6 sm:px-10 lg:px-20 py-4">
          <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-muted-foreground hover:text-primary">
              Accueil
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link href="/marques" className="text-muted-foreground hover:text-primary">
              Marques
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground truncate">{brand.name}</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-light tracking-[0.1em] uppercase">
                Nos Parfums
              </h2>
              <p className="text-muted-foreground mt-2">
                {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/marques"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Toutes les marques
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Aucun produit disponible pour cette marque
              </p>
              <p className="text-sm text-muted-foreground/60">
                Revenez bientôt pour découvrir nos nouveautés
              </p>
            </div>
          )}
        </div>
      </section>

      <Benefits />
    </div>
  )
}
