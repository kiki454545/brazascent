'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

// Obtenir le prix d'un article selon sa taille
const getItemPrice = (item: { product: { price: number; priceBySize?: Record<string, number> }; selectedSize: string }) => {
  const priceBySize = item.product.priceBySize
  if (priceBySize && priceBySize[item.selectedSize] > 0) {
    return priceBySize[item.selectedSize]
  }
  return item.product.price
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotal } = useCartStore()

  const total = getTotal()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[80] bg-white flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg tracking-[0.2em] uppercase">
                Votre panier ({items.length})
              </h2>
              <button onClick={closeCart} className="p-2 hover:text-[#C9A962] transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg mb-2">Votre panier est vide</p>
                  <p className="text-sm text-gray-500 mb-6">
                    Découvrez nos parfums et trouvez votre fragrance idéale
                  </p>
                  <button
                    onClick={closeCart}
                    className="px-8 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedSize}`}
                      className="flex gap-4"
                    >
                      {/* Image */}
                      <div className="relative w-24 h-24 bg-[#F9F6F1] flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">{item.selectedSize}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id, item.selectedSize)}
                            className="p-1 text-gray-400 hover:text-[#19110B] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity */}
                          <div className="flex items-center border border-gray-200">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.selectedSize,
                                  item.quantity - 1
                                )
                              }
                              className="p-2 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.selectedSize,
                                  item.quantity + 1
                                )
                              }
                              className="p-2 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <p className="font-medium">
                            {(getItemPrice(item) * item.quantity).toLocaleString('fr-FR')} €
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-sm tracking-[0.1em] uppercase">Sous-total</span>
                  <span className="font-medium">{total.toLocaleString('fr-FR')} €</span>
                </div>

                <p className="text-xs text-gray-500">
                  Frais de livraison calculés à l&apos;étape suivante
                </p>

                {/* Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/panier"
                    onClick={closeCart}
                    className="block w-full py-3 text-center border border-[#19110B] text-sm tracking-[0.15em] uppercase hover:bg-[#19110B] hover:text-white transition-colors"
                  >
                    Voir le panier
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-luxury block w-full py-3 text-center bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    Passer commande
                  </Link>
                </div>

                {/* Payment icons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="text-xs text-gray-400">Paiement sécurisé</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
