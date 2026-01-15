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
        <div className="relative aspect-[3/4] bg-[#F9F6F1] overflow-hidden mb-4">
          {/* Main image */}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
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
              className={`object-cover transition-all duration-700 absolute inset-0 ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}

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
            {product.originalPrice && currentPrice < product.originalPrice && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs tracking-[0.15em] uppercase">
                -{Math.round((1 - currentPrice / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
              inWishlist
                ? 'bg-[#C9A962] text-white'
                : 'bg-white/80 text-[#19110B] opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Quick add */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 transition-all duration-300 ${
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
                      ? 'border-[#19110B] bg-[#19110B] text-white'
                      : 'border-gray-300 hover:border-[#19110B]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              className="btn-luxury w-full py-2 bg-[#19110B] text-white text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-[#C9A962] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Ajouter au panier
            </button>
          </div>
        </div>

        {/* Product info */}
        <div className="text-center">
          {product.collection && (
            <p className="text-xs text-gray-500 tracking-[0.15em] uppercase mb-1">
              {product.collection}
            </p>
          )}
          <h3 className="text-lg font-light tracking-wide mb-1 group-hover:text-[#C9A962] transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{product.shortDescription}</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-medium">{currentPrice.toLocaleString('fr-FR')} €</span>
            {product.originalPrice && currentPrice < product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {product.originalPrice.toLocaleString('fr-FR')} €
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
