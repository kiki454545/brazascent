'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import { Product } from '@/types'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [selectedSize, setSelectedSize] = useState(product.size?.[0] || '')
  const [mounted, setMounted] = useState(false)
  const { addItem, openCart } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()

  // Vérifier si le produit est en rupture de stock (stock = 0 exactement)
  const isOutOfStock = product.stock !== undefined && product.stock === 0

  // Calculer le prix selon la taille sélectionnée
  const getSizePrice = (size: string) => {
    // Si priceBySize existe et a un prix pour cette taille
    if (product.priceBySize && size && product.priceBySize[size] !== undefined && product.priceBySize[size] > 0) {
      return product.priceBySize[size]
    }
    // Si pas de taille ou taille invalide mais priceBySize existe, prendre le prix minimum
    if (product.priceBySize && Object.keys(product.priceBySize).length > 0) {
      const prices = Object.values(product.priceBySize).filter(p => p > 0)
      if (prices.length > 0) {
        return Math.min(...prices)
      }
    }
    // Fallback sur le prix de base du produit
    return product.price || 0
  }

  const currentPrice = getSizePrice(selectedSize)

  // Attendre l'hydratation côté client pour éviter le mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Ne vérifier la wishlist qu'après le montage côté client
  const inWishlist = mounted ? isInWishlist(product.id) : false

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(product, selectedSize)
    openCart()
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleItem(product.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        href={`/parfum/${product.slug}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative aspect-[4/5] bg-cream overflow-hidden mb-3">
          {/* Main image */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-all duration-700 ${
              isHovered && product.images[1] ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {/* Hover image */}
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-700 absolute inset-0 ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isOutOfStock && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs tracking-[0.15em] uppercase">
                Rupture
              </span>
            )}
            {product.new && !isOutOfStock && (
              <span className="px-3 py-1 bg-primary text-white text-xs tracking-[0.15em] uppercase">
                Nouveau
              </span>
            )}
            {product.bestseller && !isOutOfStock && (
              <span className="px-3 py-1 bg-foreground text-background text-xs tracking-[0.15em] uppercase">
                Best-seller
              </span>
            )}
            {product.promo && !isOutOfStock && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs tracking-[0.15em] uppercase font-semibold">
                Promo
              </span>
            )}
            {product.originalPrice && currentPrice < product.originalPrice && !isOutOfStock && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs tracking-[0.15em] uppercase">
                -{Math.round((1 - currentPrice / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Overlay rupture de stock */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          )}

          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
              inWishlist
                ? 'bg-primary text-white'
                : 'bg-background/80 text-foreground opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Quick add - Masqué si rupture de stock */}
          {!isOutOfStock && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-background/20 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/10 p-4 transition-all duration-300 ${
                isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
              }`}
            >
              {/* Size selector */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {(product.size || []).map((size) => (
                  <button
                    key={size}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedSize(size)
                    }}
                    className={`px-3 py-1 text-xs border transition-colors ${
                      selectedSize === size
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                className="btn-luxury w-full py-2 bg-foreground text-background text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-primary transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Ajouter au panier
              </button>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="text-center min-w-0">
          {product.collection && (
            <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase mb-1 truncate">
              {product.collection}
            </p>
          )}
          <h3 className="text-lg font-light tracking-wide mb-1 group-hover:text-primary transition-colors truncate">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words">
            {product.shortDescription}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="font-medium">{currentPrice.toLocaleString('fr-FR')} €</span>
            {product.originalPrice && currentPrice < product.originalPrice && (
              <span className="text-sm text-muted-foreground/60 line-through">
                {product.originalPrice.toLocaleString('fr-FR')} €
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
