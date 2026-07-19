'use client'

import { useState, useCallback, useRef } from 'react'
import { Loader2, Star } from 'lucide-react'
import { PublicReview, ReviewSort } from '@/lib/reviews/public'
import { ReviewCard } from './ReviewCard'
import { ReviewFilters } from './ReviewFilters'

interface ReviewListClientProps {
  productId?: string
  initialReviews: PublicReview[]
  initialTotal: number
  initialHasMore: boolean
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>
  showProductLink?: boolean
  showVerifiedFilter?: boolean
}

// Hydraté avec les données déjà rendues côté serveur (aucune requête au
// montage) — ne fetch /api/reviews que lorsque l'utilisateur change le tri,
// le filtre, ou demande la page suivante.
export function ReviewListClient({
  productId,
  initialReviews,
  initialTotal,
  initialHasMore,
  distribution,
  showProductLink = false,
  showVerifiedFilter = false,
}: ReviewListClientProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [minRating, setMinRating] = useState(0)
  const [withPhotosOnly, setWithPhotosOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  const fetchReviews = useCallback(
    async (nextPage: number, append: boolean, overrides?: { sort?: ReviewSort; minRating?: number; withPhotosOnly?: boolean; verifiedOnly?: boolean }) => {
      const id = ++requestId.current
      setLoading(true)

      const params = new URLSearchParams()
      if (productId) params.set('productId', productId)
      params.set('sort', overrides?.sort ?? sort)
      const effectiveMinRating = overrides?.minRating ?? minRating
      if (effectiveMinRating > 0) params.set('minRating', String(effectiveMinRating))
      if (overrides?.withPhotosOnly ?? withPhotosOnly) params.set('withPhotos', '1')
      if (overrides?.verifiedOnly ?? verifiedOnly) params.set('verifiedOnly', '1')
      params.set('page', String(nextPage))

      const res = await fetch(`/api/reviews?${params.toString()}`)
      const body = await res.json().catch(() => null)

      if (id !== requestId.current) return // réponse obsolète (changement rapide de filtre)

      setReviews((prev) => (append ? [...prev, ...(body?.reviews || [])] : body?.reviews || []))
      setTotal(body?.total ?? 0)
      setHasMore(!!body?.hasMore)
      setLoading(false)
    },
    [productId, sort, minRating, withPhotosOnly, verifiedOnly]
  )

  const applyFilterChange = (overrides: { sort?: ReviewSort; minRating?: number; withPhotosOnly?: boolean; verifiedOnly?: boolean }) => {
    if (overrides.sort !== undefined) setSort(overrides.sort)
    if (overrides.minRating !== undefined) setMinRating(overrides.minRating)
    if (overrides.withPhotosOnly !== undefined) setWithPhotosOnly(overrides.withPhotosOnly)
    if (overrides.verifiedOnly !== undefined) setVerifiedOnly(overrides.verifiedOnly)
    setPage(0)
    fetchReviews(0, false, overrides)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchReviews(next, true)
  }

  return (
    <div>
      <ReviewFilters
        sort={sort}
        onSortChange={(v) => applyFilterChange({ sort: v })}
        minRating={minRating}
        onMinRatingChange={(v) => applyFilterChange({ minRating: v })}
        withPhotosOnly={withPhotosOnly}
        onWithPhotosOnlyChange={(v) => applyFilterChange({ withPhotosOnly: v })}
        verifiedOnly={showVerifiedFilter ? verifiedOnly : undefined}
        onVerifiedOnlyChange={showVerifiedFilter ? (v) => applyFilterChange({ verifiedOnly: v }) : undefined}
        distribution={distribution}
      />

      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border">
          <Star className="w-10 h-10 text-border mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun avis ne correspond à ces filtres.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-6 uppercase tracking-[0.1em]">
            {total === 1 ? '1 avis' : `${total} avis`}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} showProductLink={showProductLink} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 border border-foreground text-sm tracking-[0.1em] uppercase hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Voir plus d&apos;avis
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
