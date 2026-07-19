import { Star } from 'lucide-react'

interface RatingSummaryProps {
  avgRating: number
  totalCount: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  size?: 'md' | 'lg'
}

function DistributionBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-muted-foreground text-xs">{star}</span>
      <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-muted-foreground text-xs">{count}</span>
    </div>
  )
}

export function RatingSummary({ avgRating, totalCount, distribution, size = 'md' }: RatingSummaryProps) {
  if (totalCount === 0) return null

  const bigText = size === 'lg' ? 'text-5xl' : 'text-4xl'
  const starSize = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'

  return (
    <div className="flex flex-col sm:flex-row gap-8 sm:items-start">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-baseline gap-2">
          <span className={`${bigText} font-light`}>{avgRating.toFixed(1)}</span>
          <span className="text-muted-foreground text-lg">/5</span>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${starSize} ${star <= Math.round(avgRating) ? 'text-primary fill-primary' : 'text-border'}`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {totalCount === 1 ? '1 avis vérifié' : `${totalCount} avis vérifiés`}
        </p>
      </div>
      <div className="flex-1 max-w-xs space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <DistributionBar key={star} star={star} count={distribution[star as 1 | 2 | 3 | 4 | 5] ?? 0} total={totalCount} />
        ))}
      </div>
    </div>
  )
}
