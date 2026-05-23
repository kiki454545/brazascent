'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { m, AnimatePresence } from 'framer-motion'
import { Heart, Minus, Plus, ChevronRight, Share2, Check, Star, CreditCard, Truck, X, ZoomIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import dynamic from 'next/dynamic'
const OlfactivePyramid = dynamic(() => import('@/components/OlfactivePyramid'), { ssr: false })
const ScentAccords = dynamic(() => import('@/components/ScentAccords'), { ssr: false })
import TrustBadges from '@/components/TrustBadges'
const ReviewSection = dynamic(() => import('@/components/ReviewSection'), { ssr: false })
import { StockAlertForm } from '@/components/StockAlertForm'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useSettingsStore } from '@/store/settings'
import { ProductCard } from '@/components/ProductCard'

interface SupabaseProductRow {
  id: string
  name: string
  slug: string
  description?: string | null
  short_description?: string | null
  price: number
  original_price?: number
  price_by_size?: Record<string, number> | string | null
  images?: string[] | null
  sizes?: string[] | null
  category?: string | null
  collection?: string | null
  brand?: string | null
  notes_top?: string[] | null
  notes_heart?: string[] | null
  notes_base?: string[] | null
  main_accords?: Array<{ name: string; color: string; intensity: number }> | null
  note_images?: Record<string, string> | null
  pyramid_image?: string | null
  accords?: Array<{ nom: string; intensite: number; couleur: string }> | null
  stock?: number | null
  is_new?: boolean
  is_bestseller?: boolean
}

export default function ProductPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({})
  const [priceBySize, setPriceBySize] = useState<Record<string, number>>({})
  const [unlimitedStock, setUnlimitedStock] = useState(false)
  const [globalStock, setGlobalStock] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [copied, setCopied] = useState(false)
  const [canUseApplePay, setCanUseApplePay] = useState(false)

  const { addItem, openCart } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const { settings } = useSettingsStore()

  useEffect(() => {
    let isMounted = true

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted') || message.includes('signal')
    }

    const fetchProduct = async () => {
      try {
        // Récupérer le produit et les images de notes en parallèle
        const [{ data, error }, { data: noteImagesData }, { data: accordColorsData }] = await Promise.all([
          supabase.from('products').select('*').eq('slug', slug).single(),
          supabase.from('note_images').select('note_name, image_url'),
          supabase.from('accord_colors').select('accord_name, bg_color, text_color'),
        ])

        const globalAccordColors: Record<string, { bg: string; text: string }> = {}
        for (const row of accordColorsData || []) {
          globalAccordColors[row.accord_name] = { bg: row.bg_color, text: row.text_color }
        }

        const globalNoteImages: Record<string, string> = {}
        for (const row of noteImagesData || []) {
          if (row.image_url) globalNoteImages[row.note_name] = row.image_url
        }

        if (!isMounted) return

        if (error || !data) {
          if (!isAbortError(error)) {
            console.error('Error fetching product:', error)
          }
          setLoading(false)
          return
        }

        // Parser le prix par taille
        const parsedPriceBySize = typeof data.price_by_size === 'string'
          ? JSON.parse(data.price_by_size)
          : (data.price_by_size || {})

        // Mapper vers le format Product (inclure priceBySize pour le panier)
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          shortDescription: data.short_description || '',
          price: data.price,
          originalPrice: data.original_price,
          priceBySize: parsedPriceBySize,
          images: data.images || [],
          size: data.sizes || [],
          category: data.category || 'unisexe',
          collection: data.collection,
          notes: {
            top: data.notes_top || [],
            heart: data.notes_heart || [],
            base: data.notes_base || []
          },
          mainAccords: data.main_accords || [],
          noteImages: { ...globalNoteImages, ...(data.note_images || {}) },
          pyramidImage: data.pyramid_image || undefined,
          accords: (data.accords || []).map((a: { nom: string; intensite: number; couleur: string }) => {
            const global = globalAccordColors[a.nom]
              ?? Object.entries(globalAccordColors).find(([k]) => a.nom.toLowerCase().includes(k.toLowerCase()))?.[1]
            return global ? { ...a, couleur: global.bg } : a
          }),
          stock: data.stock ?? 1,
          inStock: (data.stock || 0) > 0,
          new: data.is_new,
          bestseller: data.is_bestseller,
          featured: data.is_bestseller
        }

        setProduct(mappedProduct)
        setStockBySize(data.stock_by_size || {})
        setUnlimitedStock(data.unlimited_stock ?? false)
        // Si stock est explicitement 0, c'est une rupture. Si null/undefined, utiliser 1 par défaut
        setGlobalStock(data.stock !== null && data.stock !== undefined ? data.stock : 1)
        setPriceBySize(parsedPriceBySize)
        setSelectedSize(mappedProduct.size[1] || mappedProduct.size[0] || '')

        if (!isMounted) return

        // Récupérer les produits similaires (par marque OU catégorie, puis score par notes)
        const brandFilter = data.brand ? `brand.eq.${data.brand},` : ''
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .or(`${brandFilter}category.eq.${data.category}`)
          .neq('id', data.id)
          .eq('is_active', true)
          .limit(20)

        if (!isMounted) return

        if (relatedData) {
          // Construire un ensemble des notes du produit courant pour comparaison rapide
          const currentNotes = new Set([
            ...(data.notes_top || []),
            ...(data.notes_heart || []),
            ...(data.notes_base || []),
            ...(data.main_accords?.map((a: { name: string }) => a.name) || []),
          ].map((n: string) => n.toLowerCase()))

          // Scorer chaque candidat
          const scored = (relatedData as SupabaseProductRow[]).map((p) => {
            let score = 0
            if (p.brand && p.brand === data.brand) score += 5
            if (p.category === data.category) score += 1
            const candidateNotes = [
              ...(p.notes_top || []),
              ...(p.notes_heart || []),
              ...(p.notes_base || []),
              ...(p.main_accords?.map((a) => typeof a === 'string' ? a : (a as { name: string }).name) || []),
            ].map((n: string) => n.toLowerCase())
            for (const note of candidateNotes) {
              if (currentNotes.has(note)) score += 2
            }
            return { p, score }
          })
          scored.sort((a, b) => b.score - a.score)
          const topRelated = scored.slice(0, 4).map(({ p }) => p)

          const mappedRelated: Product[] = (topRelated as SupabaseProductRow[]).map((p) => {
            const relatedPriceBySize = typeof p.price_by_size === 'string'
              ? JSON.parse(p.price_by_size)
              : (p.price_by_size || {})
            const prices = Object.values(relatedPriceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
            const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price

            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description || '',
              shortDescription: p.short_description || '',
              price: displayPrice,
              originalPrice: p.original_price,
              priceBySize: relatedPriceBySize,
              images: p.images || [],
              size: p.sizes || [],
              category: p.category || 'unisexe',
              collection: p.collection ?? undefined,
              brand: p.brand || '',
              notes: {
                top: p.notes_top || [],
                heart: p.notes_heart || [],
                base: p.notes_base || []
              },
              stock: p.stock ?? 1,
              inStock: (p.stock || 0) > 0,
              new: p.is_new ?? false,
              bestseller: p.is_bestseller ?? false,
              featured: p.is_bestseller ?? false
            }
          })
          setRelatedProducts(mappedRelated)
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
      fetchProduct()
    }

    return () => {
      isMounted = false
    }
  }, [slug])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const applePaySession = (window as Window & {
      ApplePaySession?: { canMakePayments?: () => boolean }
    }).ApplePaySession

    setCanUseApplePay(Boolean(applePaySession?.canMakePayments?.()))
  }, [])

  // Gestion clavier lightbox
  useEffect(() => {
    if (!isLightboxOpen || !product) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      if (e.key === 'ArrowRight') setSelectedImage((i) => (i + 1) % product.images.length)
      if (e.key === 'ArrowLeft') setSelectedImage((i) => (i - 1 + product.images.length) % product.images.length)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLightboxOpen, product])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Produit non trouvé</h1>
          <Link href="/parfums" className="text-primary hover:underline">
            Retour aux parfums
          </Link>
        </div>
      </div>
    )
  }

  const inWishlist = isInWishlist(product.id)

  // Vérifier si le produit est en rupture globale (stock = 0)
  // Si stock global est à 0, c'est une rupture même si unlimited_stock est activé
  const isGloballyOutOfStock = globalStock === 0

  const handleAddToCart = () => {
    if (isGloballyOutOfStock) return
    addItem(product, selectedSize, quantity)
    openCart()
  }

  const handleExpressCheckout = () => {
    if (isGloballyOutOfStock) return
    addItem(product, selectedSize, quantity)
    router.push('/checkout')
  }

  // Price based on size from database
  const getSizePrice = (size: string) => {
    // Utiliser le prix par taille s'il existe
    if (priceBySize[size] !== undefined && priceBySize[size] > 0) {
      return priceBySize[size]
    }
    // Fallback sur le prix de base si pas de prix par taille
    return product.price
  }

  const currentPrice = getSizePrice(selectedSize)
  const sprayEstimates: Record<string, string> = {
    '2ml': '≈ 40 sprays',
    '5ml': '≈ 90 sprays',
    '10ml': '≈ 180 sprays',
  }
  const preferredSizeOrder = ['2ml', '5ml', '10ml']
  const orderedSizes = [...product.size].sort((a, b) => {
    const aIndex = preferredSizeOrder.indexOf(a.toLowerCase())
    const bIndex = preferredSizeOrder.indexOf(b.toLowerCase())

    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
  const selectedSprays = sprayEstimates[selectedSize.toLowerCase()]

  return (
    <div className="min-h-screen pt-28 pb-28 lg:pb-0">
      {/* Breadcrumb */}
      <div className="px-6 sm:px-10 lg:px-20 py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link href="/parfums" className="hover:text-primary">Parfums</Link>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-foreground truncate">{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="px-6 sm:px-10 lg:px-20 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main image */}
            <div
              className="relative aspect-square bg-cream mb-4 overflow-hidden cursor-zoom-in group"
              onClick={() => setIsLightboxOpen(true)}
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute top-3 right-3 p-2 bg-background/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isGloballyOutOfStock && (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs tracking-[0.15em] uppercase">
                    Rupture de stock
                  </span>
                )}
                {product.new && !isGloballyOutOfStock && (
                  <span className="px-3 py-1 bg-primary text-white text-xs tracking-[0.15em] uppercase">
                    Nouveau
                  </span>
                )}
                {product.bestseller && !isGloballyOutOfStock && (
                  <span className="px-3 py-1 bg-foreground text-background text-xs tracking-[0.15em] uppercase">
                    Best-seller
                  </span>
                )}
              </div>

              {/* Overlay rupture de stock */}
              {isGloballyOutOfStock && (
                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 bg-cream overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-[#C9A962]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </m.div>

          {/* Product Info */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Collection */}
            {product.collection && (
              <p className="text-sm tracking-[0.2em] uppercase text-primary mb-2">
                {product.collection}
              </p>
            )}

            {/* Name */}
            <h1 className="text-4xl lg:text-5xl font-light tracking-[0.1em] mb-4">
              {product.name}
            </h1>

            {/* Reviews */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center gap-1 text-primary" aria-label="Note moyenne 4,8 sur 5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-medium">4,8/5</span>
              <span className="text-sm text-muted-foreground">128 avis clients</span>
            </div>

            {/* Short description */}
            <p className="text-muted-foreground mb-6">{product.shortDescription}</p>

            {/* Price */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-light">{currentPrice.toLocaleString('fr-FR')} €</span>
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground/60 line-through">
                  {getSizePrice(selectedSize) * (product.originalPrice / product.price)} €
                </span>
              )}
            </div>

            {/* Size selector */}
            <div className="mb-8">
              <p className="text-sm tracking-[0.15em] uppercase mb-3">Contenance</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {orderedSizes.map((size) => {
                  const sizeStock = stockBySize[size] ?? 0
                  const sprays = sprayEstimates[size.toLowerCase()]
                  // Une taille est en rupture si le stock global est à 0 (peu importe unlimited_stock) OU si le stock de cette taille est à 0
                  const isSizeOutOfStock = isGloballyOutOfStock || (!unlimitedStock && sizeStock === 0)
                  return (
                    <button
                      key={size}
                      onClick={() => !isSizeOutOfStock && setSelectedSize(size)}
                      disabled={isSizeOutOfStock}
                      className={`group relative min-h-32 overflow-hidden border p-4 text-left transition-all duration-300 sm:min-h-40 ${
                        isSizeOutOfStock
                          ? 'border-border bg-muted/60 text-muted-foreground/60 cursor-not-allowed'
                          : selectedSize === size
                          ? 'border-primary bg-primary/[0.06] shadow-[0_18px_45px_rgba(201,169,98,0.16)]'
                          : 'border-border bg-background hover:border-primary/60 hover:shadow-[0_14px_36px_rgba(0,0,0,0.06)]'
                      }`}
                    >
                      {selectedSize === size && !isSizeOutOfStock && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span className="block text-lg font-medium tracking-[0.08em] uppercase text-foreground">
                        {size}
                      </span>
                      <span className="mt-3 block text-2xl font-light text-foreground">
                        {getSizePrice(size).toLocaleString('fr-FR')} €
                      </span>
                      {sprays && (
                        <span className="mt-3 block text-sm text-muted-foreground">
                          {sprays}
                        </span>
                      )}
                      <span className={`mt-4 inline-flex border px-2 py-1 text-[11px] uppercase tracking-[0.12em] ${
                        isSizeOutOfStock
                          ? 'border-red-200 text-red-500 font-medium'
                          : sizeStock <= 5 && !unlimitedStock
                          ? 'border-orange-200 text-orange-500'
                          : 'border-primary/20 text-muted-foreground'
                      }`}>
                        {isSizeOutOfStock ? 'Rupture' : unlimitedStock ? 'En stock' : sizeStock <= 5 ? `Plus que ${sizeStock}` : `${sizeStock} en stock`}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selectedSprays && (
                <p className="text-xs text-muted-foreground mt-3">
                  Estimation basée sur une vaporisation standard : {selectedSize} {selectedSprays}.
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-sm tracking-[0.15em] uppercase mb-3">Quantité</p>
              <div className="flex items-center border border-border w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-cream transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-cream transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Alerte retour en stock */}
            {isGloballyOutOfStock && (
              <div className="mb-6">
                <StockAlertForm productId={product.id} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mb-4">
              {isGloballyOutOfStock ? (
                <div className="flex-1 py-4 bg-muted text-muted-foreground text-sm tracking-[0.15em] uppercase text-center cursor-not-allowed">
                  Produit indisponible
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="btn-luxury flex-1 border border-primary bg-primary px-6 py-5 text-sm font-medium uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(201,169,98,0.28)] transition-all hover:bg-foreground hover:shadow-[0_22px_48px_rgba(0,0,0,0.18)]"
                >
                  Ajouter au panier
                </button>
              )}
              <button
                onClick={() => toggleItem(product.id)}
                className={`p-4 border transition-colors ${
                  inWishlist
                    ? 'border-primary bg-primary text-white'
                    : 'border-border hover:border-foreground'
                }`}
                title="Ajouter aux favoris"
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className={`p-4 border transition-colors ${
                  copied
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-border hover:border-foreground'
                }`}
                title="Partager"
              >
                {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </button>
            </div>

            {!isGloballyOutOfStock && canUseApplePay && (
              <button
                onClick={handleExpressCheckout}
                className="mb-8 flex w-full items-center justify-center gap-2 py-4 bg-black text-white text-sm font-medium tracking-[0.12em] uppercase hover:bg-foreground transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Acheter avec Apple Pay
              </button>
            )}

            {!isGloballyOutOfStock && !canUseApplePay && (
              <button
                onClick={handleExpressCheckout}
                className="mb-8 flex w-full items-center justify-center gap-2 py-4 border border-foreground text-sm font-medium tracking-[0.12em] uppercase hover:bg-foreground hover:text-background transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Paiement express au checkout
              </button>
            )}

            {/* Message de copie */}
            {copied && (
              <p className="text-sm text-green-600 mt-2">Lien copié !</p>
            )}

            {/* Délai d'expédition */}
            {!isGloballyOutOfStock && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Truck className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  Expédié sous <strong className="text-foreground">24–48h</strong> · Livraison offerte dès{' '}
                  <strong className="text-foreground">{settings.freeShippingThreshold || 150} €</strong>
                </span>
              </div>
            )}

            {/* Trust block */}
            <div className="mb-8">
              <TrustBadges />
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-lg tracking-[0.15em] uppercase mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Accords + Pyramide côte à côte */}
            {((product.accords?.length ?? 0) > 0 || product.notes.top.length > 0 || product.notes.heart.length > 0 || product.notes.base.length > 0 || product.pyramidImage) && (
              <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-2">

                {/* Accords olfactifs */}
                {product.accords && product.accords.length > 0 && (
                  <ScentAccords accords={product.accords} />
                )}

                {/* Pyramide olfactive */}
                {(product.pyramidImage || product.notes.top.length > 0 || product.notes.heart.length > 0 || product.notes.base.length > 0) && (
                  <div>
                    <h2 className="text-lg tracking-[0.15em] uppercase mb-5">Pyramide olfactive</h2>
                    {product.pyramidImage ? (
                      <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0906' }}>
                        <Image
                          src={product.pyramidImage}
                          alt={`Pyramide olfactive — ${product.name}`}
                          width={800}
                          height={600}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    ) : (
                      <OlfactivePyramid notes={product.notes} noteImages={product.noteImages} />
                    )}
                  </div>
                )}
              </div>
            )}
          </m.div>
        </div>
      </section>

      {/* Mobile sticky add to cart */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedSize}{selectedSprays ? ` • ${selectedSprays}` : ''}
              </p>
            </div>
            <p className="shrink-0 text-lg font-medium">{currentPrice.toLocaleString('fr-FR')} €</p>
          </div>
          {isGloballyOutOfStock ? (
            <div className="w-full py-4 bg-muted text-muted-foreground text-center text-sm tracking-[0.15em] uppercase">
              Produit indisponible
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full border border-primary bg-primary py-4 text-sm font-medium uppercase tracking-[0.18em] text-white shadow-[0_14px_34px_rgba(201,169,98,0.26)] transition-colors hover:bg-foreground"
            >
              Ajouter au panier
            </button>
          )}
        </div>
      </div>

      {/* Reviews */}
      <ReviewSection productId={product.id} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 lg:py-24 bg-cream">
          <div className="px-6 sm:px-10 lg:px-20">
            <h2 className="text-2xl sm:text-3xl font-light tracking-[0.15em] uppercase text-center mb-12">
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && product && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 p-3 text-white/70 hover:text-white transition-colors"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Fermer"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Previous */}
            {product.images.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i - 1 + product.images.length) % product.images.length) }}
                aria-label="Image précédente"
              >
                <ChevronRight className="w-8 h-8 rotate-180" />
              </button>
            )}

            {/* Image */}
            <m.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl aspect-square mx-16"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </m.div>

            {/* Next */}
            {product.images.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i + 1) % product.images.length) }}
                aria-label="Image suivante"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Dots */}
            {product.images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(i) }}
                    className={`w-2 h-2 rounded-full transition-colors ${i === selectedImage ? 'bg-primary' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
