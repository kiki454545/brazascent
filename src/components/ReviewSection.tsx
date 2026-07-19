import { createClient } from '@supabase/supabase-js'
import { getApprovedReviews, getRatingDistribution, getProductReviewStatsMap } from '@/lib/reviews/public'
import { RatingSummary } from '@/components/reviews/RatingSummary'
import { ReviewListClient } from '@/components/reviews/ReviewListClient'
import { WriteReviewCTA } from '@/components/reviews/WriteReviewCTA'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ReviewSectionProps {
  productId: string
}

// Server Component : la note moyenne, la répartition et la première page
// d'avis sont déjà présentes dans le HTML servi — aucune hydratation client
// nécessaire pour le rendu initial. Seuls le tri/filtre et le bouton
// "Laisser un avis" sont interactifs (petits composants client isolés).
export default async function ReviewSection({ productId }: ReviewSectionProps) {
  const [{ reviews, total }, distribution, statsMap] = await Promise.all([
    getApprovedReviews(supabase, { productId, sort: 'recent', limit: 10, offset: 0 }),
    getRatingDistribution(supabase, productId),
    getProductReviewStatsMap(supabase, [productId]),
  ])

  const stats = statsMap.get(productId)

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="px-6 sm:px-10 lg:px-20 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-4">Avis clients</h2>
            {stats && stats.reviewCount > 0 ? (
              <RatingSummary avgRating={stats.avgRating} totalCount={stats.reviewCount} distribution={distribution} />
            ) : (
              <p className="text-muted-foreground text-sm">Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
            )}
          </div>
          <WriteReviewCTA productId={productId} />
        </div>

        {total > 0 && (
          <ReviewListClient
            productId={productId}
            initialReviews={reviews}
            initialTotal={total}
            initialHasMore={total > reviews.length}
            distribution={distribution}
          />
        )}
      </div>
    </section>
  )
}
