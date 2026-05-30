import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendAdminOrderNotification } from '@/lib/email'
import { getPostHogClient } from '@/lib/posthog-server'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Client Supabase admin pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Fonction pour envoyer l'email de confirmation
async function sendOrderConfirmationEmail(
  customerEmail: string,
  orderNumber: string,
  orderItems: Array<{ product_name: string; size: string; quantity: number; price: number }>,
  shippingData: { name: string; address: string } | null,
  subtotal: number,
  shippingCost: number,
  total: number,
  shippingMethodTitle: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY non configurée, email non envoyé')
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${escapeHtml(item.product_name)}</strong><br>
          <span style="color: #666; font-size: 14px;">Taille: ${escapeHtml(item.size)}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} €</td>
      </tr>
    `).join('')

    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background-color: #19110B; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #C9A962; font-size: 28px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase;">
                Braza Scent
              </h1>
            </td>
          </tr>

          <!-- Confirmation Message -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <table role="presentation" style="margin: 0 auto 20px; border-collapse: collapse;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: #C9A962; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="color: white; font-size: 30px; line-height: 60px;">✓</span>
                  </td>
                </tr>
              </table>
              <h2 style="margin: 0 0 10px; color: #19110B; font-size: 24px; font-weight: 400;">
                Merci pour votre commande !
              </h2>
              <p style="margin: 0; color: #666; font-size: 16px;">
                Commande n° <strong style="color: #19110B;">${orderNumber}</strong>
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f9f6f1;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 0.1em;">Produit</th>
                    <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 0.1em;">Qté</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 0.1em;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table style="width: 100%; margin-top: 20px;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Sous-total</td>
                  <td style="padding: 8px 0; text-align: right;">${subtotal.toFixed(2)} €</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">
                    ${shippingMethodTitle}
                  </td>
                  <td style="padding: 8px 0; text-align: right;">
                    ${shippingCost === 0 ? 'Offerte' : shippingCost.toFixed(2) + ' €'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #19110B;">Total</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; border-top: 2px solid #19110B;">${total.toFixed(2)} €</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          ${shippingData ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background-color: #f9f6f1; padding: 20px; border-left: 3px solid #C9A962;">
                <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 0.1em;">Adresse de livraison</h3>
                <p style="margin: 0; color: #19110B; line-height: 1.6;">
                  ${escapeHtml(shippingData.name)}<br>
                  ${escapeHtml(shippingData.address)}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://brazascent.com/compte/commandes" style="display: inline-block; padding: 14px 32px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
                Suivre ma commande
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #19110B; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px; color: #ffffff; font-size: 12px; letter-spacing: 0.1em;">
                MAISON DE PARFUMERIE D'EXCEPTION
              </p>
              <p style="margin: 0; color: #888888; font-size: 11px;">
                Une question ? Contactez-nous à brazascent@gmail.com
              </p>
              <p style="margin: 15px 0 0; color: #666666; font-size: 10px;">
                © ${new Date().getFullYear()} Braza Scent. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    await resend.emails.send({
      from: 'Braza Scent <commandes@brazascent.com>',
      to: customerEmail,
      subject: `Confirmation de commande n° ${orderNumber}`,
      html: emailHtml,
    })

    console.log('Email de confirmation envoyé à:', customerEmail)
  } catch (error) {
    console.error('Erreur envoi email confirmation:', error)
    // Ne pas bloquer la commande si l'email échoue
  }
}

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      // IDEMPOTENCE: vérifier si cette session a déjà été traitée
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle()

      if (existingOrder) {
        console.log('Webhook déjà traité pour session:', session.id)
        return NextResponse.json({ received: true })
      }

      // Récupérer les métadonnées (format du checkout sécurisé)
      const metadata = session.metadata || {}
      const shippingData = metadata.shipping ? JSON.parse(metadata.shipping) : null
      // Format items: {id, s (size), q (quantity), p (price)}
      const rawItems = metadata.items ? JSON.parse(metadata.items) : []
      const shippingMethodId = metadata.shippingMethodId || null
      const shippingMethodTitle = metadata.shippingMethodTitle || 'Livraison'
      const promoCode = metadata.promoCodeCode || null
      const promoDiscount = metadata.promoCodeDiscount ? parseFloat(metadata.promoCodeDiscount) : null

      // SÉCURITÉ: résoudre le userId depuis l'email du paiement (jamais faire confiance au client)
      let resolvedUserId: string | null = null
      if (session.customer_email) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', session.customer_email)
          .maybeSingle()
        if (profile) resolvedUserId = profile.id
      }

      // Récupérer les infos produits depuis la BDD pour avoir les noms et images
      const productIds = rawItems.map((item: { id: string }) => item.id)
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images')
        .in('id', productIds)

      const productMap = new Map(products?.map(p => [p.id, p]) || [])

      // Sous-total (prix vérifiés stockés en metadata par /api/checkout)
      const subtotal = rawItems.reduce((sum: number, item: { p: number; q: number }) =>
        sum + item.p * item.q, 0
      )
      const shippingCost = metadata.shippingCost ? parseFloat(metadata.shippingCost) : 0

      // Créer la commande dans Supabase
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: resolvedUserId,
          status: 'confirmed',
          subtotal: subtotal,
          shipping: shippingCost,
          discount: promoDiscount,
          promo_code: promoCode,
          total: session.amount_total ? session.amount_total / 100 : subtotal + shippingCost,
          shipping_address: shippingData,
          shipping_method: shippingMethodTitle,
          shipping_method_id: shippingMethodId,
          payment_method: 'stripe',
          payment_status: 'completed',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          customer_email: session.customer_email || shippingData?.email || null,
          customer_name: shippingData?.name || null,
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw orderError
      }

      // Ajouter les articles de la commande
      const orderItemsForEmail: Array<{ product_name: string; size: string; quantity: number; price: number }> = []

      if (rawItems.length > 0 && order) {
        const orderItems = rawItems.map((item: {
          id: string
          s: string   // size
          q: number   // quantity
          p: number   // price
        }) => {
          const product = productMap.get(item.id)
          const orderItem = {
            order_id: order.id,
            product_id: item.id,
            product_name: product?.name || 'Produit',
            product_image: product?.images?.[0] || '',
            size: item.s,
            quantity: item.q,
            price: item.p * item.q,
          }
          orderItemsForEmail.push({
            product_name: orderItem.product_name,
            size: orderItem.size,
            quantity: orderItem.quantity,
            price: orderItem.price,
          })
          return orderItem
        })

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Error creating order items:', itemsError)
        }

        // Déduire le stock (unités + ml) pour chaque article commandé
        for (const item of rawItems as Array<{ id: string; s: string; q: number }>) {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock, ml_stock')
            .eq('id', item.id)
            .maybeSingle()

          if (prod) {
            const mlPerUnit = parseFloat((item.s || '').replace(',', '.').match(/([\d.]+)\s*ml/i)?.[1] || '0')
            const mlDeducted = mlPerUnit * item.q
            const updates: Record<string, number> = {}
            if (prod.stock !== null) updates.stock = Math.max(0, prod.stock - item.q)
            if (prod.ml_stock !== null && mlDeducted > 0) updates.ml_stock = Math.max(0, prod.ml_stock - mlDeducted)
            if (Object.keys(updates).length > 0) {
              await supabaseAdmin.from('products').update(updates).eq('id', item.id)
            }
          }
        }
      }

      console.log('Order created successfully:', order?.order_number)

      // PostHog: server-side order_created event
      if (order) {
        const posthog = getPostHogClient()
        const distinctId = resolvedUserId ?? (session.customer_email ?? session.id)
        posthog.capture({
          distinctId,
          event: 'order_created',
          properties: {
            order_number: order.order_number,
            order_id: order.id,
            subtotal,
            shipping_cost: shippingCost,
            total: session.amount_total ? session.amount_total / 100 : subtotal + shippingCost,
            item_count: rawItems.length,
            shipping_method: shippingMethodTitle,
            promo_code: promoCode ?? null,
            promo_discount: promoDiscount ?? null,
            payment_method: 'stripe',
          },
        })
        await posthog.shutdown()
      }

      // Créditer les points de fidélité (1 point par euro dépensé — userId vérifié côté serveur)
      if (order && resolvedUserId) {
        const pointsToCredit = Math.floor(subtotal)
        if (pointsToCredit > 0) {
          await supabaseAdmin
            .from('loyalty_points')
            .insert({
              user_id: resolvedUserId,
              points: pointsToCredit,
              reason: `Commande #${order.order_number}`,
              order_id: order.id,
            })
            .then(({ error }) => {
              if (error) console.error('Error crediting loyalty points:', error)
            })
        }
      }

      // Envoyer l'email de confirmation au client + notification à l'admin
      if (order && session.customer_email) {
        const total = session.amount_total ? session.amount_total / 100 : subtotal + shippingCost
        const customerName = shippingData?.name || session.customer_email

        await Promise.all([
          sendOrderConfirmationEmail(
            session.customer_email,
            order.order_number,
            orderItemsForEmail,
            shippingData,
            subtotal,
            shippingCost,
            total,
            shippingMethodTitle
          ),
          sendAdminOrderNotification({
            orderNumber: order.order_number,
            customerName,
            customerEmail: session.customer_email,
            total,
            itemCount: orderItemsForEmail.length,
          }),
        ])

        // Programmer l'email de réachat J+30 (non-bloquant)
        const reorderScheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        supabaseAdmin.from('post_purchase_emails').insert({
          order_id: order.id,
          email_type: 'reorder_suggestion',
          email: session.customer_email,
          scheduled_for: reorderScheduledFor,
          status: 'pending',
        }).then(({ error }) => {
          if (error) console.error('Error scheduling reorder email:', error)
        })
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 })
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    // Traiter uniquement les paiements express checkout (pas les sessions Stripe Checkout normales)
    if (paymentIntent.metadata?.source !== 'express_checkout') {
      return NextResponse.json({ received: true })
    }

    try {
      // IDEMPOTENCE: vérifier si ce payment intent a déjà été traité
      const { data: existingOrder } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent', paymentIntent.id)
        .maybeSingle()

      if (existingOrder) {
        console.log('Express checkout déjà traité:', paymentIntent.id)
        return NextResponse.json({ received: true })
      }

      const metadata = paymentIntent.metadata || {}
      const shippingData = metadata.shipping ? JSON.parse(metadata.shipping) : null
      const rawItems = metadata.items ? JSON.parse(metadata.items) : []
      const shippingMethodId = metadata.shippingMethodId || null
      const shippingMethodTitle = metadata.shippingMethodTitle || 'Livraison à domicile'
      const promoCode = metadata.promoCodeCode || null
      const promoDiscount = metadata.promoCodeDiscount ? parseFloat(metadata.promoCodeDiscount) : null

      const customerEmail: string | null = shippingData?.email || null

      // SÉCURITÉ: résoudre le userId depuis l'email (jamais faire confiance au client)
      let resolvedUserId: string | null = null
      if (customerEmail) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle()
        if (profile) resolvedUserId = profile.id
      }

      const productIds = rawItems.map((item: { id: string }) => item.id)
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images')
        .in('id', productIds)

      const productMap = new Map(products?.map(p => [p.id, p]) || [])

      const subtotal = rawItems.reduce((sum: number, item: { p: number; q: number }) =>
        sum + item.p * item.q, 0
      )
      const shippingCost = metadata.shippingCost ? parseFloat(metadata.shippingCost) : 0

      // Créer la commande
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: resolvedUserId,
          status: 'confirmed',
          subtotal,
          shipping: shippingCost,
          discount: promoDiscount,
          promo_code: promoCode,
          total: paymentIntent.amount / 100,
          shipping_address: shippingData,
          shipping_method: shippingMethodTitle,
          shipping_method_id: shippingMethodId,
          payment_method: 'stripe',
          payment_status: 'completed',
          stripe_session_id: null,
          stripe_payment_intent: paymentIntent.id,
          customer_email: customerEmail,
          customer_name: shippingData?.name || null,
        })
        .select()
        .single()

      if (orderError) {
        console.error('Express checkout — error creating order:', orderError)
        throw orderError
      }

      const orderItemsForEmail: Array<{ product_name: string; size: string; quantity: number; price: number }> = []

      if (rawItems.length > 0 && order) {
        const orderItems = rawItems.map((item: { id: string; s: string; q: number; p: number }) => {
          const product = productMap.get(item.id)
          const orderItem = {
            order_id: order.id,
            product_id: item.id,
            product_name: product?.name || 'Produit',
            product_image: product?.images?.[0] || '',
            size: item.s,
            quantity: item.q,
            price: item.p * item.q,
          }
          orderItemsForEmail.push({
            product_name: orderItem.product_name,
            size: orderItem.size,
            quantity: orderItem.quantity,
            price: orderItem.price,
          })
          return orderItem
        })

        const { error: itemsError } = await supabaseAdmin
          .from('order_items')
          .insert(orderItems)

        if (itemsError) console.error('Express checkout — error creating order items:', itemsError)

        // Déduire le stock (unités + ml) pour chaque article commandé
        for (const item of rawItems as Array<{ id: string; s: string; q: number }>) {
          const { data: prod } = await supabaseAdmin
            .from('products')
            .select('stock, ml_stock')
            .eq('id', item.id)
            .maybeSingle()

          if (prod) {
            const mlPerUnit = parseFloat((item.s || '').replace(',', '.').match(/([\d.]+)\s*ml/i)?.[1] || '0')
            const mlDeducted = mlPerUnit * item.q
            const updates: Record<string, number> = {}
            if (prod.stock !== null) updates.stock = Math.max(0, prod.stock - item.q)
            if (prod.ml_stock !== null && mlDeducted > 0) updates.ml_stock = Math.max(0, prod.ml_stock - mlDeducted)
            if (Object.keys(updates).length > 0) {
              await supabaseAdmin.from('products').update(updates).eq('id', item.id)
            }
          }
        }
      }

      console.log('Express checkout order created:', order?.order_number)

      if (order) {
        const posthog = getPostHogClient()
        const distinctId = resolvedUserId ?? (customerEmail ?? paymentIntent.id)
        posthog.capture({
          distinctId,
          event: 'order_created',
          properties: {
            order_number: order.order_number,
            order_id: order.id,
            subtotal,
            shipping_cost: shippingCost,
            total: paymentIntent.amount / 100,
            item_count: rawItems.length,
            shipping_method: shippingMethodTitle,
            promo_code: promoCode ?? null,
            promo_discount: promoDiscount ?? null,
            payment_method: 'stripe',
            source: 'express_checkout',
          },
        })
        await posthog.shutdown()
      }

      if (order && resolvedUserId) {
        const pointsToCredit = Math.floor(subtotal)
        if (pointsToCredit > 0) {
          await supabaseAdmin
            .from('loyalty_points')
            .insert({
              user_id: resolvedUserId,
              points: pointsToCredit,
              reason: `Commande #${order.order_number}`,
              order_id: order.id,
            })
            .then(({ error }) => {
              if (error) console.error('Express checkout — error crediting loyalty points:', error)
            })
        }
      }

      if (order && customerEmail) {
        const total = paymentIntent.amount / 100
        const customerName = shippingData?.name || customerEmail

        await Promise.all([
          sendOrderConfirmationEmail(
            customerEmail,
            order.order_number,
            orderItemsForEmail,
            shippingData,
            subtotal,
            shippingCost,
            total,
            shippingMethodTitle
          ),
          sendAdminOrderNotification({
            orderNumber: order.order_number,
            customerName,
            customerEmail,
            total,
            itemCount: orderItemsForEmail.length,
          }),
        ])

        const reorderScheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        supabaseAdmin.from('post_purchase_emails').insert({
          order_id: order.id,
          email_type: 'reorder_suggestion',
          email: customerEmail,
          scheduled_for: reorderScheduledFor,
          status: 'pending',
        }).then(({ error }) => {
          if (error) console.error('Express checkout — error scheduling reorder email:', error)
        })
      }
    } catch (error) {
      console.error('Error processing express checkout webhook:', error)
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 })
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    try {
      const paymentIntentId = typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id

      if (paymentIntentId) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'refunded', payment_status: 'refunded' })
          .eq('stripe_payment_intent', paymentIntentId)
      }
    } catch (error) {
      console.error('Error processing refund webhook:', error)
    }
  }

  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute
    try {
      const paymentIntentId = typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id

      if (paymentIntentId) {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'disputed' })
          .eq('stripe_payment_intent', paymentIntentId)
      }
    } catch (error) {
      console.error('Error processing dispute webhook:', error)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.error('Payment failed for intent:', paymentIntent.id, paymentIntent.last_payment_error?.message)
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: paymentIntent.id,
      event: 'payment_failed',
      properties: {
        payment_intent_id: paymentIntent.id,
        failure_message: paymentIntent.last_payment_error?.message ?? null,
        failure_code: paymentIntent.last_payment_error?.code ?? null,
        amount: paymentIntent.amount ? paymentIntent.amount / 100 : null,
      },
    })
    await posthog.shutdown()
  }

  return NextResponse.json({ received: true })
}
