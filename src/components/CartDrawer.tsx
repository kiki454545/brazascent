'use client'

import { useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'

// Vérifier si un produit est en rupture (stock = 0 exactement)
const isProductOutOfStock = (product: { stock?: number }) => {
  return product.stock !== undefined && product.stock === 0
}

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

  // Bloquer le scroll du body quand le panier est ouvert
  useEffect(() => {
    if (!isOpen) return
    const scrollY = window.scrollY
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight
    // Compenser la largeur de la scrollbar pour éviter un saut de layout
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  // Vérifier s'il y a des produits en rupture dans le panier
  const outOfStockItems = items.filter(item => isProductOutOfStock(item.product))
  const hasOutOfStockItems = outOfStockItems.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[80] bg-background text-foreground flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-sans text-lg tracking-[0.2em] uppercase">
                Votre panier ({items.length})
              </h2>
              <button onClick={closeCart} className="p-2 hover:text-primary transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg mb-2">Votre panier est vide</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Découvrez nos parfums et trouvez votre fragrance idéale
                  </p>
                  <button
                    onClick={closeCart}
                    className="px-8 py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Alerte produits en rupture */}
                  {hasOutOfStockItems && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          {outOfStockItems.length === 1 ? 'Un produit est' : `${outOfStockItems.length} produits sont`} en rupture de stock
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Veuillez retirer les produits indisponibles pour continuer votre commande.
                        </p>
                      </div>
                    </div>
                  )}

                  {items.map((item) => {
                    const itemOutOfStock = isProductOutOfStock(item.product)
                    return (
                      <div
                        key={`${item.product.id}-${item.selectedSize}`}
                        className={`flex gap-4 ${itemOutOfStock ? 'opacity-60' : ''}`}
                      >
                        {/* Image */}
                        <div className="relative w-24 h-24 bg-cream flex-shrink-0">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                          {itemOutOfStock && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="bg-red-600 text-white text-xs px-2 py-1 uppercase tracking-wider">
                                Rupture
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{item.product.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.selectedSize}</p>
                              {itemOutOfStock && (
                                <p className="text-xs text-red-600 mt-1">Produit indisponible</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id, item.selectedSize)}
                              className={`p-1 transition-colors ${
                                itemOutOfStock
                                  ? 'text-red-500 hover:text-red-700'
                                  : 'text-muted-foreground/60 hover:text-foreground'
                              }`}
                              title={itemOutOfStock ? 'Retirer du panier' : 'Supprimer'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {!itemOutOfStock && (
                            <div className="mt-3 flex items-center justify-between">
                              {/* Quantity */}
                              <div className="flex items-center border border-border">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.product.id,
                                      item.selectedSize,
                                      item.quantity - 1
                                    )
                                  }
                                  className="p-2 hover:bg-muted transition-colors"
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
                                  className="p-2 hover:bg-muted transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <p className="font-medium">
                                {(getItemPrice(item) * item.quantity).toLocaleString('fr-FR')} €
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
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

                <p className="text-xs text-muted-foreground">
                  Frais de livraison calculés à l&apos;étape suivante
                </p>

                {/* Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/panier"
                    onClick={closeCart}
                    className="block w-full py-3 text-center border border-foreground text-sm tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"
                  >
                    Voir le panier
                  </Link>
                  {hasOutOfStockItems ? (
                    <div className="block w-full py-3 text-center bg-muted text-muted-foreground text-sm tracking-[0.15em] uppercase cursor-not-allowed">
                      Retirez les produits indisponibles
                    </div>
                  ) : (
                    <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="btn-luxury block w-full py-3 text-center bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
                    >
                      Passer commande
                    </Link>
                  )}
                </div>

                {/* Payment icons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground">Paiement sécurisé</span>
                </div>
              </div>
            )}
          </m.div>
        </>
      )}
    </AnimatePresence>
  )
}
