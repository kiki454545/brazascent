'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import {
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js'

type ShippingRateChangeEvent = {
  shippingRate: { id: string; displayName: string; amount: number }
  resolve: () => void
  reject: () => void
}
import { useCartStore, CartPromoCode } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { CartItem } from '@/types'

interface HomeMethod {
  price: number
  free_threshold: number | null
}

interface InnerProps {
  cartItems: CartItem[]
  promoCode: CartPromoCode | null
  userId: string | undefined
  shippingCost: number
  displayAmountCents: number
}

function ExpressCheckoutInner({ cartItems, promoCode, userId, shippingCost, displayAmountCents }: InnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [hasWallets, setHasWallets] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const shippingCostCents = Math.round(shippingCost * 100)

  const handleReady = useCallback((event: StripeExpressCheckoutElementReadyEvent) => {
    const available = event.availablePaymentMethods
    const walletsAvailable = available != null && Object.values(available).some(Boolean)
    setHasWallets(walletsAvailable)
    setIsReady(true)
  }, [])

  const handleShippingAddressChange = useCallback(
    async (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
      // Mettre à jour le montant total AVANT de résoudre pour que Google Pay/Apple Pay affiche le bon total
      await elements?.update({ amount: displayAmountCents + shippingCostCents })
      event.resolve({
        shippingRates: [
          {
            id: 'home_delivery',
            displayName: shippingCost === 0 ? 'Livraison offerte' : 'Livraison à domicile',
            amount: shippingCostCents,
          },
        ],
      })
    },
    [shippingCost, shippingCostCents, elements, displayAmountCents]
  )

  const handleShippingRateChange = useCallback(
    (event: ShippingRateChangeEvent) => {
      elements?.update({ amount: displayAmountCents + event.shippingRate.amount })
      event.resolve()
    },
    [elements, displayAmountCents]
  )

  const handleConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (!stripe || !elements) return
      setLoading(true)
      setError(null)

      const shippingAmount = event.shippingRate?.amount ?? shippingCostCents
      await elements.update({ amount: displayAmountCents + shippingAmount })

      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message ?? 'Erreur de paiement')
        event.paymentFailed({ reason: 'fail' })
        setLoading(false)
        return
      }

      let clientSecret: string | null = null
      try {
        const res = await fetch('/api/checkout/express', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems.map(item => ({
              id: item.product.id,
              size: item.selectedSize,
              quantity: item.quantity,
            })),
            billingDetails: event.billingDetails,
            shippingAddress: event.shippingAddress,
            selectedShippingRateId: event.shippingRate?.id,
            promoCode: promoCode
              ? { id: promoCode.id, code: promoCode.code, discount: promoCode.discount_value }
              : undefined,
            userId,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data.clientSecret) {
          const msg = data.error || 'Erreur lors de la création du paiement'
          setError(msg)
          event.paymentFailed({ reason: 'fail' })
          setLoading(false)
          return
        }

        clientSecret = data.clientSecret
      } catch {
        setError('Erreur réseau, veuillez réessayer')
        event.paymentFailed({ reason: 'fail' })
        setLoading(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: clientSecret!,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      })

      if (confirmError) {
        setError(confirmError.message ?? 'Paiement refusé')
        event.paymentFailed({ reason: 'fail' })
        setLoading(false)
      }
    },
    [stripe, elements, cartItems, promoCode, userId, shippingCostCents, displayAmountCents]
  )

  return (
    <div className="mb-4">
      <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Paiement express
      </p>

      {loadError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 text-center">{loadError}</p>
      )}

      {/* Skeleton par-dessus le bouton pendant le chargement */}
      <div className="relative" style={{ minHeight: 48 }}>
        {!isReady && !loadError && (
          <div className="absolute inset-0 rounded bg-muted animate-pulse" />
        )}
        <div className="transition-opacity duration-500" style={{ opacity: isReady ? 1 : 0 }}>
          <ExpressCheckoutElement
            onReady={handleReady}
            onLoadError={(e) => { setIsReady(true); setLoadError(`Wallet indisponible : ${e.error?.message ?? 'erreur inconnue'}`) }}
            onConfirm={handleConfirm}
            onShippingAddressChange={handleShippingAddressChange}
            onShippingRateChange={handleShippingRateChange}
            options={{
              buttonHeight: 48,
              buttonType: { applePay: 'buy', googlePay: 'buy' },
              paymentMethods: { applePay: 'auto', googlePay: 'auto', link: 'auto' },
              shippingAddressRequired: true,
              emailRequired: true,
              phoneNumberRequired: true,
              allowedShippingCountries: [
                'FR', 'BE', 'DE', 'ES', 'IT', 'LU', 'NL', 'PT', 'CH',
                'AT', 'PL', 'HU', 'CZ', 'HR', 'SK', 'SI', 'BG', 'RO',
                'SE', 'DK', 'FI', 'NO', 'IE', 'EE', 'LT', 'LV',
              ],
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
      )}

      {hasWallets && (
        <div
          className="transition-opacity duration-500"
          style={{ opacity: isReady ? 1 : 0 }}
        >
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Paiement rapide avec livraison à domicile.
          </p>
          <div className="relative flex items-center my-4">
            <div className="flex-1 border-t border-border" />
            <span className="mx-3 text-xs text-muted-foreground uppercase tracking-widest">ou</span>
            <div className="flex-1 border-t border-border" />
          </div>
        </div>
      )}
    </div>
  )
}

interface ExpressCheckoutBlockProps {
  hasOutOfStockItems?: boolean
  overrideItems?: CartItem[]
}

export function ExpressCheckoutBlock({ hasOutOfStockItems, overrideItems }: ExpressCheckoutBlockProps) {
  const { items: cartItems, getTotal, pendingPromoCode } = useCartStore()
  const { user } = useAuthStore()
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [homeMethod, setHomeMethod] = useState<HomeMethod | null>(null)
  const fetchedRef = useRef(false)

  const activeItems = overrideItems ?? cartItems

  useEffect(() => {
    if (fetchedRef.current || activeItems.length === 0) return
    fetchedRef.current = true

    Promise.all([
      fetch('/api/stripe-config').then(r => r.json()),
      fetch('/api/shipping-methods').then(r => r.json()),
    ]).then(([stripeData, shippingData]) => {
      if (stripeData.publishableKey) setStripePromise(loadStripe(stripeData.publishableKey))

      const methods: Array<{ title: string; price: number; free_threshold: number | null }> =
        shippingData.methods ?? []
      // Prendre la méthode "domicile" (pas point relais, pas express)
      const home =
        methods.find(m => m.title.toLowerCase().includes('domicile')) ??
        methods.find(m => {
          const t = m.title.toLowerCase()
          return !t.includes('relais') && !t.includes('relay') && !t.includes('express') && !t.includes('chrono')
        })
      if (home) setHomeMethod({ price: home.price, free_threshold: home.free_threshold })
    }).catch(() => {})
  }, [activeItems.length])

  if (activeItems.length === 0 || hasOutOfStockItems || !stripePromise || !homeMethod) return null

  const subtotal = overrideItems
    ? overrideItems.reduce((sum, item) => {
        const price = (item.product.priceBySize?.[item.selectedSize] ?? 0) > 0
          ? item.product.priceBySize![item.selectedSize]
          : item.product.price
        return sum + price * item.quantity
      }, 0)
    : getTotal()

  const promoCode = overrideItems ? null : pendingPromoCode

  const isFree = homeMethod.free_threshold !== null && subtotal >= homeMethod.free_threshold
  const shippingCost = isFree ? 0 : homeMethod.price

  const promoDiscount = promoCode
    ? promoCode.discount_type === 'percentage'
      ? Math.round((subtotal * promoCode.discount_value) / 100 * 100) / 100
      : Math.min(promoCode.discount_value, subtotal)
    : 0

  const displayAmountCents = Math.max(50, Math.round((subtotal - promoDiscount) * 100))

  const stripeOptions = {
    mode: 'payment' as const,
    amount: displayAmountCents,
    currency: 'eur',
    paymentMethodCreation: 'manual' as const,
    appearance: {
      theme: 'stripe' as const,
      variables: { borderRadius: '0px' },
    },
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <ExpressCheckoutInner
        cartItems={activeItems}
        promoCode={promoCode}
        userId={user?.id}
        shippingCost={shippingCost}
        displayAmountCents={displayAmountCents}
      />
    </Elements>
  )
}
