import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReviewRequestEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SELECT_FIELDS = `id, order_number, customer_email, customer_name, items, delivered_at, review_email_sent_at`

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    const now = Date.now()
    const deliveryThreshold = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const paidThreshold     = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()

    // Requête 1 : statut delivered depuis >= 7j
    const { data: deliveredOrders, error: err1 } = await supabaseAdmin
      .from('orders')
      .select(SELECT_FIELDS)
      .eq('status', 'delivered')
      .is('review_email_sent_at', null)
      .lte('delivered_at', deliveryThreshold)
      .not('customer_email', 'is', null)
      .limit(50)

    if (err1) {
      console.error('Error fetching delivered orders:', err1)
      return NextResponse.json({ error: 'Erreur récupération commandes (delivered)' }, { status: 500 })
    }

    // Requête 2 : payée depuis >= 10j, pas annulée/remboursée
    const { data: paidOrders, error: err2 } = await supabaseAdmin
      .from('orders')
      .select(SELECT_FIELDS)
      .is('review_email_sent_at', null)
      .lte('created_at', paidThreshold)
      .eq('payment_status', 'completed')
      .not('status', 'in', '("cancelled","refunded")')
      .not('customer_email', 'is', null)
      .limit(50)

    if (err2) {
      console.error('Error fetching paid orders:', err2)
      return NextResponse.json({ error: 'Erreur récupération commandes (paid)' }, { status: 500 })
    }

    // Fusion + déduplication par ID
    const seen = new Set<string>()
    const orders = [...(deliveredOrders || []), ...(paidOrders || [])].filter(o => {
      if (seen.has(o.id)) return false
      seen.add(o.id)
      return true
    })

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucune commande à traiter',
        reviewsSent: 0,
      })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: true,
        message: `[MODE DÉMO] ${orders.length} demandes d'avis à envoyer. Configurez RESEND_API_KEY.`,
        processed: orders.length,
        demo: true,
      })
    }

    const results = { processed: 0, emailsSent: 0, errors: [] as string[] }

    for (const order of orders) {
      try {
        // Extraire les produits de la commande (items est un JSON array)
        const items: Array<{ name?: string; product_name?: string; slug?: string; product_slug?: string; image?: string }> =
          Array.isArray(order.items) ? order.items : []

        const products = items.map(item => ({
          name: item.name || item.product_name || 'Parfum',
          slug: item.slug || item.product_slug || '',
          image: item.image,
        })).filter(p => p.slug)

        if (products.length === 0) {
          // Pas de produits identifiables, marquer quand même pour ne pas retenter
          await supabaseAdmin
            .from('orders')
            .update({ review_email_sent_at: new Date().toISOString() })
            .eq('id', order.id)
          results.processed++
          continue
        }

        await sendReviewRequestEmail({
          customerEmail: order.customer_email,
          customerName: order.customer_name || 'Client',
          orderNumber: order.order_number || order.id,
          products,
        })

        await supabaseAdmin
          .from('orders')
          .update({ review_email_sent_at: new Date().toISOString() })
          .eq('id', order.id)

        results.emailsSent++
        results.processed++
      } catch (err) {
        console.error('Error processing order:', err)
        results.errors.push(`Erreur commande ${order.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.emailsSent} demande${results.emailsSent > 1 ? 's' : ''} d'avis envoyée${results.emailsSent > 1 ? 's' : ''}.`,
      reviewsSent: results.emailsSent,
    })
  } catch (error) {
    console.error('Cron review-requests error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
