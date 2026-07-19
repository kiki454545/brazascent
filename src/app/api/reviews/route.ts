import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getApprovedReviews, ReviewSort } from '@/lib/reviews/public'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PAGE_SIZE = 10
const VALID_SORTS: ReviewSort[] = ['recent', 'top_rated', 'with_photos']

// Lecture publique des avis approuvés uniquement (tri/filtre/pagination) —
// aucune donnée privée exposée (pas d'email, order_id, téléphone, motif de
// refus). Utilisé par ReviewSection (fiche produit) et la page /avis pour
// les changements de tri/filtre après le rendu serveur initial.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const productId = searchParams.get('productId') || undefined
  const sortParam = searchParams.get('sort') || 'recent'
  const sort: ReviewSort = VALID_SORTS.includes(sortParam as ReviewSort) ? (sortParam as ReviewSort) : 'recent'
  const minRatingParam = searchParams.get('minRating')
  const minRating = minRatingParam ? Number(minRatingParam) : undefined
  const withPhotosOnly = searchParams.get('withPhotos') === '1'
  const verifiedOnly = searchParams.get('verifiedOnly') === '1'
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  if (minRating !== undefined && (!Number.isInteger(minRating) || minRating < 1 || minRating > 5)) {
    return NextResponse.json({ error: 'minRating invalide' }, { status: 400 })
  }

  const { reviews, total } = await getApprovedReviews(supabase, {
    productId,
    sort,
    minRating,
    withPhotosOnly,
    verifiedOnly,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  return NextResponse.json({
    reviews,
    total,
    hasMore: (page + 1) * PAGE_SIZE < total,
  })
}
