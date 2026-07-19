import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

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

// Réponse boutique à un avis — modifiable (renvoyer met à jour la réponse existante).
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { id?: string; response?: string } | null
  if (!body?.id || !body.response?.trim()) {
    return NextResponse.json({ error: 'Réponse requise' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: review, error } = await supabase
    .from('product_reviews')
    .update({
      shop_response: body.response.trim(),
      shop_response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select('product_id')
    .maybeSingle()

  if (error || !review) {
    return NextResponse.json({ error: "Avis introuvable ou erreur d'enregistrement" }, { status: 404 })
  }

  const { data: product } = await supabase.from('products').select('slug').eq('id', review.product_id).maybeSingle()
  if (product?.slug) {
    revalidatePath(`/parfum/${product.slug}`)
  }

  return NextResponse.json({ success: true })
}
