import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { issueReviewToken, extractOrderPhone, reviewUrlFor } from '@/lib/reviews/review-requests'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const { data: { user }, error } = await adminClient().auth.getUser(token)
  if (error || !user) return null
  return user
}

interface EligibleProduct {
  orderId: string
  productId: string
  productName: string
  productSlug: string
}

async function findEligibleProducts(userId: string, email: string | undefined): Promise<EligibleProduct[]> {
  const supabase = adminClient()

  let query = supabase
    .from('orders')
    .select('id, user_id, customer_email, status')
    .not('status', 'in', '("cancelled","refunded")')

  query = email ? query.or(`user_id.eq.${userId},customer_email.eq.${email}`) : query.eq('user_id', userId)

  const { data: orders } = await query
  if (!orders || orders.length === 0) return []

  const orderIds = orders.map((o) => o.id)

  const [{ data: items }, { data: existingReviews }] = await Promise.all([
    supabase.from('order_items').select('order_id, product_id, product_name').in('order_id', orderIds),
    supabase.from('product_reviews').select('order_id, product_id').in('order_id', orderIds),
  ])

  const reviewed = new Set((existingReviews || []).map((r) => `${r.order_id}:${r.product_id}`))
  const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))]
  const { data: products } = productIds.length
    ? await supabase.from('products').select('id, slug').in('id', productIds)
    : { data: [] as { id: string; slug: string }[] }
  const slugByProductId = new Map((products || []).map((p) => [p.id, p.slug]))

  const seen = new Set<string>()
  const result: EligibleProduct[] = []
  for (const item of items || []) {
    if (!item.product_id) continue
    const key = `${item.order_id}:${item.product_id}`
    if (reviewed.has(key) || seen.has(key)) continue
    const slug = slugByProductId.get(item.product_id)
    if (!slug) continue
    seen.add(key)
    result.push({ orderId: item.order_id, productId: item.product_id, productName: item.product_name || 'Parfum', productSlug: slug })
  }
  return result
}

// Liste des produits achetés par l'utilisateur connecté n'ayant pas encore
// d'avis — jamais l'intégralité du catalogue, uniquement ce qu'il a réellement acheté.
export async function GET(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const products = await findEligibleProducts(user.id, user.email)
  return NextResponse.json({ products })
}

// Émet (ou réémet) un token de review pour un produit réellement acheté par
// l'utilisateur connecté, puis renvoie le lien vers /avis/laisser. Réutilise
// exactement la même logique que le parcours automatique (Lot 4) — aucun
// insert direct dans product_reviews.
export async function POST(request: NextRequest) {
  const user = await requireUser(request)
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json().catch(() => null) as { orderId?: string; productId?: string } | null
  if (!body?.orderId || !body.productId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const eligible = await findEligibleProducts(user.id, user.email)
  const match = eligible.find((p) => p.orderId === body.orderId && p.productId === body.productId)
  if (!match) {
    return NextResponse.json({ error: "Ce produit n'est pas éligible à un avis pour votre compte." }, { status: 403 })
  }

  const supabase = adminClient()
  const { data: order } = await supabase
    .from('orders')
    .select('customer_email, shipping_address')
    .eq('id', body.orderId)
    .maybeSingle()

  const customerEmail = order?.customer_email || user.email
  if (!customerEmail) {
    return NextResponse.json({ error: 'Email introuvable pour cette commande.' }, { status: 400 })
  }

  const rawToken = await issueReviewToken(supabase, {
    orderId: body.orderId,
    productId: body.productId,
    customerEmail,
    customerPhone: extractOrderPhone(order),
  })

  return NextResponse.json({ reviewUrl: reviewUrlFor(rawToken) })
}
