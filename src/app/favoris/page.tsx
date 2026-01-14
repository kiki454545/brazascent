'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { products } from '@/data/products'
import { Product } from '@/types'

export default function FavorisPage() {
  const { items: wishlistIds, removeItem, clearWishlist } = useWishlistStore()
  const { addItem, openCart } = useCartStore()
  const { user } = useAuthStore()

  // Récupérer les produits complets à partir des IDs
  const wishlistProducts = wishlistIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined)

  const handleAddToCart = (product: Product) => {
    addItem(product, product.size[0])
    openCart()
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-4">
              Votre liste de favoris est vide
            </h1>
            <p className="text-gray-500 mb-8">
              Explorez nos collections et ajoutez vos parfums préférés à votre liste
            </p>
            <Link
              href="/parfums"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
            >
              Découvrir nos parfums
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-light tracking-[0.15em] uppercase mb-4">
              Mes Favoris
            </h1>
            <p className="text-gray-500">
              {wishlistProducts.length} parfum{wishlistProducts.length > 1 ? 's' : ''} dans votre liste
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end mb-8">
            <button
              onClick={clearWishlist}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Vider la liste
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wishlistProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] bg-[#F9F6F1] mb-4 overflow-hidden">
                  <Link href={`/parfum/${product.slug}`}>
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>

                  {/* Tags */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.new && (
                      <span className="px-3 py-1 bg-[#C9A962] text-white text-xs tracking-wider uppercase">
                        Nouveau
                      </span>
                    )}
                    {product.bestseller && (
                      <span className="px-3 py-1 bg-[#19110B] text-white text-xs tracking-wider uppercase">
                        Bestseller
                      </span>
                    )}
                  </div>

                  {/* Add to cart button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="absolute bottom-4 left-4 right-4 py-3 bg-white text-sm tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#19110B] hover:text-white"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Ajouter au panier
                    </span>
                  </button>
                </div>

                {/* Info */}
                <Link href={`/parfum/${product.slug}`}>
                  <p className="text-xs text-[#C9A962] tracking-[0.2em] uppercase mb-1">
                    {product.brand}
                  </p>
                  <h3 className="text-lg font-light tracking-[0.1em] uppercase mb-2 group-hover:text-[#C9A962] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-lg">{product.price} €</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Info message */}
          {!user && (
            <div className="mt-12 p-6 bg-[#F9F6F1] text-center">
              <p className="text-sm text-gray-600 mb-4">
                Connectez-vous pour sauvegarder vos favoris et les retrouver sur tous vos appareils
              </p>
              <Link
                href="/compte"
                className="inline-flex items-center gap-2 text-sm text-[#C9A962] hover:underline"
              >
                Se connecter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
