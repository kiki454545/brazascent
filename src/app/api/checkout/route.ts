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
    const { items, shippingAddress, shippingMethod, userId } = body

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

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
      customer_email: shippingAddress.email,
      metadata: {
        userId: userId || '',
        shippingMethod,
        shippingAddress: JSON.stringify(shippingAddress),
        items: JSON.stringify(items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          size: item.selectedSize,
          quantity: item.quantity,
          price: getItemPrice(item),
          image: item.product.images[0],
        }))),
      },
      locale: 'fr',
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
