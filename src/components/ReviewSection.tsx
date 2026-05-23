'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

interface ReviewSectionProps {
  productId: string
  productName?: string
  productSlug?: string
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const interactive = !!onChange
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hovered || value) ? 'text-primary fill-primary' : 'text-border'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({ productId, productName, productSlug }: ReviewSectionProps) {
  const { user, profile } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('product_reviews')
      .select('id, user_name, rating, comment, created_at')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    setReviews(data || [])
    setLoading(false)
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) { setError('Veuillez choisir une note.'); return }
    if (comment.trim().length < 10) { setError('Le commentaire doit faire au moins 10 caractères.'); return }

    setSubmitting(true)
    const userName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Client anonyme'

    const { error: insertError } = await supabase
      .from('product_reviews')
      .insert({ product_id: productId, user_id: user!.id, user_name: userName, rating, comment: comment.trim() })

    setSubmitting(false)
    if (insertError) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } else {
      setSubmitted(true)
      setShowForm(false)
      setRating(0)
      setComment('')
      // Notifier l'admin (fire & forget)
      fetch('/api/email/review-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName || 'Produit',
          productSlug: productSlug || '',
          userName,
          rating,
          comment: comment.trim(),
        }),
      }).catch(() => {})
    }
  }

  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="px-6 sm:px-10 lg:px-20 max-w-4xl">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-2">Avis clients</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <StarRating value={Math.round(avgRating)} />
                <span className="text-sm text-muted-foreground">
                  {avgRating.toFixed(1)}/5 · {reviews.length} avis
                </span>
              </div>
            )}
          </div>
          {user && !submitted && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-luxury px-6 py-2.5 bg-foreground text-background text-xs tracking-[0.15em] uppercase hover:bg-primary transition-colors"
            >
              Laisser un avis
            </button>
          )}
          {!user && (
            <a href="/compte" className="text-sm text-primary hover:underline">
              Connectez-vous pour laisser un avis
            </a>
          )}
        </div>

        {/* Message de confirmation */}
        {submitted && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 text-sm mb-8">
            <Check className="w-5 h-5 flex-shrink-0" />
            Merci pour votre avis ! Il sera visible après validation.
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border p-6 mb-10 space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Votre note *</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Votre avis *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Partagez votre expérience avec ce parfum..."
                className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none resize-none text-sm bg-background"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-luxury px-6 py-2.5 bg-foreground text-background text-xs tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Publier mon avis
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Liste des avis */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6">
            Aucun avis pour le moment. Soyez le premier à partager votre expérience !
          </p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="font-medium text-sm">{review.user_name}</p>
                    <StarRating value={review.rating} />
                  </div>
                  <time className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
