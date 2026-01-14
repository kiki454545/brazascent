import { NextRequest, NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'

interface CartItem {
  product: {
    id: string
    name: string
    price: number
    images: string[]
  }
  selectedSize: string
  quantity: number
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

    // Calculer les frais de livraison
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const shippingCost = subtotal >= 150 ? 0 : shippingMethod === 'express' ? 14.90 : 9.90

    // Créer les line items pour Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.product.name,
          description: `Taille: ${item.selectedSize}`,
          images: item.product.images.slice(0, 1), // Stripe accepte max 8 images
        },
        unit_amount: formatAmountForStripe(item.product.price),
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
          price: item.product.price,
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
