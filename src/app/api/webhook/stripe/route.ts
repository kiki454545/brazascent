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
      // Récupérer les métadonnées (format du checkout sécurisé)
      const metadata = session.metadata || {}
      const shippingData = metadata.shipping ? JSON.parse(metadata.shipping) : null
      // Format items: {id, s (size), q (quantity), p (price)}
      const rawItems = metadata.items ? JSON.parse(metadata.items) : []
      const userId = metadata.userId || null
      const shippingMethod = metadata.shippingMethod || 'standard'

      // Récupérer les infos produits depuis la BDD pour avoir les noms et images
      const productIds = rawItems.map((item: { id: string }) => item.id)
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images')
        .in('id', productIds)

      const productMap = new Map(products?.map(p => [p.id, p]) || [])

      // Calculer le sous-total avec les prix vérifiés
      const subtotal = rawItems.reduce((sum: number, item: { p: number; q: number }) =>
        sum + item.p * item.q, 0
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
          shipping_address: shippingData,
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
      if (rawItems.length > 0 && order) {
        const orderItems = rawItems.map((item: {
          id: string
          s: string   // size
          q: number   // quantity
          p: number   // price
        }) => {
          const product = productMap.get(item.id)
          return {
            order_id: order.id,
            product_id: item.id,
            product_name: product?.name || 'Produit',
            product_image: product?.images?.[0] || '',
            size: item.s,
            quantity: item.q,
            price: item.p * item.q,
          }
        })

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
