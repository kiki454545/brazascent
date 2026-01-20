import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

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
  shippingMethod: string
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
          <strong>${item.product_name}</strong><br>
          <span style="color: #666; font-size: 14px;">Taille: ${item.size}</span>
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
                    Livraison ${shippingMethod === 'express' ? '(Express)' : '(Standard)'}
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
                  ${shippingData.name}<br>
                  ${shippingData.address}
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
      const promoCode = metadata.promoCodeCode || null
      const promoDiscount = metadata.promoCodeDiscount ? parseFloat(metadata.promoCodeDiscount) : null

      // Récupérer les infos produits depuis la BDD pour avoir les noms et images
      const productIds = rawItems.map((item: { id: string }) => item.id)
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name, images')
        .in('id', productIds)

      const productMap = new Map(products?.map(p => [p.id, p]) || [])

      // Récupérer les paramètres de livraison depuis l'admin
      let shippingSettings = {
        freeShippingThreshold: 150,
        standardShippingPrice: 5,
        expressShippingPrice: 14.90,
      }
      try {
        const { data: settingsData } = await supabaseAdmin
          .from('settings')
          .select('value')
          .eq('key', 'shipping')
          .single()
        if (settingsData?.value) {
          const sv = settingsData.value as typeof shippingSettings
          shippingSettings = {
            freeShippingThreshold: sv.freeShippingThreshold ?? 150,
            standardShippingPrice: sv.standardShippingPrice ?? 5,
            expressShippingPrice: sv.expressShippingPrice ?? 14.90,
          }
        }
      } catch {
        // Utiliser les valeurs par défaut si erreur
      }

      // Calculer le sous-total avec les prix vérifiés
      const subtotal = rawItems.reduce((sum: number, item: { p: number; q: number }) =>
        sum + item.p * item.q, 0
      )
      const shippingCost = subtotal >= shippingSettings.freeShippingThreshold
        ? 0
        : shippingMethod === 'express'
          ? shippingSettings.expressShippingPrice
          : shippingSettings.standardShippingPrice

      // Créer la commande dans Supabase
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          user_id: userId || null,
          status: 'confirmed',
          subtotal: subtotal,
          shipping: shippingCost,
          discount: promoDiscount,
          promo_code: promoCode,
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
          // Préparer les données pour l'email
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
      }

      console.log('Order created successfully:', order?.order_number)

      // Envoyer l'email de confirmation
      if (order && session.customer_email) {
        const total = session.amount_total ? session.amount_total / 100 : subtotal + shippingCost
        await sendOrderConfirmationEmail(
          session.customer_email,
          order.order_number,
          orderItemsForEmail,
          shippingData,
          subtotal,
          shippingCost,
          total,
          shippingMethod
        )
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: 'Error processing order' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
