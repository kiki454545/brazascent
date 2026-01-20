import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, formatAmountForStripe } from '@/lib/stripe'

// Client Supabase côté serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CartItem {
  product: {
    id: string
    name: string
    price: number
    priceBySize?: Record<string, number>
    images: string[]
  }
  selectedSize: string
  quantity: number
}

// Obtenir le prix d'un article selon sa taille
const getItemPrice = (item: CartItem): number => {
  const priceBySize = item.product.priceBySize
  if (priceBySize && priceBySize[item.selectedSize] > 0) {
    return priceBySize[item.selectedSize]
  }
  return item.product.price
}

interface CheckoutBody {
  items: CartItem[]
  shippingAddress: {
    firstName: string
    lastName: string
    email: string
    phone: string
    street: string
    city: string
    postalCode: string
    country: string
  }
  shippingMethod: 'standard' | 'express'
  userId?: string
  promoCode?: {
    id: string
    code: string
    discount: number
  } | null
}

interface ShippingSettings {
  freeShippingThreshold: number
  standardShippingPrice: number
  expressShippingPrice: number
  enableExpressShipping: boolean
}

// Récupérer les paramètres de livraison depuis Supabase
async function getShippingSettings(): Promise<ShippingSettings> {
  const defaultSettings: ShippingSettings = {
    freeShippingThreshold: 150,
    standardShippingPrice: 9.90,
    expressShippingPrice: 14.90,
    enableExpressShipping: true,
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shipping')
      .single()

    if (error || !data) {
      return defaultSettings
    }

    const shippingValue = data.value as ShippingSettings
    return {
      freeShippingThreshold: shippingValue.freeShippingThreshold ?? defaultSettings.freeShippingThreshold,
      standardShippingPrice: shippingValue.standardShippingPrice ?? defaultSettings.standardShippingPrice,
      expressShippingPrice: shippingValue.expressShippingPrice ?? defaultSettings.expressShippingPrice,
      enableExpressShipping: shippingValue.enableExpressShipping ?? defaultSettings.enableExpressShipping,
    }
  } catch {
    return defaultSettings
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json()
    const { items, shippingAddress, shippingMethod, userId, promoCode } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Le panier est vide' },
        { status: 400 }
      )
    }

    // Récupérer les paramètres de livraison depuis l'admin
    const shippingSettings = await getShippingSettings()

    // Vérifier si la livraison express est autorisée
    if (shippingMethod === 'express' && !shippingSettings.enableExpressShipping) {
      return NextResponse.json(
        { error: 'La livraison express n\'est pas disponible' },
        { status: 400 }
      )
    }

    // Calculer les frais de livraison avec les paramètres admin
    const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
    const shippingCost = shippingMethod === 'express'
      ? shippingSettings.expressShippingPrice
      : (subtotal >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShippingPrice)

    // Créer les line items pour Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.product.name,
          description: `Taille: ${item.selectedSize}`,
          images: item.product.images.slice(0, 1), // Stripe accepte max 8 images
        },
        unit_amount: formatAmountForStripe(getItemPrice(item)),
      },
      quantity: item.quantity,
    }))

    // Ajouter les frais de livraison si nécessaire
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: shippingMethod === 'express' ? 'Livraison Express' : 'Livraison Standard',
            description: shippingMethod === 'express' ? '1-2 jours ouvrés' : '3-5 jours ouvrés',
            images: [],
          },
          unit_amount: formatAmountForStripe(shippingCost),
        },
        quantity: 1,
      })
    }

    // Gérer le code promo avec les coupons Stripe
    let stripeCouponId: string | undefined
    if (promoCode && promoCode.discount > 0) {
      try {
        // Créer un coupon Stripe temporaire pour cette commande
        const coupon = await stripe.coupons.create({
          amount_off: formatAmountForStripe(promoCode.discount),
          currency: 'eur',
          duration: 'once',
          name: `Code promo: ${promoCode.code}`,
          max_redemptions: 1,
        })
        stripeCouponId = coupon.id
      } catch (couponError) {
        console.error('Error creating Stripe coupon:', couponError)
        // Continuer sans le coupon si erreur
      }
    }

    // Créer la session Stripe Checkout
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
      customer_email: shippingAddress.email,
      metadata: {
        userId: userId || '',
        shippingMethod,
        // Stocker l'adresse de manière compacte
        shipping: JSON.stringify({
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: `${shippingAddress.street}, ${shippingAddress.postalCode} ${shippingAddress.city}, ${shippingAddress.country}`
        }),
        // Stocker les items de manière compacte (sans images, noms courts)
        items: JSON.stringify(items.map(item => ({
          id: item.product.id,
          s: item.selectedSize,
          q: item.quantity,
          p: getItemPrice(item),
        }))),
        // Stocker les infos du code promo
        promoCodeId: promoCode?.id || '',
        promoCodeCode: promoCode?.code || '',
        promoCodeDiscount: promoCode?.discount?.toString() || '',
      },
      locale: 'fr',
    }

    // Ajouter le coupon si disponible
    if (stripeCouponId) {
      sessionConfig.discounts = [{ coupon: stripeCouponId }]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Enregistrer l'utilisation du code promo et incrémenter le compteur
    if (promoCode) {
      try {
        // Incrémenter le compteur d'utilisations
        await supabase.rpc('increment_promo_code_usage', { code_id: promoCode.id })

        // Enregistrer l'utilisation dans les logs
        await supabase.from('promo_code_usage').insert({
          promo_code_id: promoCode.id,
          user_id: userId || null,
          user_email: shippingAddress.email,
          order_id: session.id,
          order_total: subtotal + shippingCost,
          discount_applied: promoCode.discount,
        })
      } catch (promoError) {
        console.error('Error recording promo code usage:', promoError)
        // Ne pas bloquer la commande si l'enregistrement échoue
      }
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    console.error('Error message:', error?.message)
    console.error('Error type:', error?.type)
    console.error('Error code:', error?.code)
    console.error('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
    console.error('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)

    // Vérifier si Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Configuration Stripe manquante. Contactez l\'administrateur.' },
        { status: 500 }
      )
    }

    // Erreurs Stripe spécifiques
    if (error?.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Erreur Stripe: ${error?.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
