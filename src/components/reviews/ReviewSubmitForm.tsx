'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ReviewPhotoUploader } from './ReviewPhotoUploader'

interface ReviewProduct {
  name: string
  brand: string | null
  image: string | null
}

interface ReviewSubmitFormProps {
  token: string
  product: ReviewProduct
  initialFirstName: string
  purchasedSize: string | null
}

interface UploadUrlResponse {
  uploads: { path: string; token: string; mimeType: string }[]
}

function StarPicker({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(0)
  const labels = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent !']

  return (
    <div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
            className="p-1 -m-1 disabled:opacity-50"
          >
            <Star
              className={`w-9 h-9 sm:w-8 sm:h-8 transition-colors ${
                star <= (hovered || value) ? 'text-primary fill-primary' : 'text-border'
              }`}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">{labels[hovered || value]}</p>
      )}
    </div>
  )
}

export function ReviewSubmitForm({ token, product, initialFirstName, purchasedSize }: ReviewSubmitFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [firstName, setFirstName] = useState(initialFirstName)
  const [photos, setPhotos] = useState<File[]>([])
  const [website, setWebsite] = useState('') // honeypot — jamais rempli par un humain
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) { setError('Veuillez choisir une note.'); return }
    if (comment.trim().length < 10) { setError('Le commentaire doit faire au moins 10 caractères.'); return }
    if (!firstName.trim()) { setError('Veuillez indiquer votre prénom.'); return }

    setSubmitting(true)

    try {
      let photoPaths: string[] = []

      if (photos.length > 0) {
        const uploadUrlRes = await fetch('/api/reviews/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            files: photos.map((f) => ({ fileName: f.name, fileSize: f.size, mimeType: f.type })),
          }),
        })

        const uploadUrlBody = await uploadUrlRes.json().catch(() => ({}))
        if (!uploadUrlRes.ok) {
          throw new Error(uploadUrlBody.error || "Impossible de préparer l'envoi des photos.")
        }

        const { uploads } = uploadUrlBody as UploadUrlResponse

        for (let i = 0; i < uploads.length; i++) {
          const { error: uploadError } = await supabase.storage
            .from('review-uploads')
            .uploadToSignedUrl(uploads[i].path, uploads[i].token, photos[i])

          if (uploadError) {
            throw new Error("Une photo n'a pas pu être envoyée. Réessayez.")
          }
        }

        photoPaths = uploads.map((u) => u.path)
      }

      const submitRes = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating,
          comment: comment.trim(),
          userName: firstName.trim(),
          photoPaths,
          purchasedSize,
          website, // honeypot
        }),
      })

      const submitBody = await submitRes.json().catch(() => ({}))
      if (!submitRes.ok) {
        throw new Error(submitBody.error || 'Une erreur est survenue. Veuillez réessayer.')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-light tracking-[0.1em] uppercase mb-3">Merci !</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Votre avis a bien été envoyé. Il sera visible sur la fiche produit après validation par notre équipe.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* En-tête produit */}
      <div className="flex items-center gap-4 mb-8">
        {product.image && (
          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-cream flex-shrink-0">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">Votre avis sur</p>
          <h1 className="text-lg font-medium truncate">
            {product.name}{product.brand ? ` — ${product.brand}` : ''}
          </h1>
          {purchasedSize && (
            <p className="text-xs text-muted-foreground mt-0.5">Format acheté : {purchasedSize}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-2">
            Votre note <span className="text-red-500">*</span>
          </p>
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />
        </div>

        <div>
          <label htmlFor="review-firstname" className="block text-sm font-medium mb-2">
            Votre prénom <span className="text-red-500">*</span>
          </label>
          <input
            id="review-firstname"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={submitting}
            placeholder="Prénom affiché publiquement"
            className="w-full px-4 py-3 border border-border bg-background text-sm focus:outline-none focus:border-primary disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
            Votre avis <span className="text-red-500">*</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
            rows={4}
            placeholder="Partagez votre expérience avec ce parfum, la tenue, le sillage, les occasions…"
            className="w-full px-4 py-3 border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground mt-1">{comment.trim().length}/10 minimum</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Photos</p>
          <ReviewPhotoUploader photos={photos} onChange={setPhotos} disabled={submitting} />
        </div>

        {/* Honeypot — champ invisible, un humain ne le remplit jamais */}
        <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
          <label htmlFor="review-website">Ne pas remplir ce champ</label>
          <input
            id="review-website"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-luxury w-full min-h-[48px] py-3.5 bg-foreground text-background text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-primary transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Publier mon avis
        </button>
      </form>
    </div>
  )
}
