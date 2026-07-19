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

// Relance manuelle d'une copie photo privé → public en échec.
// Idempotent : si la photo est déjà approuvée (ex. double-clic), aucun retraitement.
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { photoId?: string } | null
  if (!body?.photoId) {
    return NextResponse.json({ error: 'photoId requis' }, { status: 400 })
  }

  const result = await copyReviewPhotoToPublic(body.photoId)

  if (result.success) {
    const supabase = adminClient()
    const { data: photo } = await supabase
      .from('review_photos')
      .select('review_id')
      .eq('id', body.photoId)
      .maybeSingle()

    if (photo?.review_id) {
      const { data: review } = await supabase
        .from('product_reviews')
        .select('product_id')
        .eq('id', photo.review_id)
        .maybeSingle()
      if (review?.product_id) {
        const { data: product } = await supabase.from('products').select('slug').eq('id', review.product_id).maybeSingle()
        if (product?.slug) revalidatePath(`/parfum/${product.slug}`)
      }
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, error: result.error }, { status: 500 })
}
