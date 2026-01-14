import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Client Supabase admin pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Traiter l'événement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // Récupérer les métadonnées
      const metadata = session.metadata || {}
      const shippingAddress = metadata.shippingAddress ? JSON.parse(metadata.shippingAddress) : null
      const items = metadata.items ? JSON.parse(metadata.items) : []
      const userId = metadata.userId || null
      const shippingMethod = metadata.shippingMethod || 'standard'

      // Calculer les frais de livraison
      const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity, 0
      )
      const shippingCost = subtotal >= 150 ? 0 : shippingMethod === 'express' ? 14.90 : 9.90

      // Créer la commande dans Supabase
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: userId || null,
          status: 'confirmed',
          subtotal: subtotal,
          shipping: shippingCost,
          total: session.amount_total ? session.amount_total / 100 : subtotal + shippingCost,
          shipping_address: shippingAddress,
          payment_method: 'stripe',
          payment_status: 'completed',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
      }

      // Ajouter les articles de la commande
      if (items.length > 0 && order) {
        const orderItems = items.map((item: {
          productId: string
          name: string
          size: string
          quantity: number
          price: number
          image: string
        }) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          product_image: item.image,
          size: item.size,
          quantity: item.quantity,
          price: item.price * item.quantity,
        }))

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Error creating order items:', itemsError)
        }
      }

      console.log('Order created successfully:', order?.order_number)
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
