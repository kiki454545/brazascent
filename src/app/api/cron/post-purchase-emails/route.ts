import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReorderEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    // Fetch pending emails whose scheduled_for is now in the past
    const { data: pending, error: fetchErr } = await supabaseAdmin
      .from('post_purchase_emails')
      .select('id, order_id, email_type, email')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50)

    if (fetchErr) {
      console.error('Error fetching post_purchase_emails:', fetchErr)
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ success: true, message: 'Aucun email en attente', processed: 0 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: true,
        message: `[MODE DÉMO] ${pending.length} emails post-achat en attente. Configurez RESEND_API_KEY.`,
        demo: true,
      })
    }

    const results = { sent: 0, skipped: 0, failed: 0 }

    for (const row of pending) {
      try {
        // Fetch the order to check status and get items
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id, order_number, status, customer_name, customer_email, items, shipping_address')
          .eq('id', row.order_id)
          .maybeSingle()

        // Skip if order cancelled / refunded / email missing
        if (!order || ['cancelled', 'refunded'].includes(order.status)) {
          await supabaseAdmin
            .from('post_purchase_emails')
            .update({ status: 'skipped', sent_at: new Date().toISOString() })
            .eq('id', row.id)
          results.skipped++
          continue
        }

        const customerEmail = order.customer_email || row.email
        if (!customerEmail) {
          await markSkipped(row.id)
          results.skipped++
          continue
        }

        const customerName = order.customer_name || (order.shipping_address as Record<string, string> | null)?.name || 'Client'
        const orderNumber = order.order_number || order.id

        if (row.email_type === 'reorder_suggestion') {
          // Fetch product recommendations based on order items
          const orderItems: Array<{ product_id?: string; name?: string }> = Array.isArray(order.items) ? order.items : []
          const purchasedProductIds = orderItems.map(i => i.product_id).filter(Boolean) as string[]

          const recommendedProducts = await getRecommendations(purchasedProductIds, customerEmail)

          if (recommendedProducts.length === 0) {
            await markSkipped(row.id)
            results.skipped++
            continue
          }

          await sendReorderEmail({
            customerEmail,
            customerName,
            orderNumber,
            products: recommendedProducts,
          })

          await supabaseAdmin
            .from('post_purchase_emails')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', row.id)

          // Also flag on orders table for reference
          await supabaseAdmin
            .from('orders')
            .update({ reorder_email_sent_at: new Date().toISOString() })
            .eq('id', row.order_id)

          results.sent++
        } else {
          await markSkipped(row.id)
          results.skipped++
        }
      } catch (err) {
        console.error(`Error processing post_purchase_email ${row.id}:`, err)
        await supabaseAdmin
          .from('post_purchase_emails')
          .update({ status: 'failed', error_message: String(err) })
          .eq('id', row.id)
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Emails post-achat — envoyés: ${results.sent}, ignorés: ${results.skipped}, échecs: ${results.failed}`,
      ...results,
    })
  } catch (error) {
    console.error('Cron post-purchase-emails error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function markSkipped(id: string) {
  await supabaseAdmin
    .from('post_purchase_emails')
    .update({ status: 'skipped', sent_at: new Date().toISOString() })
    .eq('id', id)
}

async function getRecommendations(purchasedProductIds: string[], customerEmail: string) {
  // Find brands from past purchases
  const { data: purchasedProducts } = purchasedProductIds.length > 0
    ? await supabaseAdmin
        .from('products')
        .select('brand, category')
        .in('id', purchasedProductIds)
    : { data: [] }

  const brands = [...new Set((purchasedProducts || []).map((p: { brand: string }) => p.brand).filter(Boolean))]
  const categories = [...new Set((purchasedProducts || []).map((p: { category: string }) => p.category).filter(Boolean))]

  // Find all orders from this customer to exclude already-purchased products
  const { data: allOrders } = await supabaseAdmin
    .from('orders')
    .select('items')
    .eq('customer_email', customerEmail)
    .not('status', 'in', '("cancelled","refunded")')

  const alreadyPurchasedIds = new Set<string>()
  for (const o of allOrders || []) {
    const items: Array<{ product_id?: string }> = Array.isArray(o.items) ? o.items : []
    items.forEach(i => { if (i.product_id) alreadyPurchasedIds.add(i.product_id) })
  }

  // Score products
  const { data: candidates } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, brand, category, price, images, stock, featured')
    .eq('is_active', true)
    .gt('stock', 0)
    .limit(100)

  if (!candidates) return []

  const scored = candidates
    .filter(p => !alreadyPurchasedIds.has(p.id))
    .map(p => {
      let score = 0
      if (brands.includes(p.brand)) score += 30
      if (categories.includes(p.category)) score += 20
      if (p.featured) score += 8
      score += Math.random() * 3
      return { ...p, score }
    })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, 3).map(p => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: p.price,
    image: Array.isArray(p.images) ? p.images[0] : undefined,
  }))
}
