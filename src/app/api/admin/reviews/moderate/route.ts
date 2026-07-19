import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { copyReviewPhotoToPublic } from '@/lib/reviews/copy-photo'

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
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    return profile?.is_admin === true
  } catch {
    return false
  }
}

async function revalidateProductPage(supabase: ReturnType<typeof adminClient>, productId: string) {
  const { data: product } = await supabase.from('products').select('slug').eq('id', productId).maybeSingle()
  if (product?.slug) {
    revalidatePath(`/parfum/${product.slug}`)
  }
  revalidatePath('/avis')
}

// Approbation/refus d'un avis — jamais de suppression. L'approbation
// déclenche la copie privé → public des photos encore en attente et
// revalide la fiche produit (ISR) pour que l'avis apparaisse sans délai.
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    id?: string
    action?: 'approve' | 'reject'
    rejectedReason?: string
  } | null

  if (!body?.id || !body.action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: review, error: fetchError } = await supabase
    .from('product_reviews')
    .select('id, product_id')
    .eq('id', body.id)
    .maybeSingle()

  if (fetchError || !review) {
    return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 })
  }

  if (body.action === 'approve') {
    const { error: updateError } = await supabase
      .from('product_reviews')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', body.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    const { data: photos } = await supabase
      .from('review_photos')
      .select('id')
      .eq('review_id', body.id)
      .eq('status', 'pending')

    const copyResults = await Promise.all(
      (photos || []).map((p) => copyReviewPhotoToPublic(p.id))
    )
    const photoCopyFailures = copyResults.filter((r) => !r.success).length

    await revalidateProductPage(supabase, review.product_id)

    return NextResponse.json({ success: true, status: 'approved', photoCopyFailures })
  }

  if (body.action === 'reject') {
    const { error: updateError } = await supabase
      .from('product_reviews')
      .update({
        status: 'rejected',
        rejected_reason: body.rejectedReason?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Un avis refusé n'a jamais été public — pas de revalidation nécessaire.
    return NextResponse.json({ success: true, status: 'rejected' })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
