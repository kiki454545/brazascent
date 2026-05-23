import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReviewRequestEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Envoyer la demande d'avis 7 jours après livraison
const DAYS_AFTER_DELIVERY = 7

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    // Commandes livrées depuis >= 7 jours sans email d'avis envoyé
    const deliveryThreshold = new Date(
      Date.now() - DAYS_AFTER_DELIVERY * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data: orders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        customer_email,
        customer_name,
        items,
        delivered_at,
        review_email_sent_at
      `)
      .eq('status', 'delivered')
      .is('review_email_sent_at', null)
      .lte('delivered_at', deliveryThreshold)
      .not('customer_email', 'is', null)
      .limit(50)

    if (fetchError) {
      console.error('Error fetching delivered orders:', fetchError)
      return NextResponse.json({ error: 'Erreur récupération commandes' }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, message: 'Aucune commande à traiter', processed: 0 })
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
      message: `${results.emailsSent} emails envoyés sur ${orders.length} commandes livrées`,
      ...results,
    })
  } catch (error) {
    console.error('Cron review-requests error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
