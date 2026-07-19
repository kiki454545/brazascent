import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReorderEmail, sendVerifiedReviewRequestEmail, sendVerifiedReviewReminderEmail } from '@/lib/email'
import {
  getProductsNeedingReview,
  isValidCustomerEmail,
  issueReviewToken,
  extractOrderPhone,
  reviewUrlFor,
} from '@/lib/reviews/review-requests'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function requireCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0] || ''
}

export async function GET(request: NextRequest) {
  try {
    if (!requireCronSecret(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: pending, error: fetchErr } = await supabaseAdmin
      .from('post_purchase_emails')
      .select('id, order_id, email_type, email, reminder_number')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50)

    if (fetchErr) {
      console.error('Error fetching post_purchase_emails:', fetchErr.message)
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
      // Claim atomique : bascule pending → sending seulement si personne d'autre
      // ne l'a déjà pris (protège contre deux exécutions concurrentes du cron).
      const { data: claimed, error: claimError } = await supabaseAdmin
        .from('post_purchase_emails')
        .update({ status: 'sending' })
        .eq('id', row.id)
        .eq('status', 'pending')
        .select('id')

      if (claimError) {
        console.error(`Error claiming post_purchase_email ${row.id}:`, claimError.message)
        continue
      }
      if (!claimed || claimed.length === 0) continue // déjà pris par une autre exécution

      try {
        if (row.email_type === 'review_request') {
          const outcome = await processReviewRequest(row)
          results[outcome]++
        } else if (row.email_type === 'reorder_suggestion') {
          const outcome = await processReorderSuggestion(row)
          results[outcome]++
        } else {
          await markSkipped(row.id, 'unknown_email_type')
          results.skipped++
        }
      } catch (err) {
        console.error(`Error processing post_purchase_email ${row.id}:`, err instanceof Error ? err.message : err)
        await supabaseAdmin
          .from('post_purchase_emails')
          .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'unknown_error' })
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
    console.error('Cron post-purchase-emails error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

type Outcome = 'sent' | 'skipped' | 'failed'

async function processReviewRequest(row: { id: string; order_id: string; email: string; reminder_number: number }): Promise<Outcome> {
  // Filet de sécurité anti-double-envoi : même en l'absence d'une contrainte
  // d'unicité en base, on refuse d'envoyer si un email de cette vague a déjà
  // été effectivement envoyé pour cette commande (couvre le cas de deux
  // lignes 'pending' créées par une course entre exécutions du planificateur).
  const { data: alreadySent } = await supabaseAdmin
    .from('post_purchase_emails')
    .select('id')
    .eq('order_id', row.order_id)
    .eq('email_type', 'review_request')
    .eq('reminder_number', row.reminder_number)
    .eq('status', 'sent')
    .neq('id', row.id)
    .maybeSingle()

  if (alreadySent) {
    await markSkipped(row.id, 'duplicate_already_sent')
    return 'skipped'
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, customer_name, customer_email, shipping_address')
    .eq('id', row.order_id)
    .maybeSingle()

  if (!order || ['cancelled', 'refunded'].includes(order.status)) {
    await markSkipped(row.id, order ? `order_${order.status}` : 'order_not_found')
    return 'skipped'
  }

  const customerEmail = order.customer_email || row.email
  if (!isValidCustomerEmail(customerEmail)) {
    await markSkipped(row.id, 'invalid_or_missing_email')
    return 'skipped'
  }

  const productsNeedingReview = await getProductsNeedingReview(supabaseAdmin, row.order_id)
  if (productsNeedingReview.length === 0) {
    await markSkipped(row.id, 'no_products_remaining')
    return 'skipped'
  }

  const customerPhone = extractOrderPhone(order)
  const firstName = extractFirstName(order.customer_name) || extractFirstName((order.shipping_address as { name?: string } | null)?.name)

  const productsWithLinks = await Promise.all(
    productsNeedingReview.map(async (p) => {
      const rawToken = await issueReviewToken(supabaseAdmin, {
        orderId: row.order_id,
        productId: p.productId,
        customerEmail,
        customerPhone,
      })
      return { name: p.productName, reviewUrl: reviewUrlFor(rawToken) }
    })
  )

  if (row.reminder_number === 1) {
    await sendVerifiedReviewRequestEmail({
      customerEmail,
      firstName,
      orderNumber: order.order_number || order.id,
      products: productsWithLinks,
    })
  } else {
    await sendVerifiedReviewReminderEmail({
      customerEmail,
      firstName,
      orderNumber: order.order_number || order.id,
      products: productsWithLinks,
    })
  }

  // review_token_id reste null dès qu'il concerne plusieurs produits : la
  // relation ligne↔tokens est portée par review_tokens.order_id, pas par
  // cette colonne (voir commentaire du Lot 1) — évite toute incohérence
  // entre "une ligne par commande" et "un token par produit".
  await supabaseAdmin
    .from('post_purchase_emails')
    .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
    .eq('id', row.id)

  return 'sent'
}

async function processReorderSuggestion(row: { id: string; order_id: string; email: string }): Promise<Outcome> {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, customer_name, customer_email, items, shipping_address')
    .eq('id', row.order_id)
    .maybeSingle()

  if (!order || ['cancelled', 'refunded'].includes(order.status)) {
    await markSkipped(row.id, order ? `order_${order.status}` : 'order_not_found')
    return 'skipped'
  }

  const customerEmail = order.customer_email || row.email
  if (!customerEmail) {
    await markSkipped(row.id, 'invalid_or_missing_email')
    return 'skipped'
  }

  const customerName = order.customer_name || (order.shipping_address as Record<string, string> | null)?.name || 'Client'
  const orderNumber = order.order_number || order.id

  const orderItems: Array<{ product_id?: string; name?: string }> = Array.isArray(order.items) ? order.items : []
  const purchasedProductIds = orderItems.map((i) => i.product_id).filter(Boolean) as string[]

  const recommendedProducts = await getRecommendations(purchasedProductIds, customerEmail)

  if (recommendedProducts.length === 0) {
    await markSkipped(row.id, 'no_recommendations')
    return 'skipped'
  }

  await sendReorderEmail({ customerEmail, customerName, orderNumber, products: recommendedProducts })

  await supabaseAdmin
    .from('post_purchase_emails')
    .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
    .eq('id', row.id)

  await supabaseAdmin.from('orders').update({ reorder_email_sent_at: new Date().toISOString() }).eq('id', row.order_id)

  return 'sent'
}

async function markSkipped(id: string, reason: string) {
  await supabaseAdmin
    .from('post_purchase_emails')
    .update({ status: 'skipped', sent_at: new Date().toISOString(), error_message: reason })
    .eq('id', id)
}

async function getRecommendations(purchasedProductIds: string[], customerEmail: string) {
  const { data: purchasedProducts } = purchasedProductIds.length > 0
    ? await supabaseAdmin.from('products').select('brand, category').in('id', purchasedProductIds)
    : { data: [] }

  const brands = [...new Set((purchasedProducts || []).map((p: { brand: string }) => p.brand).filter(Boolean))]
  const categories = [...new Set((purchasedProducts || []).map((p: { category: string }) => p.category).filter(Boolean))]

  const { data: allOrders } = await supabaseAdmin
    .from('orders')
    .select('items')
    .eq('customer_email', customerEmail)
    .not('status', 'in', '("cancelled","refunded")')

  const alreadyPurchasedIds = new Set<string>()
  for (const o of allOrders || []) {
    const items: Array<{ product_id?: string }> = Array.isArray(o.items) ? o.items : []
    items.forEach((i) => { if (i.product_id) alreadyPurchasedIds.add(i.product_id) })
  }

  const { data: candidates } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, brand, category, price, images, stock, featured')
    .eq('is_active', true)
    .gt('stock', 0)
    .limit(100)

  if (!candidates) return []

  const scored = candidates
    .filter((p) => !alreadyPurchasedIds.has(p.id))
    .map((p) => {
      let score = 0
      if (brands.includes(p.brand)) score += 30
      if (categories.includes(p.category)) score += 20
      if (p.featured) score += 8
      score += Math.random() * 3
      return { ...p, score }
    })

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, 3).map((p) => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: p.price,
    image: Array.isArray(p.images) ? p.images[0] : undefined,
  }))
}
