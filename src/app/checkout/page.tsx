'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Truck, Shield, Check, ChevronDown } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { CartItem } from '@/types'

// Obtenir le prix d'un article selon sa taille
const getItemPrice = (item: CartItem) => {
  const priceBySize = item.product.priceBySize
  if (priceBySize && priceBySize[item.selectedSize] > 0) {
    return priceBySize[item.selectedSize]
  }
  return item.product.price
}

type Step = 'information' | 'shipping' | 'payment'

interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  city: string
  postalCode: string
  country: string
}

interface ShippingSettings {
  freeShippingThreshold: number
  standardShippingPrice: number
  expressShippingPrice: number
  enableExpressShipping: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart } = useCartStore()
  const { user, profile } = useAuthStore()

  const [currentStep, setCurrentStep] = useState<Step>('information')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'France',
  })

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Paramètres de livraison depuis l'admin
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 150,
    standardShippingPrice: 9.90,
    expressShippingPrice: 14.90,
    enableExpressShipping: true,
  })

  // Charger les paramètres de livraison
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.shipping) {
          setShippingSettings({
            freeShippingThreshold: data.shipping.freeShippingThreshold ?? 150,
            standardShippingPrice: data.shipping.standardShippingPrice ?? 9.90,
            expressShippingPrice: data.shipping.expressShippingPrice ?? 14.90,
            enableExpressShipping: data.shipping.enableExpressShipping ?? true,
          })
          // Si express désactivé et qu'on l'avait sélectionné, revenir à standard
          if (!data.shipping.enableExpressShipping && shippingMethod === 'express') {
            setShippingMethod('standard')
          }
        }
      } catch (err) {
        console.error('Error fetching shipping settings:', err)
      }
    }
    fetchSettings()
  }, [])

  const subtotal = getTotal()
  const shippingCost = shippingMethod === 'express'
    ? shippingSettings.expressShippingPrice
    : (subtotal >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShippingPrice)
  const total = subtotal + shippingCost

  // Pré-remplir avec les infos du profil
  useEffect(() => {
    if (profile) {
      setShippingAddress((prev) => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      }))
    }
  }, [profile])

  // Rediriger si panier vide
  useEffect(() => {
    if (items.length === 0) {
      router.push('/panier')
    }
  }, [items, router])

  const handleInformationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('shipping')
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep('payment')
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions générales de vente')
      return
    }

    setIsLoading(true)

    try {
      // Créer une session Stripe Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          shippingAddress,
          shippingMethod,
          userId: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement')
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { id: 'information', label: 'Informations' },
    { id: 'shipping', label: 'Livraison' },
    { id: 'payment', label: 'Paiement' },
  ]

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F9F6F1]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back link */}
        <Link
          href="/panier"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#C9A962] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Steps */}
            <div className="flex items-center gap-4 mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                      currentStep === step.id
                        ? 'bg-[#19110B] text-white'
                        : steps.findIndex((s) => s.id === currentStep) > index
                        ? 'bg-[#C9A962] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {steps.findIndex((s) => s.id === currentStep) > index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm ${
                      currentStep === step.id ? 'font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronDown className="w-4 h-4 mx-4 text-gray-300 rotate-[-90deg]" />
                  )}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Information */}
            {currentStep === 'information' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 shadow-sm"
              >
                <h2 className="text-xl tracking-[0.1em] uppercase mb-6">
                  Informations de livraison
                </h2>

                <form onSubmit={handleInformationSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Prénom *</label>
                      <input
                        type="text"
                        value={shippingAddress.firstName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, firstName: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Nom *</label>
                      <input
                        type="text"
                        value={shippingAddress.lastName}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, lastName: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Email *</label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, email: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Téléphone *</label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, phone: e.target.value })
                        }
                        required
                        placeholder="+33 6 00 00 00 00"
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Adresse *</label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, street: e.target.value })
                      }
                      required
                      placeholder="123 rue Example"
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Code postal *</label>
                      <input
                        type="text"
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Ville *</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm text-gray-600 mb-2">Pays *</label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, country: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none"
                      >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    Continuer vers la livraison
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Shipping */}
            {currentStep === 'shipping' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 shadow-sm"
              >
                <h2 className="text-xl tracking-[0.1em] uppercase mb-6">Mode de livraison</h2>

                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <label
                      className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                        shippingMethod === 'standard'
                          ? 'border-[#C9A962] bg-[#F9F6F1]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="shipping"
                          value="standard"
                          checked={shippingMethod === 'standard'}
                          onChange={() => setShippingMethod('standard')}
                          className="w-5 h-5 accent-[#C9A962]"
                        />
                        <div>
                          <p className="font-medium">Livraison Standard</p>
                          <p className="text-sm text-gray-500">3-5 jours ouvrés</p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {subtotal >= shippingSettings.freeShippingThreshold ? (
                          <span className="text-green-600">Offerte</span>
                        ) : (
                          `${shippingSettings.standardShippingPrice.toLocaleString('fr-FR')} €`
                        )}
                      </span>
                    </label>

                    {shippingSettings.enableExpressShipping && (
                      <label
                        className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                          shippingMethod === 'express'
                            ? 'border-[#C9A962] bg-[#F9F6F1]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="shipping"
                            value="express"
                            checked={shippingMethod === 'express'}
                            onChange={() => setShippingMethod('express')}
                            className="w-5 h-5 accent-[#C9A962]"
                          />
                          <div>
                            <p className="font-medium">Livraison Express</p>
                            <p className="text-sm text-gray-500">1-2 jours ouvrés</p>
                          </div>
                        </div>
                        <span className="font-medium">{shippingSettings.expressShippingPrice.toLocaleString('fr-FR')} €</span>
                      </label>
                    )}
                  </div>

                  {/* Adresse récap */}
                  <div className="p-4 bg-gray-50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Adresse de livraison</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('information')}
                        className="text-sm text-[#C9A962] hover:underline"
                      >
                        Modifier
                      </button>
                    </div>
                    <p className="text-sm">
                      {shippingAddress.firstName} {shippingAddress.lastName}
                    </p>
                    <p className="text-sm">{shippingAddress.street}</p>
                    <p className="text-sm">
                      {shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('information')}
                      className="px-6 py-4 border border-gray-300 text-sm tracking-[0.15em] uppercase hover:bg-gray-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                    >
                      Continuer vers le paiement
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 shadow-sm"
              >
                <h2 className="text-xl tracking-[0.1em] uppercase mb-6">Paiement</h2>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Stripe info */}
                  <div className="p-4 bg-[#F9F6F1] border border-[#C9A962]/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-[#C9A962]" />
                      <span className="font-medium">Paiement sécurisé par Stripe</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Vous serez redirigé vers la page de paiement sécurisée Stripe pour finaliser votre commande.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <div className="px-2 py-1 bg-white rounded text-xs font-bold text-gray-600">VISA</div>
                      <div className="px-2 py-1 bg-white rounded text-xs font-bold text-gray-600">Mastercard</div>
                      <div className="px-2 py-1 bg-white rounded text-xs font-bold text-gray-600">CB</div>
                    </div>
                  </div>

                  {/* Récap adresse */}
                  <div className="p-4 bg-gray-50 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Adresse de livraison</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('information')}
                        className="text-sm text-[#C9A962] hover:underline"
                      >
                        Modifier
                      </button>
                    </div>
                    <p className="text-sm">
                      {shippingAddress.firstName} {shippingAddress.lastName}
                    </p>
                    <p className="text-sm">{shippingAddress.street}</p>
                    <p className="text-sm">
                      {shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}
                    </p>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-[#C9A962]"
                    />
                    <span className="text-sm text-gray-600">
                      J&apos;accepte les{' '}
                      <Link href="/cgv" className="text-[#C9A962] hover:underline">
                        conditions générales de vente
                      </Link>{' '}
                      et la{' '}
                      <Link href="/confidentialite" className="text-[#C9A962] hover:underline">
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('shipping')}
                      className="px-6 py-4 border border-gray-300 text-sm tracking-[0.15em] uppercase hover:bg-gray-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Redirection vers Stripe...' : `Payer ${total.toLocaleString('fr-FR')} €`}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security badges */}
            <div className="mt-8 flex items-center justify-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm">Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <span className="text-sm">Livraison suivie</span>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-sm sticky top-32">
              <h2 className="text-lg tracking-[0.15em] uppercase mb-6">Récapitulatif</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pt-2 pr-2">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4">
                    <div className="relative w-16 h-16 bg-[#F9F6F1] flex-shrink-0 overflow-visible">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#19110B] text-white text-xs rounded-full flex items-center justify-center z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.selectedSize}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {(getItemPrice(item) * item.quantity).toLocaleString('fr-FR')} €
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span>{subtotal.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Livraison</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Offerte</span>
                    ) : (
                      `${shippingCost.toLocaleString('fr-FR')} €`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-3 border-t">
                  <span>Total</span>
                  <span>{total.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
