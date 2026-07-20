import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getApprovedReviews, getRatingDistribution } from '@/lib/reviews/public'
import { RatingSummary } from '@/components/reviews/RatingSummary'
import { ReviewListClient } from '@/components/reviews/ReviewListClient'
import { WriteReviewGlobalCTA } from '@/components/reviews/WriteReviewGlobalCTA'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const metadata: Metadata = {
  title: 'Avis clients | Braza Scent',
  description:
    'Découvrez les avis de nos clients sur nos décants premium. Notes, commentaires et retours d\'expérience sur nos parfums de niche.',
  alternates: { canonical: `${SITE_URL}/avis` },
  openGraph: {
    title: 'Avis clients | Braza Scent',
    description: 'Ce que nos clients pensent de nos décants premium — notes et commentaires vérifiés.',
    url: `${SITE_URL}/avis`,
    siteName: 'BrazaScent',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export const revalidate = 86400

export default async function AvisPage() {
  const [{ reviews, total }, distribution] = await Promise.all([
    getApprovedReviews(supabase, { sort: 'recent', limit: 10, offset: 0 }),
    getRatingDistribution(supabase),
  ])

  const totalCount = Object.values(distribution).reduce((sum, c) => sum + c, 0)
  const avgRating = totalCount > 0
    ? Object.entries(distribution).reduce((sum, [star, count]) => sum + Number(star) * count, 0) / totalCount
    : 0

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-background border-b border-border pt-32 lg:pt-40 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-3">Retours clients</p>
          <h1 className="text-3xl lg:text-4xl font-light tracking-[0.12em] uppercase mb-8">Avis clients</h1>
          {totalCount > 0 ? (
            <RatingSummary avgRating={avgRating} totalCount={totalCount} distribution={distribution} size="lg" />
          ) : (
            <p className="text-muted-foreground">Aucun avis pour le moment. Soyez les premiers !</p>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-cream/20 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <WriteReviewGlobalCTA />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {total > 0 && (
          <ReviewListClient
            initialReviews={reviews}
            initialTotal={total}
            initialHasMore={total > reviews.length}
            distribution={distribution}
            showProductLink
            showVerifiedFilter
          />
        )}
      </section>
    </main>
  )
}
