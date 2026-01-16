'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Building2, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { ProductCard } from '@/components/ProductCard'

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

    const fetchBrandAndProducts = async () => {
      try {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('slug', slug)
          .single()

        if (!isMounted) return

        if (brandError || !brandData) {
          console.error('Error fetching brand:', brandError)
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
          console.error('Error fetching products:', productsError)
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
        console.error('Error:', err)
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
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl mb-4">Marque non trouvée</h1>
          <Link href="/marques" className="text-[#C9A962] hover:underline">
            Retour aux marques
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        {brand.logo ? (
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#19110B] to-[#2a1f15]" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Maison
            </span>
            <h1 className="text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-4">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-lg font-light max-w-2xl mx-auto px-6">
                {brand.description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-[#C9A962]">
              Accueil
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/marques" className="text-gray-500 hover:text-[#C9A962]">
              Marques
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-[#19110B]">{brand.name}</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-2xl lg:text-3xl font-light tracking-[0.1em] uppercase">
                Nos Parfums
              </h2>
              <p className="text-gray-500 mt-2">
                {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/marques"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C9A962] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Toutes les marques
            </Link>
          </motion.div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                Aucun produit disponible pour cette marque
              </p>
              <p className="text-sm text-gray-400">
                Revenez bientôt pour découvrir nos nouveautés
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Back to brands CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-light tracking-[0.1em] uppercase mb-4">
              Découvrez nos autres marques
            </h3>
            <Link
              href="/marques"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#19110B] text-white text-sm tracking-[0.1em] uppercase hover:bg-[#C9A962] transition-colors"
            >
              Voir toutes les marques
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
