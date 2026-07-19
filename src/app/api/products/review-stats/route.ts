import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getProductReviewStatsMap } from '@/lib/reviews/public'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Statistiques d'avis groupées pour un lot de produits — une seule requête,
// utilisé par les pages entièrement client-rendues (ex. /promos) qui ne
// peuvent pas récupérer product_review_stats côté serveur.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get('productIds') || ''
  const productIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 200)

  if (productIds.length === 0) {
    return NextResponse.json({ stats: {} })
  }

  const map = await getProductReviewStatsMap(supabase, productIds)
  const stats: Record<string, { avgRating: number; reviewCount: number }> = {}
  for (const [id, s] of map) stats[id] = s

  return NextResponse.json({ stats })
}
