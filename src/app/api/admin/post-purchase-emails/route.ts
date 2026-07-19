import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getProductsNeedingReview } from '@/lib/reviews/review-requests'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return false

    const { data: { user }, error } = await adminClient().auth.getUser(token)
    if (error || !user) return false

    const { data: profile } = await adminClient()
      .from('user_profiles').select('is_admin').eq('id', user.id).single()
    return profile?.is_admin === true
  } catch { return false }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const supabase = adminClient()
  const { data: emails, error } = await supabase
    .from('post_purchase_emails')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Produits encore sans avis calculés à la demande (jamais figés en base) —
  // pertinent uniquement pour les lignes review_request encore actionnables.
  const reviewRequestOrderIds = [...new Set(
    (emails || [])
      .filter((e) => e.email_type === 'review_request' && ['pending', 'sending', 'sent'].includes(e.status))
      .map((e) => e.order_id)
  )]

  const remainingByOrderId = new Map<string, { name: string; slug: string }[]>()
  await Promise.all(
    reviewRequestOrderIds.map(async (orderId) => {
      const products = await getProductsNeedingReview(supabase, orderId)
      remainingByOrderId.set(orderId, products.map((p) => ({ name: p.productName, slug: p.productSlug })))
    })
  )

  const enriched = (emails || []).map((e) => ({
    ...e,
    remaining_products: e.email_type === 'review_request' ? remainingByOrderId.get(e.order_id) || [] : undefined,
  }))

  return NextResponse.json({ emails: enriched })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id, action, reason } = await request.json() as { id: string; action: string; reason?: string }
  const supabase = adminClient()

  if (action === 'retry') {
    const { error } = await supabase
      .from('post_purchase_emails')
      .update({ status: 'pending', error_message: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'skip') {
    const { error } = await supabase
      .from('post_purchase_emails')
      .update({ status: 'skipped', sent_at: new Date().toISOString(), error_message: reason?.trim() || 'skipped_manually_by_admin' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
