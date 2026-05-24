'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ChevronRight, Truck, Gift, Loader2, Package, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cart'
import { useSettingsStore } from '@/store/settings'
import { ProductCard } from '@/components/ProductCard'
import { Benefits } from '@/components/Benefits'
import TrustBadges from '@/components/TrustBadges'
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
  allow_size_choice: boolean
  discount_percentage: number | null
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
  const [clientSelections, setClientSelections] = useState<ProductSelection[]>([])
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
          // Initialiser les sélections client avec les tailles par défaut du pack
          setClientSelections(packData.product_selections.map((s: ProductSelection) => ({ ...s })))
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

  const updateClientSize = (productId: string, size: string) => {
    setClientSelections(prev =>
      prev.map(s => s.productId === productId ? { ...s, size } : s)
    )
  }

  const getProductSelectionInfo = (productId: string, product: Product) => {
    // Si choix client activé, utiliser clientSelections, sinon les sélections fixes du pack
    const selections = pack?.allow_size_choice ? clientSelections : productSelections
    const selection = selections.find(s => s.productId === productId)
    const selectedSize = selection?.size || product.size?.[0] || ''

    let price = product.price
    if (product.priceBySize && selectedSize && product.priceBySize[selectedSize] > 0) {
      price = product.priceBySize[selectedSize]
    }

    return { selectedSize, price }
  }

  // Prix total des produits selon les sélections actuelles
  const getTotalProductsPrice = (): number => {
    return packProducts.reduce((total, product) => {
      const { price } = getProductSelectionInfo(product.id, product)
      return total + price
    }, 0)
  }

  // Prix final du pack (dynamique si discount_percentage, fixe sinon)
  const getFinalPackPrice = (): number => {
    if (!pack) return 0
    if (pack.discount_percentage && pack.allow_size_choice) {
      return getTotalProductsPrice() * (1 - pack.discount_percentage / 100)
    }
    return pack.price
  }

  const handleAddToCart = () => {
    if (!pack) return

    const finalPrice = getFinalPackPrice()
    const packAsProduct = {
      id: pack.id,
      name: pack.name,
      slug: pack.slug,
      description: pack.description,
      shortDescription: pack.description.substring(0, 100),
      price: finalPrice,
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Pack non trouvé</h1>
          <Link href="/packs" className="text-primary hover:underline">
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
      <div className="px-6 sm:px-10 lg:px-20 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link href="/packs" className="hover:text-primary">Packs</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-foreground truncate">{pack.name}</span>
        </nav>
      </div>

      {/* Pack Section */}
      <section className="px-6 sm:px-10 lg:px-20 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative aspect-square bg-cream overflow-hidden">
              <Image
                src={pack.image}
                alt={pack.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {pack.tag && (
                  <span className="px-3 py-1 bg-primary text-white text-xs tracking-[0.15em] uppercase">
                    {pack.tag}
                  </span>
                )}
                {discount > 0 && (
                  <span className="px-3 py-1 bg-foreground text-background text-xs tracking-[0.15em] uppercase">
                    -{discount}%
                  </span>
                )}
              </div>
            </div>
          </m.div>

          {/* Pack Info */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Tag */}
            <p className="text-sm tracking-[0.2em] uppercase text-primary mb-2">
              Coffret
            </p>

            {/* Name */}
            <h1 className="text-4xl lg:text-5xl font-light tracking-[0.1em] mb-4">
              {pack.name}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6">{pack.description}</p>

            {/* Price */}
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              <span className="text-3xl font-light">{getFinalPackPrice().toFixed(2)} €</span>
              {pack.original_price && !pack.discount_percentage && (
                <>
                  <span className="text-lg text-muted-foreground/60 line-through">{pack.original_price} €</span>
                  <span className="text-sm text-primary font-medium">
                    Économisez {(pack.original_price - pack.price).toFixed(2)} €
                  </span>
                </>
              )}
              {pack.discount_percentage && pack.allow_size_choice && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
                  -{pack.discount_percentage}% appliqué
                </span>
              )}
            </div>

            {/* Pack contents */}
            {packProducts.length > 0 && (
              <div className="mb-8">
                <p className="text-sm tracking-[0.15em] uppercase mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Ce coffret contient
                </p>
                <div className="border border-border p-4 space-y-3">
                  {packProducts.map((product) => {
                    const { selectedSize, price } = getProductSelectionInfo(product.id, product)
                    return (
                      <div key={product.id} className="flex items-center gap-4 p-2">
                        <div className="relative w-16 h-16 bg-cream overflow-hidden flex-shrink-0">
                          {product.images[0] && (
                            <Image src={product.images[0]} alt={product.name} fill sizes="64px" className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/parfum/${product.slug}`} className="font-medium truncate hover:text-primary transition-colors block">
                            {product.name}
                          </Link>
                          {/* Sélecteur de taille si allow_size_choice */}
                          {pack.allow_size_choice && product.size && product.size.length > 1 ? (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {product.size.map((s) => {
                                const sPrice = product.priceBySize?.[s] ?? product.price
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateClientSize(product.id, s)}
                                    className={`px-2 py-0.5 text-xs border rounded transition-colors ${
                                      selectedSize === s
                                        ? 'border-primary bg-primary/10 text-primary font-medium'
                                        : 'border-border hover:border-primary text-muted-foreground'
                                    }`}
                                  >
                                    {s} — {sPrice} €
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {selectedSize && <span className="text-primary">{selectedSize}</span>}
                              {selectedSize && ' — '}
                              {price} €
                            </p>
                          )}
                        </div>
                        {!pack.allow_size_choice && <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />}
                      </div>
                    )
                  })}
                </div>

                {/* Récap prix si discount_percentage */}
                {pack.discount_percentage && pack.allow_size_choice && (
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total à l'unité</span>
                      <span className="line-through text-muted-foreground/60">{getTotalProductsPrice().toFixed(2)} €</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-primary font-medium">Réduction pack -{pack.discount_percentage}%</span>
                      <span className="text-primary font-bold">{getFinalPackPrice().toFixed(2)} €</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vous économisez {(getTotalProductsPrice() - getFinalPackPrice()).toFixed(2)} €
                    </p>
                  </div>
                )}

                {pack.original_price && !pack.discount_percentage && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Valeur totale : {pack.original_price} € — Vous économisez {(pack.original_price - pack.price).toFixed(2)} €
                  </p>
                )}
              </div>
            )}

            {/* Avertissement si codes promo non autorisés */}
            {pack.promo_allowed === false && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300/90">
                  Les codes promo ne sont pas utilisables sur ce coffret.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mb-8">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-gold-light transition-colors"
              >
                Ajouter au panier
              </button>
            </div>

            {/* Trust badges */}
            <TrustBadges />
          </m.div>
        </div>
      </section>

      {/* Products in Pack */}
      {packProducts.length > 0 && (
        <section className="py-16 lg:py-24 bg-cream">
          <div className="px-6 sm:px-10 lg:px-20">
            <h2 className="text-2xl sm:text-3xl font-light tracking-[0.15em] uppercase text-center mb-12">
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

      <Benefits />
    </div>
  )
}
