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

interface RouteContext {
  params: Promise<{ id: string }>
}

// Suppression DÉFINITIVE d'un avis — action séparée du refus normal (qui ne
// supprime jamais rien). Purge d'abord les fichiers Storage réellement
// référencés (privés et/ou publics), puis la ligne product_reviews
// (cascade sur review_photos). Les échecs de suppression Storage sont
// journalisés et renvoyés plutôt que masqués — pas de nettoyage automatique
// des orphelins, volontairement, pour un cas admin rare.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const supabase = adminClient()

  const { data: review, error: fetchError } = await supabase
    .from('product_reviews')
    .select('id, product_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !review) {
    return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 })
  }

  const { data: photos } = await supabase
    .from('review_photos')
    .select('private_storage_path, public_storage_path')
    .eq('review_id', id)

  const privatePaths = (photos || []).map((p) => p.private_storage_path).filter((p): p is string => !!p)
  const publicPaths = (photos || []).map((p) => p.public_storage_path).filter((p): p is string => !!p)

  const orphaned: string[] = []

  if (privatePaths.length > 0) {
    const { error } = await supabase.storage.from('review-uploads').remove(privatePaths)
    if (error) orphaned.push(...privatePaths.map((p) => `review-uploads/${p}`))
  }
  if (publicPaths.length > 0) {
    const { error } = await supabase.storage.from('review-photos').remove(publicPaths)
    if (error) orphaned.push(...publicPaths.map((p) => `review-photos/${p}`))
  }

  const { error: deleteError } = await supabase.from('product_reviews').delete().eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message, orphanedFiles: orphaned }, { status: 500 })
  }

  const { data: product } = await supabase.from('products').select('slug').eq('id', review.product_id).maybeSingle()
  if (product?.slug) {
    revalidatePath(`/parfum/${product.slug}`)
  }
  revalidatePath('/avis')

  return NextResponse.json({ success: true, orphanedFiles: orphaned })
}
