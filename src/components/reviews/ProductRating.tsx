import { Star } from 'lucide-react'

interface ProductRatingProps {
  avgRating?: number
  reviewCount?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Note + nombre d'avis, réutilisé par ProductCard et les en-têtes de page
// produit. N'affiche rien si aucun avis (jamais de 0,0 ni d'étoiles vides).
export function ProductRating({ avgRating, reviewCount, size = 'sm', className = '' }: ProductRatingProps) {
  if (!avgRating || !reviewCount || reviewCount === 0) return null

  const starSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  const textSize = size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${star <= Math.round(avgRating) ? 'text-primary fill-primary' : 'text-muted-foreground/30 fill-muted-foreground/30'}`}
          />
        ))}
      </div>
      <span className={`${textSize} text-muted-foreground`}>
        {avgRating.toFixed(1)} ({reviewCount === 1 ? '1 avis' : `${reviewCount} avis`})
      </span>
    </div>
  )
}
