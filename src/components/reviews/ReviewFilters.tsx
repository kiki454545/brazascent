'use client'

import { ReviewSort } from '@/lib/reviews/public'

interface ReviewFiltersProps {
  sort: ReviewSort
  onSortChange: (sort: ReviewSort) => void
  minRating: number
  onMinRatingChange: (rating: number) => void
  withPhotosOnly: boolean
  onWithPhotosOnlyChange: (value: boolean) => void
  verifiedOnly?: boolean
  onVerifiedOnlyChange?: (value: boolean) => void
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>
}

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'top_rated', label: 'Mieux notés' },
  { value: 'with_photos', label: 'Avec photos' },
]

export function ReviewFilters({
  sort,
  onSortChange,
  minRating,
  onMinRatingChange,
  withPhotosOnly,
  onWithPhotosOnlyChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  distribution,
}: ReviewFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSortChange(s.value)}
            className={`px-3 py-1.5 text-xs border transition-colors ${
              sort === s.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onMinRatingChange(0)}
          className={`px-3 py-1.5 text-xs border transition-colors ${
            minRating === 0
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          Toutes notes
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => onMinRatingChange(star)}
            className={`px-3 py-1.5 text-xs border transition-colors ${
              minRating === star
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {star} ★{distribution ? ` (${distribution[star as 1 | 2 | 3 | 4 | 5] ?? 0})` : ''}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

      <button
        onClick={() => onWithPhotosOnlyChange(!withPhotosOnly)}
        className={`px-3 py-1.5 text-xs border transition-colors ${
          withPhotosOnly
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
        }`}
      >
        Avec photos
      </button>

      {onVerifiedOnlyChange && (
        <button
          onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
          className={`px-3 py-1.5 text-xs border transition-colors ${
            verifiedOnly
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          Achats vérifiés
        </button>
      )}
    </div>
  )
}
