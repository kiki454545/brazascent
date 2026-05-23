'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Gift, Shield, AlertTriangle, Tag, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useSettingsStore } from '@/store/settings'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { CartItem } from '@/types'
import { FreeShippingBar } from '@/components/FreeShippingBar'

// Obtenir le prix d'un article selon sa taille
const getItemPrice = (item: CartItem) => {
  const priceBySize = item.product.priceBySize
  if (priceBySize && priceBySize[item.selectedSize] > 0) {
    return priceBySize[item.selectedSize]
  }
  return item.product.price
}

// Vérifier si un produit est en rupture (stock = 0 exactement)
const isProductOutOfStock = (product: { stock?: number }) => {
  return product.stock !== undefined && product.stock === 0
}

export default function PanierPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart, pendingPromoCode, setPendingPromo } = useCartStore()
  const { settings } = useSettingsStore()
  const { user } = useAuthStore()

  const [promoInput, setPromoInput] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoRequiresLogin, setPromoRequiresLogin] = useState(false)
  const [validatingPromo, setValidatingPromo] = useState(false)

  const subtotal = getTotal()
  const freeThreshold = settings.freeShippingThreshold || 150
  const standardPrice = settings.standardShippingPrice || 9.90
  const shipping = subtotal >= freeThreshold ? 0 : standardPrice

  // Calculer la réduction depuis le code stocké
  const promoDiscount = pendingPromoCode
    ? pendingPromoCode.discount_type === 'percentage'
      ? Math.round((subtotal * pendingPromoCode.discount_value) / 100 * 100) / 100
      : Math.min(pendingPromoCode.discount_value, subtotal)
    : 0

  const total = subtotal + shipping - promoDiscount

  // Vérifier s'il y a des produits en rupture dans le panier
  const outOfStockItems = items.filter(item => isProductOutOfStock(item.product))
  const hasOutOfStockItems = outOfStockItems.length > 0

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setValidatingPromo(true)
    setPromoError(null)
    setPromoRequiresLogin(false)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: promoInput.trim(), orderTotal: subtotal, productIds: items.map(i => i.product.id) }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.requiresLogin) setPromoRequiresLogin(true)
        else setPromoError(data.error || 'Code invalide')
        return
      }

      setPendingPromo(data.promoCode)
      setPromoInput('')
    } catch {
      setPromoError('Erreur de connexion')
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setPendingPromo(null)
    setPromoError(null)
    setPromoRequiresLogin(false)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShoppingBag className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
            <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-4">
              Votre panier est vide
            </h1>
            <p className="text-muted-foreground mb-8">
              Découvrez nos parfums et trouvez la fragrance qui vous correspond
            </p>
            <Link
              href="/parfums"
              className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
            >
              Découvrir nos parfums
              <ArrowRight className="w-4 h-4" />
            </Link>
          </m.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <m.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-light tracking-[0.15em] uppercase text-center mb-12"
        >
          Votre Panier
        </m.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="border-b pb-4 mb-6 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {items.length} article{items.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  if (window.confirm('Vider le panier ? Cette action est irréversible.')) {
                    clearCart()
                  }
                }}
                className="text-sm text-muted-foreground hover:text-red-600 transition-colors"
              >
                Vider le panier
              </button>
            </div>

            {/* Alerte produits en rupture */}
            {hasOutOfStockItems && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-300">
                    {outOfStockItems.length === 1 ? 'Un produit est' : `${outOfStockItems.length} produits sont`} en rupture de stock
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Veuillez retirer les produits indisponibles pour continuer votre commande.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {items.map((item, index) => {
                const itemOutOfStock = isProductOutOfStock(item.product)
                return (
                  <m.div
                    key={`${item.product.id}-${item.selectedSize}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex gap-6 ${itemOutOfStock ? 'opacity-60' : ''}`}
                  >
                    {/* Image */}
                    <Link
                      href={`/parfum/${item.product.slug}`}
                      className="relative w-32 h-32 bg-cream flex-shrink-0"
                    >
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                      {itemOutOfStock && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="bg-red-600 text-white text-xs px-2 py-1 uppercase tracking-wider">
                            Rupture
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/parfum/${item.product.slug}`}
                            className="text-lg font-medium hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{item.selectedSize}</p>
                          {item.product.collection && (
                            <p className="text-xs text-primary mt-1">{item.product.collection}</p>
                          )}
                          {itemOutOfStock && (
                            <p className="text-sm text-red-600 mt-1 font-medium">Produit indisponible</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize)}
                          className={`p-2 transition-colors ${
                            itemOutOfStock
                              ? 'text-red-500 hover:text-red-700'
                              : 'text-muted-foreground/60 hover:text-foreground'
                          }`}
                          title={itemOutOfStock ? 'Retirer du panier' : 'Supprimer'}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {!itemOutOfStock && (
                        <div className="mt-4 flex items-center justify-between">
                          {/* Quantity */}
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)
                              }
                              className="p-2 hover:bg-muted transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center">{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)
                              }
                              className="p-2 hover:bg-muted transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Price */}
                          <p className="text-lg font-medium">
                            {(getItemPrice(item) * item.quantity).toLocaleString('fr-FR')} €
                          </p>
                        </div>
                      )}
                    </div>
                  </m.div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-cream p-8"
            >
              <h2 className="text-lg tracking-[0.15em] uppercase mb-6">Récapitulatif</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Offerte</span>
                    ) : (
                      `${shipping.toLocaleString('fr-FR')} €`
                    )}
                  </span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Réduction ({pendingPromoCode!.code})</span>
                    <span>−{promoDiscount.toLocaleString('fr-FR')} €</span>
                  </div>
                )}

                <FreeShippingBar total={subtotal} />
              </div>

              {/* Code promo */}
              <div className="border-t pt-4 mb-6">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Code promo
                </p>
                {pendingPromoCode ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                    <div>
                      <p className="font-mono font-semibold text-green-700 dark:text-green-400 text-sm">{pendingPromoCode.code}</p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        {pendingPromoCode.discount_type === 'percentage'
                          ? `−${pendingPromoCode.discount_value}%`
                          : `−${pendingPromoCode.discount_value} €`}
                      </p>
                    </div>
                    <button onClick={handleRemovePromo} className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors">
                      <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); setPromoRequiresLogin(false) }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                        placeholder="Entrer le code"
                        className="flex-1 px-3 py-2 border border-border text-sm focus:border-primary focus:outline-none uppercase"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={validatingPromo || !promoInput.trim()}
                        className="px-4 py-2 bg-foreground text-background text-sm hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Appliquer'}
                      </button>
                    </div>
                    {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                    {promoRequiresLogin && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm space-y-1">
                        <p className="text-amber-800 dark:text-amber-300 font-medium">Ce code est réservé aux comptes connectés.</p>
                        <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                          <Link href="/compte?redirect=/panier" className="underline hover:text-amber-900 dark:hover:text-amber-200">Se connecter</Link>
                          <span>·</span>
                          <Link href="/compte?tab=register&redirect=/panier" className="underline hover:text-amber-900 dark:hover:text-amber-200">Créer un compte</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mb-8">
                <div className="flex items-center justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>{total.toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              {hasOutOfStockItems ? (
                <div className="block w-full py-4 text-center bg-muted text-muted-foreground text-sm tracking-[0.15em] uppercase cursor-not-allowed mb-4">
                  Retirez les produits indisponibles
                </div>
              ) : (
                <Link
                  href="/checkout"
                  className="btn-luxury block w-full py-4 text-center bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors mb-4"
                >
                  Passer commande
                </Link>
              )}

              <Link
                href="/parfums"
                className="block w-full py-3 text-center border border-foreground text-sm tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"
              >
                Continuer mes achats
              </Link>

              {/* Benefits */}
              <div className="mt-8 pt-8 border-t space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="w-5 h-5 text-primary" />
                  <span>Livraison offerte dès {freeThreshold}€</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Gift className="w-5 h-5 text-primary" />
                  <span>Emballage cadeau offert</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </div>
  )
}
