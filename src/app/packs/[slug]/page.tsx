'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight, Truck, Gift, Loader2, Package, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cart'
import { useSettingsStore } from '@/store/settings'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'

interface ProductSelection {
  productId: string
  size: string
}

interface Pack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  product_ids: string[]
  product_selections: ProductSelection[] | null
  tag: string | null
  is_active: boolean
  promo_allowed: boolean
}

interface ProductData {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  original_price: number | null
  price_by_size: Record<string, number> | null
  images: string[]
  category: string
  notes_top: string[]
  notes_heart: string[]
  notes_base: string[]
  sizes: string[]
  stock: number
  is_new: boolean
  is_bestseller: boolean
}

export default function PackDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [pack, setPack] = useState<Pack | null>(null)
  const [packProducts, setPackProducts] = useState<Product[]>([])
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([])
  const [loading, setLoading] = useState(true)

  const { addItem, openCart } = useCartStore()
  const { settings } = useSettingsStore()

  useEffect(() => {
    let isMounted = true

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted') || message.includes('signal')
    }

    const fetchPack = async () => {
      try {
        // Récupérer le pack par slug
        const { data: packData, error: packError } = await supabase
          .from('packs')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (!isMounted) return

        if (packError || !packData) {
          if (!isAbortError(packError)) {
            console.error('Error fetching pack:', packError)
          }
          setLoading(false)
          return
        }

        setPack(packData)

        // Sauvegarder les sélections de produits
        if (packData.product_selections) {
          setProductSelections(packData.product_selections)
        }

        // Récupérer les produits du pack
        if (packData.product_ids && packData.product_ids.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', packData.product_ids)

          if (!isMounted) return

          if (!productsError && productsData) {
            const mappedProducts: Product[] = productsData.map((p: ProductData) => {
              // Calculer le prix à partir de price_by_size si disponible
              let displayPrice = p.price
              if (p.price_by_size && Object.keys(p.price_by_size).length > 0) {
                const prices = Object.values(p.price_by_size).filter(price => price > 0)
                if (prices.length > 0) {
                  displayPrice = Math.min(...prices) // Afficher le prix minimum (plus petite taille)
                }
              }

              return {
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description || '',
                shortDescription: p.short_description || '',
                price: displayPrice,
                priceBySize: p.price_by_size || undefined,
                originalPrice: p.original_price || undefined,
                images: p.images || [],
                size: p.sizes || [],
                category: (p.category as 'homme' | 'femme' | 'unisexe' | 'collection') || 'unisexe',
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
            setPackProducts(mappedProducts)
          }
        }
      } catch (err) {
        if (!isAbortError(err)) {
          console.error('Error:', err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (slug) {
      fetchPack()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  // Obtenir la taille et le prix sélectionnés pour un produit
  const getProductSelectionInfo = (productId: string, product: Product) => {
    const selection = productSelections.find(s => s.productId === productId)
    const selectedSize = selection?.size || product.size?.[0] || ''

    let price = product.price
    if (product.priceBySize && selectedSize && product.priceBySize[selectedSize] > 0) {
      price = product.priceBySize[selectedSize]
    }

    return { selectedSize, price }
  }

  const handleAddToCart = () => {
    if (!pack) return

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
    openCart()
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Pack non trouvé</h1>
          <Link href="/packs" className="text-[#C9A962] hover:underline">
            Retour aux packs
          </Link>
        </div>
      </div>
    )
  }

  const discount = pack.original_price
    ? Math.round((1 - pack.price / pack.original_price) * 100)
    : 0

  return (
    <div className="min-h-screen pt-28">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#C9A962]">Accueil</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/packs" className="hover:text-[#C9A962]">Packs</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#19110B]">{pack.name}</span>
        </nav>
      </div>

      {/* Pack Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative aspect-square bg-[#F9F6F1] overflow-hidden">
              <Image
                src={pack.image}
                alt={pack.name}
                fill
                className="object-cover"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {pack.tag && (
                  <span className="px-3 py-1 bg-[#C9A962] text-white text-xs tracking-[0.15em] uppercase">
                    {pack.tag}
                  </span>
                )}
                {discount > 0 && (
                  <span className="px-3 py-1 bg-[#19110B] text-white text-xs tracking-[0.15em] uppercase">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Pack Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Tag */}
            <p className="text-sm tracking-[0.2em] uppercase text-[#C9A962] mb-2">
              Coffret
            </p>

            {/* Name */}
            <h1 className="text-4xl lg:text-5xl font-light tracking-[0.1em] mb-4">
              {pack.name}
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">{pack.description}</p>

            {/* Price */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-light">{pack.price} €</span>
              {pack.original_price && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {pack.original_price} €
                  </span>
                  <span className="text-sm text-[#C9A962] font-medium">
                    Économisez {pack.original_price - pack.price} €
                  </span>
                </>
              )}
            </div>

            {/* Pack contents */}
            {packProducts.length > 0 && (
              <div className="mb-8">
                <p className="text-sm tracking-[0.15em] uppercase mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#C9A962]" />
                  Ce coffret contient
                </p>
                <div className="border rounded-lg p-4 space-y-3">
                  {packProducts.map((product) => {
                    const { selectedSize, price } = getProductSelectionInfo(product.id, product)
                    return (
                      <Link
                        key={product.id}
                        href={`/parfum/${product.slug}`}
                        className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="relative w-16 h-16 bg-[#F9F6F1] rounded overflow-hidden flex-shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {selectedSize && <span className="text-[#C9A962]">{selectedSize}</span>}
                            {selectedSize && ' — '}
                            {price} €
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    )
                  })}
                </div>
                {pack.original_price && (
                  <p className="text-sm text-gray-500 mt-2">
                    Valeur totale : {pack.original_price} € — Vous économisez {pack.original_price - pack.price} €
                  </p>
                )}
              </div>
            )}

            {/* Avertissement si codes promo non autorisés */}
            {pack.promo_allowed === false && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Les codes promo ne sont pas utilisables sur ce coffret.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mb-8">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
              >
                Ajouter au panier
              </button>
            </div>

            {/* Services */}
            <div className="border-t border-b py-6 space-y-4">
              <div className="flex items-center gap-4">
                <Truck className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm">Livraison offerte dès {settings.freeShippingThreshold}€</span>
              </div>
              <div className="flex items-center gap-4">
                <Gift className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm">Emballage cadeau offert</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products in Pack */}
      {packProducts.length > 0 && (
        <section className="py-24 bg-[#F9F6F1]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <h2 className="text-3xl font-light tracking-[0.15em] uppercase text-center mb-12">
              Découvrez les parfums du coffret
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {packProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
