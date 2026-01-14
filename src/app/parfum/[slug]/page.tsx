'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Minus, Plus, ChevronRight, Truck, RotateCcw, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { ProductCard } from '@/components/ProductCard'

export default function ProductPage() {
  const params = useParams()
  const slug = params.slug as string

  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({})
  const [priceBySize, setPriceBySize] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  const { addItem, openCart } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Récupérer le produit par slug
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error || !data) {
          console.error('Error fetching product:', error)
          setLoading(false)
          return
        }

        // Mapper vers le format Product
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          shortDescription: data.short_description || '',
          price: data.price,
          originalPrice: data.original_price,
          images: data.images || [],
          size: data.sizes || [],
          category: data.category || 'unisexe',
          collection: data.collection,
          notes: {
            top: data.notes_top || [],
            heart: data.notes_heart || [],
            base: data.notes_base || []
          },
          inStock: (data.stock || 0) > 0,
          new: data.is_new,
          bestseller: data.is_bestseller,
          featured: data.is_bestseller
        }

        setProduct(mappedProduct)
        setStockBySize(data.stock_by_size || {})
        setPriceBySize(data.price_by_size || {})
        setSelectedSize(mappedProduct.size[1] || mappedProduct.size[0] || '')

        // Récupérer les produits similaires
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(4)

        if (relatedData) {
          const mappedRelated: Product[] = relatedData.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            shortDescription: p.short_description || '',
            price: p.price,
            originalPrice: p.original_price,
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
          }))
          setRelatedProducts(mappedRelated)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Produit non trouvé</h1>
          <Link href="/collections" className="text-[#C9A962] hover:underline">
            Retour aux collections
          </Link>
        </div>
      </div>
    )
  }

  const inWishlist = isInWishlist(product.id)

  const handleAddToCart = () => {
    addItem(product, selectedSize, quantity)
    openCart()
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

  return (
    <div className="min-h-screen pt-28">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#C9A962]">Accueil</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/collections" className="hover:text-[#C9A962]">Collections</Link>
          <ChevronRight className="w-4 h-4" />
          {product.collection && (
            <>
              <Link href={`/collections/${product.collection.toLowerCase()}`} className="hover:text-[#C9A962]">
                {product.collection}
              </Link>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <span className="text-[#19110B]">{product.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main image */}
            <div className="relative aspect-square bg-[#F9F6F1] mb-4 overflow-hidden">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.new && (
                  <span className="px-3 py-1 bg-[#C9A962] text-white text-xs tracking-[0.15em] uppercase">
                    Nouveau
                  </span>
                )}
                {product.bestseller && (
                  <span className="px-3 py-1 bg-[#19110B] text-white text-xs tracking-[0.15em] uppercase">
                    Best-seller
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 bg-[#F9F6F1] overflow-hidden transition-all ${
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
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Collection */}
            {product.collection && (
              <p className="text-sm tracking-[0.2em] uppercase text-[#C9A962] mb-2">
                {product.collection}
              </p>
            )}

            {/* Name */}
            <h1 className="text-4xl lg:text-5xl font-light tracking-[0.1em] mb-4">
              {product.name}
            </h1>

            {/* Short description */}
            <p className="text-gray-600 mb-6">{product.shortDescription}</p>

            {/* Price */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-light">{currentPrice.toLocaleString('fr-FR')} €</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {getSizePrice(selectedSize) * (product.originalPrice / product.price)} €
                </span>
              )}
            </div>

            {/* Size selector */}
            <div className="mb-8">
              <p className="text-sm tracking-[0.15em] uppercase mb-3">Contenance</p>
              <div className="flex flex-wrap gap-3">
                {product.size.map((size) => {
                  const sizeStock = stockBySize[size] ?? 0
                  const isOutOfStock = sizeStock === 0
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`px-6 py-3 border text-sm tracking-wider transition-all relative ${
                        isOutOfStock
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : selectedSize === size
                          ? 'border-[#19110B] bg-[#19110B] text-white'
                          : 'border-gray-300 hover:border-[#19110B]'
                      }`}
                    >
                      {size}
                      <span className="block text-xs mt-1 opacity-70">
                        {getSizePrice(size).toLocaleString('fr-FR')} €
                      </span>
                      <span className={`block text-xs mt-1 ${
                        isOutOfStock
                          ? 'text-red-500'
                          : sizeStock <= 5
                          ? selectedSize === size ? 'text-orange-300' : 'text-orange-500'
                          : selectedSize === size ? 'text-green-300' : 'text-green-600'
                      }`}>
                        {isOutOfStock ? 'Rupture' : sizeStock <= 5 ? `Plus que ${sizeStock}` : `${sizeStock} en stock`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-sm tracking-[0.15em] uppercase mb-3">Quantité</p>
              <div className="flex items-center border border-gray-300 w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="btn-luxury flex-1 py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
              >
                Ajouter au panier
              </button>
              <button
                onClick={() => toggleItem(product.id)}
                className={`p-4 border transition-colors ${
                  inWishlist
                    ? 'border-[#C9A962] bg-[#C9A962] text-white'
                    : 'border-gray-300 hover:border-[#19110B]'
                }`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Services */}
            <div className="border-t border-b py-6 space-y-4">
              <div className="flex items-center gap-4">
                <Truck className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm">Livraison offerte dès 150€</span>
              </div>
              <div className="flex items-center gap-4">
                <RotateCcw className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm">Retours gratuits sous 30 jours</span>
              </div>
              <div className="flex items-center gap-4">
                <Gift className="w-5 h-5 text-[#C9A962]" />
                <span className="text-sm">Écrin luxueux offert</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-lg tracking-[0.15em] uppercase mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Notes */}
            <div className="mt-8">
              <h2 className="text-lg tracking-[0.15em] uppercase mb-4">Notes Olfactives</h2>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-[#C9A962] uppercase tracking-wider mb-2">Tête</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.notes.top.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-[#C9A962] uppercase tracking-wider mb-2">Cœur</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.notes.heart.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-[#C9A962] uppercase tracking-wider mb-2">Fond</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {product.notes.base.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-24 bg-[#F9F6F1]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <h2 className="text-3xl font-light tracking-[0.15em] uppercase text-center mb-12">
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
    </div>
  )
}
