'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Gift, Shield } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { CartItem } from '@/types'

// Obtenir le prix d'un article selon sa taille
const getItemPrice = (item: CartItem) => {
  const priceBySize = item.product.priceBySize
  if (priceBySize && priceBySize[item.selectedSize] > 0) {
    return priceBySize[item.selectedSize]
  }
  return item.product.price
}

export default function PanierPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()

  const subtotal = getTotal()
  const shipping = subtotal >= 150 ? 0 : 9.90
  const total = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-4">
              Votre panier est vide
            </h1>
            <p className="text-gray-500 mb-8">
              Découvrez nos collections et trouvez la fragrance qui vous correspond
            </p>
            <Link
              href="/collections"
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
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light tracking-[0.15em] uppercase text-center mb-12"
        >
          Votre Panier
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="border-b pb-4 mb-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {items.length} article{items.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-[#C9A962] transition-colors"
              >
                Vider le panier
              </button>
            </div>

            <div className="space-y-8">
              {items.map((item, index) => (
                <motion.div
                  key={`${item.product.id}-${item.selectedSize}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6"
                >
                  {/* Image */}
                  <Link
                    href={`/parfum/${item.product.slug}`}
                    className="relative w-32 h-32 bg-[#F9F6F1] flex-shrink-0"
                  >
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/parfum/${item.product.slug}`}
                          className="text-lg font-medium hover:text-[#C9A962] transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500">{item.selectedSize}</p>
                        {item.product.collection && (
                          <p className="text-xs text-[#C9A962] mt-1">{item.product.collection}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedSize)}
                        className="p-2 text-gray-400 hover:text-[#19110B] transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center border border-gray-300">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <p className="text-lg font-medium">
                        {(getItemPrice(item) * item.quantity).toLocaleString('fr-FR')} €
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#F9F6F1] p-8"
            >
              <h2 className="text-lg tracking-[0.15em] uppercase mb-6">Récapitulatif</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{subtotal.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Offerte</span>
                    ) : (
                      `${shipping.toLocaleString('fr-FR')} €`
                    )}
                  </span>
                </div>

                {subtotal < 150 && (
                  <p className="text-sm text-gray-500">
                    Plus que {(150 - subtotal).toLocaleString('fr-FR')} € pour la livraison offerte
                  </p>
                )}
              </div>

              <div className="border-t pt-4 mb-8">
                <div className="flex items-center justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{total.toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn-luxury block w-full py-4 text-center bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors mb-4"
              >
                Passer commande
              </Link>

              <Link
                href="/collections"
                className="block w-full py-3 text-center border border-[#19110B] text-sm tracking-[0.15em] uppercase hover:bg-[#19110B] hover:text-white transition-colors"
              >
                Continuer mes achats
              </Link>

              {/* Benefits */}
              <div className="mt-8 pt-8 border-t space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-[#C9A962]" />
                  <span>Livraison offerte dès 150€</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Gift className="w-5 h-5 text-[#C9A962]" />
                  <span>Emballage cadeau offert</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-[#C9A962]" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
