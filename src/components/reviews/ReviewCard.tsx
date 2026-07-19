import Link from 'next/link'
import { Star, ShoppingBag } from 'lucide-react'
import { PublicReview } from '@/lib/reviews/public'
import { VerifiedBadge } from './VerifiedBadge'
import { ReviewPhotoGallery } from './ReviewPhotoGallery'
import { ShopResponse } from './ShopResponse'

interface ReviewCardProps {
  review: PublicReview
  showProductLink?: boolean
  className?: string
}

// Carte d'avis publique — n'affiche jamais : email, order_id, téléphone,
// motif de refus, ou toute autre donnée interne. Uniquement les champs
// destinés à l'affichage public.
export function ReviewCard({ review, showProductLink = false, className = '' }: ReviewCardProps) {
  const productName = review.product?.name || 'ce parfum'

  return (
    <article className={`border border-border p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-medium text-sm">{review.userName}</p>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-primary fill-primary' : 'text-border'}`} />
            ))}
          </div>
        </div>
        <time className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
          {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </time>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        {review.verifiedPurchase && <VerifiedBadge />}
        {review.purchasedSize && (
          <span className="text-xs text-muted-foreground">Format : {review.purchasedSize}</span>
        )}
      </div>

      {showProductLink && review.product && (
        <Link
          href={`/parfum/${review.product.slug}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
        >
          <ShoppingBag className="w-3 h-3" />
          {review.product.name}
        </Link>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>

      <ReviewPhotoGallery photos={review.photos} productName={productName} />

      {review.shopResponse && (
        <ShopResponse response={review.shopResponse} respondedAt={review.shopResponseAt} />
      )}
    </article>
  )
}
