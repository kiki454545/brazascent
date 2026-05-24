'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { ArrowLeft, CreditCard, Truck, Shield, Check, ChevronDown, MapPin, Plus, Tag, X, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { CartItem } from '@/types'
import posthog from 'posthog-js'
import { PaymentLogos } from '@/components/PaymentLogos'
import { formatPrice } from '@/lib/format'

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

interface SavedAddress {
  id: string
  label: string
  street: string
  city: string
  postal_code: string
  country: string
  is_default: boolean
}

interface ShippingMethod {
  id: string
  title: string
  description: string | null
  description_2: string | null
  price: number
  image_url: string | null
  badge: string | null
  free_threshold: number | null
  sort_order: number
}

interface AppliedPromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
}


export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, removeItem, pendingPromoCode, setPendingPromo } = useCartStore()
  const { user, profile } = useAuthStore()

  const [currentStep, setCurrentStep] = useState<Step>('shipping')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Adresses sauvegardées
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

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

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null)
  const [relayPoint, setRelayPoint] = useState({ name: '', address: '', postalCode: '', city: '' })
  const [acceptTerms, setAcceptTerms] = useState(false)

  const isRelayMethod = (method: ShippingMethod | null) =>
    !!(method?.title.toLowerCase().includes('relais') || method?.description?.toLowerCase().includes('relais'))

  // Code promo
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromoCode, setAppliedPromoCode] = useState<AppliedPromoCode | null>(null)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoRequiresLogin, setPromoRequiresLogin] = useState(false)
  const [validatingPromo, setValidatingPromo] = useState(false)

  // Pré-charger le code promo depuis le cart store
  useEffect(() => {
    if (pendingPromoCode && !appliedPromoCode) {
      setAppliedPromoCode(pendingPromoCode)
      const discount = pendingPromoCode.discount_type === 'percentage'
        ? Math.round((subtotal * pendingPromoCode.discount_value) / 100 * 100) / 100
        : Math.min(pendingPromoCode.discount_value, subtotal)
      setPromoDiscount(discount)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Charger les méthodes de livraison depuis la BDD
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const response = await fetch('/api/shipping-methods')
        const data = await response.json()
        const methods: ShippingMethod[] = data.methods || []
        setShippingMethods(methods)
        if (methods.length > 0) {
          setShippingMethodId(prev => prev ?? methods[0].id)
        }
      } catch (err) {
        console.error('Error fetching shipping methods:', err)
      }
    }
    fetchMethods()
  }, [])

  // Charger les adresses sauvegardées si l'utilisateur est connecté
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) {
        setLoadingAddresses(false)
        setUseNewAddress(true)
        return
      }

      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })

        if (error) throw error

        setSavedAddresses(data || [])

        // Si l'utilisateur a des adresses, sélectionner la première par défaut
        if (data && data.length > 0) {
          const defaultAddress = data.find(a => a.is_default) || data[0]
          setSelectedAddressId(defaultAddress.id)
          setUseNewAddress(false)
        } else {
          setUseNewAddress(true)
        }
      } catch (err) {
        console.error('Error fetching addresses:', err)
        setUseNewAddress(true)
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchAddresses()
  }, [user])

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

  const subtotal = getTotal()
  const selectedMethod = shippingMethods.find(m => m.id === shippingMethodId) ?? null
  const shippingCost = selectedMethod
    ? (selectedMethod.free_threshold !== null && subtotal >= selectedMethod.free_threshold
        ? 0
        : Number(selectedMethod.price))
    : 0
  const total = subtotal + shippingCost - promoDiscount

  // Valider le code promo
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) return

    setValidatingPromo(true)
    setPromoError(null)
    setPromoRequiresLogin(false)

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      }

      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: promoCode.trim(),
          orderTotal: subtotal,
          productIds: items.map(item => item.product.id),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresLogin) {
          setPromoRequiresLogin(true)
        } else {
          setPromoError(data.error || 'Code promo invalide')
        }
        return
      }

      setAppliedPromoCode(data.promoCode)
      setPromoDiscount(data.discountAmount)
      setPendingPromo(data.promoCode)
      setPromoCode('')
      posthog.capture('promo_code_applied', {
        code: data.promoCode.code,
        discount_type: data.promoCode.discount_type,
        discount_value: data.promoCode.discount_value,
        discount_amount: data.discountAmount,
        order_subtotal: subtotal,
      })
    } catch (err) {
      setPromoError('Erreur lors de la validation du code promo')
    } finally {
      setValidatingPromo(false)
    }
  }

  // Retirer le code promo
  const handleRemovePromoCode = () => {
    setPromoRequiresLogin(false)
    setAppliedPromoCode(null)
    setPendingPromo(null)
    setPromoDiscount(0)
    setPromoError(null)
  }

  // Recalculer la réduction quand le sous-total change
  useEffect(() => {
    if (appliedPromoCode) {
      if (appliedPromoCode.discount_type === 'percentage') {
        setPromoDiscount(Math.round((subtotal * appliedPromoCode.discount_value) / 100 * 100) / 100)
      } else {
        setPromoDiscount(Math.min(appliedPromoCode.discount_value, subtotal))
      }
    }
  }, [subtotal, appliedPromoCode])

  // Rediriger si panier vide
  useEffect(() => {
    if (items.length === 0) {
      router.push('/panier')
    }
  }, [items, router])

  // Obtenir l'adresse finale à utiliser
  const getFinalAddress = (): ShippingAddress => {
    const personalInfo = {
      firstName: useNewAddress ? shippingAddress.firstName : (profile?.first_name || shippingAddress.firstName),
      lastName: useNewAddress ? shippingAddress.lastName : (profile?.last_name || shippingAddress.lastName),
      email: user ? (user.email || profile?.email || shippingAddress.email) : shippingAddress.email,
      phone: shippingAddress.phone,
    }

    // Si le mode de livraison est un point relais, utiliser l'adresse du relais
    if (isRelayMethod(selectedMethod)) {
      return {
        ...personalInfo,
        street: relayPoint.address,
        city: relayPoint.city,
        postalCode: relayPoint.postalCode,
        country: 'France',
      }
    }

    if (!useNewAddress) {
      const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId)
      if (selectedAddress) {
        return {
          ...personalInfo,
          street: selectedAddress.street,
          city: selectedAddress.city,
          postalCode: selectedAddress.postal_code,
          country: selectedAddress.country,
        }
      }
    }

    return {
      ...shippingAddress,
      email: user ? (user.email || profile?.email || shippingAddress.email) : shippingAddress.email,
    }
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingMethodId) {
      setError('Veuillez sélectionner un mode de livraison')
      return
    }
    if (isRelayMethod(selectedMethod)) {
      if (!relayPoint.name.trim() || !relayPoint.address.trim() || !relayPoint.postalCode.trim() || !relayPoint.city.trim()) {
        setError('Veuillez renseigner les informations du point relais')
        return
      }
    }
    setError(null)
    setCurrentStep('information')
  }

  const handleInformationSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (user && user.email) {
      const usedEmail = (profile?.email || shippingAddress.email).toLowerCase().trim()
      if (usedEmail !== user.email.toLowerCase().trim()) {
        setError("L'adresse email doit correspondre à celle de votre compte")
        return
      }
    }

    if (!shippingAddress.phone.trim()) {
      setError('Le numéro de téléphone est requis pour la livraison')
      return
    }

    setError(null)
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
      const finalAddress = getFinalAddress()

      // Créer une session Stripe Checkout
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          shippingAddress: finalAddress,
          shippingMethodId,
          userId: user?.id,
          promoCode: appliedPromoCode ? {
            id: appliedPromoCode.id,
            code: appliedPromoCode.code,
            discount: promoDiscount,
          } : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement')
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        posthog.capture('checkout_started', {
          item_count: items.length,
          subtotal,
          shipping_cost: shippingCost,
          total,
          shipping_method: selectedMethod?.title,
          promo_code: appliedPromoCode?.code ?? null,
          promo_discount: promoDiscount > 0 ? promoDiscount : null,
          items: items.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            size: item.selectedSize,
            quantity: item.quantity,
            price: getItemPrice(item),
          })),
        })
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Payment error:', err)
      posthog.captureException(err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { id: 'shipping', label: 'Livraison' },
    { id: 'information', label: 'Informations' },
    { id: 'payment', label: 'Paiement' },
  ]

  if (items.length === 0) {
    return null
  }

  const finalAddress = getFinalAddress()

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="px-6 sm:px-10 lg:px-20">
        {/* Back link */}
        <Link
          href="/panier"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
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
                        ? 'bg-foreground text-background'
                        : steps.findIndex((s) => s.id === currentStep) > index
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
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
                      currentStep === step.id ? 'font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronDown className="w-4 h-4 mx-4 text-muted-foreground/50 rotate-[-90deg]" />
                  )}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Livraison */}
            {currentStep === 'shipping' && (
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-cream p-8 shadow-sm"
              >
                <h2 className="text-xl tracking-[0.1em] uppercase mb-6">Mode de livraison</h2>

                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {shippingMethods.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun mode de livraison disponible
                      </p>
                    )}
                    {shippingMethods.map((method) => {
                      const isSelected = shippingMethodId === method.id
                      const isFree = method.free_threshold !== null && subtotal >= method.free_threshold
                      const priceLabel = isFree ? (
                        <span className="text-green-600">Offerte</span>
                      ) : (
                        `${formatPrice(Number(method.price))} €`
                      )

                      return (
                        <label
                          key={method.id}
                          className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                            isSelected ? 'border-primary bg-cream' : 'border-border hover:border-border'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="radio"
                              name="shipping"
                              value={method.id}
                              checked={isSelected}
                              onChange={() => setShippingMethodId(method.id)}
                              className="w-5 h-5 accent-[#C9A962]"
                            />
                            {method.image_url && (
                              <div className="w-12 h-12 relative flex-shrink-0">
                                <Image src={method.image_url} alt={method.title} fill sizes="48px" className="object-contain" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{method.title}</p>
                              {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
                              {method.description_2 && <p className="text-sm text-muted-foreground">{method.description_2}</p>}
                              {method.badge && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-cream border border-primary/30 rounded">
                                  {method.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-medium">{priceLabel}</span>
                        </label>
                      )
                    })}
                  </div>

                  {/* Formulaire point relais */}
                  {isRelayMethod(selectedMethod) && (
                    <div className="p-4 border border-primary/30 bg-primary/5 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Indiquez votre point relais</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trouvez un point relais sur le site de votre transporteur, puis renseignez son adresse ci-dessous.
                      </p>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Nom du point relais *</label>
                        <input
                          type="text"
                          value={relayPoint.name}
                          onChange={(e) => setRelayPoint({ ...relayPoint, name: e.target.value })}
                          placeholder="Ex : Tabac du Centre"
                          className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Adresse du point relais *</label>
                        <input
                          type="text"
                          value={relayPoint.address}
                          onChange={(e) => setRelayPoint({ ...relayPoint, address: e.target.value })}
                          placeholder="Ex : 12 rue de la Paix"
                          className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Code postal *</label>
                          <input
                            type="text"
                            value={relayPoint.postalCode}
                            onChange={(e) => setRelayPoint({ ...relayPoint, postalCode: e.target.value })}
                            placeholder="75001"
                            className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Ville *</label>
                          <input
                            type="text"
                            value={relayPoint.city}
                            onChange={(e) => setRelayPoint({ ...relayPoint, city: e.target.value })}
                            placeholder="Paris"
                            className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
                  >
                    Continuer vers les informations
                  </button>
                </form>
              </m.div>
            )}

            {/* Step 2: Informations */}
            {currentStep === 'information' && (
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-cream p-8 shadow-sm"
              >
                <h2 className="text-xl tracking-[0.1em] uppercase mb-6">
                  Informations de livraison
                </h2>

                <form onSubmit={handleInformationSubmit} className="space-y-6">
                  {/* Mode de livraison récap */}
                  {selectedMethod && (
                    <div className="p-4 bg-muted border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Mode de livraison</span>
                        <button type="button" onClick={() => setCurrentStep('shipping')} className="text-sm text-primary hover:underline">
                          Modifier
                        </button>
                      </div>
                      <p className="text-sm font-medium">{selectedMethod.title}</p>
                      {isRelayMethod(selectedMethod) && relayPoint.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {relayPoint.name} — {relayPoint.address}, {relayPoint.postalCode} {relayPoint.city}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Adresses sauvegardées — masquées si point relais */}
                  {!isRelayMethod(selectedMethod) && user && !loadingAddresses && savedAddresses.length > 0 && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-foreground/80 mb-2">
                        Adresse de livraison
                      </label>
                      <div className="space-y-3">
                        {savedAddresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-4 p-4 border cursor-pointer transition-colors ${
                              !useNewAddress && selectedAddressId === address.id
                                ? 'border-primary bg-cream'
                                : 'border-border hover:border-border'
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              checked={!useNewAddress && selectedAddressId === address.id}
                              onChange={() => { setSelectedAddressId(address.id); setUseNewAddress(false) }}
                              className="w-5 h-5 mt-0.5 accent-[#C9A962]"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="font-medium">{address.label}</span>
                                {address.is_default && (
                                  <span className="px-2 py-0.5 bg-primary text-white text-xs uppercase">Par défaut</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{address.street}</p>
                              <p className="text-sm text-muted-foreground">{address.postal_code} {address.city}, {address.country}</p>
                            </div>
                          </label>
                        ))}
                        <label
                          className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${
                            useNewAddress ? 'border-primary bg-cream' : 'border-border hover:border-border'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={useNewAddress}
                            onChange={() => setUseNewAddress(true)}
                            className="w-5 h-5 accent-[#C9A962]"
                          />
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" />
                            <span className="font-medium">Utiliser une nouvelle adresse</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Formulaire adresse — masqué si point relais */}
                  {!isRelayMethod(selectedMethod) && (useNewAddress || !user || savedAddresses.length === 0) && (
                    <>
                      {user && savedAddresses.length > 0 && (
                        <div className="border-t pt-6 mt-6">
                          <h3 className="text-sm font-medium text-foreground/80 mb-4">Nouvelle adresse</h3>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Prénom *</label>
                          <input type="text" value={shippingAddress.firstName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                            required className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Nom *</label>
                          <input type="text" value={shippingAddress.lastName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                            required className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">
                          Email *{user && <span className="ml-2 text-xs text-primary">(lié à votre compte)</span>}
                        </label>
                        <input type="email"
                          value={user ? (user.email || '') : shippingAddress.email}
                          onChange={(e) => { if (!user) setShippingAddress({ ...shippingAddress, email: e.target.value }) }}
                          readOnly={!!user} required
                          className={`w-full px-4 py-3 border border-border focus:outline-none text-base ${user ? 'bg-muted text-muted-foreground cursor-default focus:border-border' : 'focus:border-primary'}`} />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Adresse *</label>
                        <input type="text" value={shippingAddress.street}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                          required placeholder="123 rue Example"
                          className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Code postal *</label>
                          <input type="text" value={shippingAddress.postalCode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                            required className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Ville *</label>
                          <input type="text" value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                            required className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm text-muted-foreground mb-2">Pays *</label>
                          <select value={shippingAddress.country}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                            className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base">
                            <option value="France">France</option>
                            <option value="Belgique">Belgique</option>
                            <option value="Suisse">Suisse</option>
                            <option value="Luxembourg">Luxembourg</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Prénom/Nom si point relais (adresse du relais déjà saisie) */}
                  {isRelayMethod(selectedMethod) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Prénom *</label>
                        <input type="text" value={shippingAddress.firstName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                          required className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Nom *</label>
                        <input type="text" value={shippingAddress.lastName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                          required className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                      </div>
                    </div>
                  )}
                  {isRelayMethod(selectedMethod) && (
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        Email *{user && <span className="ml-2 text-xs text-primary">(lié à votre compte)</span>}
                      </label>
                      <input type="email"
                        value={user ? (user.email || '') : shippingAddress.email}
                        onChange={(e) => { if (!user) setShippingAddress({ ...shippingAddress, email: e.target.value }) }}
                        readOnly={!!user} required
                        className={`w-full px-4 py-3 border border-border focus:outline-none text-base ${user ? 'bg-muted text-muted-foreground cursor-default focus:border-border' : 'focus:border-primary'}`} />
                    </div>
                  )}

                  {/* Téléphone - Toujours visible */}
                  <div className={user && savedAddresses.length > 0 && !useNewAddress && !isRelayMethod(selectedMethod) ? 'border-t pt-6' : ''}>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Téléphone * <span className="text-muted-foreground/60">(requis pour la livraison)</span>
                    </label>
                    <input type="tel" value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      required placeholder="+33 6 00 00 00 00"
                      className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none text-base" />
                    <p className="text-xs text-muted-foreground mt-1">Le transporteur peut vous contacter pour la livraison</p>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" onClick={() => setCurrentStep('shipping')}
                      className="px-6 py-4 border border-border text-sm tracking-[0.15em] uppercase hover:bg-muted transition-colors">
                      Retour
                    </button>
                    <button type="submit"
                      className="flex-1 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors">
                      Continuer vers le paiement
                    </button>
                  </div>
                </form>
              </m.div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && (
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-cream p-8 shadow-sm"
              >
                <h2 className="text-xl tracking-[0.1em] uppercase mb-6">Paiement</h2>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Stripe info */}
                  <div className="p-4 bg-cream border border-primary/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <span className="font-medium">Paiement sécurisé par Stripe</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vous serez redirigé vers la page de paiement sécurisée Stripe pour finaliser votre commande.
                    </p>
                    <PaymentLogos className="mt-3" />
                  </div>

                  {/* Récap livraison */}
                  <div className="p-4 bg-muted border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Mode de livraison</span>
                      <button type="button" onClick={() => setCurrentStep('shipping')} className="text-sm text-primary hover:underline">
                        Modifier
                      </button>
                    </div>
                    <p className="text-sm font-medium">{selectedMethod?.title}</p>
                    {isRelayMethod(selectedMethod) && relayPoint.name && (
                      <p className="text-sm text-muted-foreground">{relayPoint.name} — {relayPoint.address}, {relayPoint.postalCode} {relayPoint.city}</p>
                    )}
                  </div>
                  <div className="p-4 bg-muted border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{isRelayMethod(selectedMethod) ? 'Vos informations' : 'Adresse de livraison'}</span>
                      <button type="button" onClick={() => setCurrentStep('information')} className="text-sm text-primary hover:underline">
                        Modifier
                      </button>
                    </div>
                    <p className="text-sm">{finalAddress.firstName} {finalAddress.lastName}</p>
                    {!isRelayMethod(selectedMethod) && (
                      <>
                        <p className="text-sm">{finalAddress.street}</p>
                        <p className="text-sm">{finalAddress.postalCode} {finalAddress.city}, {finalAddress.country}</p>
                      </>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">Tél: {finalAddress.phone}</p>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-[#C9A962]"
                    />
                    <span className="text-sm text-muted-foreground">
                      J&apos;accepte les{' '}
                      <Link href="/cgv" className="text-primary hover:underline">
                        conditions générales de vente
                      </Link>{' '}
                      et la{' '}
                      <Link href="/confidentialite" className="text-primary hover:underline">
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('information')}
                      className="px-6 py-4 border border-border text-sm tracking-[0.15em] uppercase hover:bg-muted transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Redirection vers Stripe...' : `Payer ${formatPrice(total)} €`}
                    </button>
                  </div>
                </form>
              </m.div>
            )}

            {/* Security badges */}
            <div className="mt-8 flex items-center justify-center gap-8 text-muted-foreground/60">
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
            <div className="bg-cream p-6 shadow-sm sticky top-32">
              <h2 className="text-lg tracking-[0.15em] uppercase mb-6">Récapitulatif</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 pt-2">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4 group">
                    <div className="relative w-16 h-16 bg-cream flex-shrink-0 overflow-visible">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background text-xs rounded-full flex items-center justify-center z-10">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.selectedSize}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-medium">
                        {formatPrice(getItemPrice(item) * item.quantity)} €
                      </p>
                      <button
                        onClick={() => removeItem(item.product.id, item.selectedSize)}
                        className="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code promo */}
              <div className="border-t pt-4 mb-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Code promo
                </p>
                {appliedPromoCode ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg">
                    <div>
                      <p className="font-mono font-semibold text-green-700 dark:text-green-400">{appliedPromoCode.code}</p>
                      <p className="text-xs text-green-600 dark:text-green-500">
                        {appliedPromoCode.discount_type === 'percentage'
                          ? `-${appliedPromoCode.discount_value}%`
                          : `-${appliedPromoCode.discount_value} €`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromoCode}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase())
                          setPromoError(null)
                          setPromoRequiresLogin(false)
                        }}
                        placeholder="Entrer le code"
                        className="flex-1 px-3 py-2 border border-border text-base focus:border-primary focus:outline-none uppercase"
                      />
                      <button
                        onClick={handleApplyPromoCode}
                        disabled={validatingPromo || !promoCode.trim()}
                        className="px-4 py-2 bg-foreground text-background text-sm hover:bg-primary transition-colors disabled:opacity-50"
                      >
                        {validatingPromo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Appliquer'
                        )}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500">{promoError}</p>
                    )}
                    {promoRequiresLogin && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm space-y-1">
                        <p className="text-amber-800 dark:text-amber-300 font-medium">Ce code est réservé aux comptes connectés.</p>
                        <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                          <Link href="/compte?redirect=/checkout" className="underline hover:text-amber-900 dark:hover:text-amber-200">
                            Se connecter
                          </Link>
                          <span>·</span>
                          <Link href="/compte?tab=register&redirect=/checkout" className="underline hover:text-amber-900 dark:hover:text-amber-200">
                            Créer un compte
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(subtotal)} €</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Réduction ({appliedPromoCode?.code})</span>
                    <span>-{formatPrice(promoDiscount)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">Offerte</span>
                    ) : (
                      `${formatPrice(shippingCost)} €`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-medium pt-3 border-t">
                  <span>Total</span>
                  <span>{formatPrice(total)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
