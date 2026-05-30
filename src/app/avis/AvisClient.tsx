'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Loader2, ShoppingBag, Check, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
  product_id: string
  products: { name: string; slug: string } | null
}

interface Product {
  id: string
  name: string
  brand: string | null
  slug: string
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= rating ? 'text-primary fill-primary' : 'text-border'}`} />
      ))}
    </div>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${s} étoile${s > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              s <= (hovered || value) ? 'text-primary fill-primary' : 'text-border hover:text-primary/50'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
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

// ── Write review form ───────────────────────────────────────────────────────

function WriteReviewForm({ products, onSubmitted }: { products: Product[]; onSubmitted: () => void }) {
  const { user, profile } = useAuthStore()
  const [productId, setProductId] = useState('')
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill name if logged in
  useEffect(() => {
    if (profile) {
      const full = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      if (full) setName(full)
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!productId) { setError('Veuillez sélectionner un parfum.'); return }
    if (rating === 0) { setError('Veuillez choisir une note.'); return }
    if (!name.trim()) { setError('Veuillez indiquer votre prénom.'); return }
    if (comment.trim().length < 10) { setError('Le commentaire doit faire au moins 10 caractères.'); return }

    setSubmitting(true)
    const { error: insertError } = await supabase.from('product_reviews').insert({
      product_id: productId,
      user_id: user?.id ?? null,
      user_name: name.trim(),
      rating,
      comment: comment.trim(),
    })
    setSubmitting(false)

    if (insertError) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } else {
      setSubmitted(true)
      onSubmitted()
    }
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 p-5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400">
        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Merci pour votre avis !</p>
          <p className="text-sm mt-0.5 opacity-80">Il sera visible après validation par notre équipe.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Produit */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Quel parfum avez-vous testé ? <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-4 py-3 pr-10 border border-border bg-background text-sm appearance-none focus:outline-none focus:border-primary"
          >
            <option value="">Sélectionner un parfum…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand ? `${p.brand} — ` : ''}{p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Votre note <span className="text-red-500">*</span>
        </label>
        <StarPicker value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent !'][rating]}
          </p>
        )}
      </div>

      {/* Prénom */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Votre prénom <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prénom affiché publiquement"
          className="w-full px-4 py-3 border border-border bg-background text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Votre avis <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Partagez votre expérience avec ce parfum, la tenue, la sillage, les occasions…"
          className="w-full px-4 py-3 border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{comment.trim().length}/10 minimum</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-foreground text-background text-xs tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Publier mon avis
      </button>
    </form>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

const FILTERS = [
  { label: 'Tous', value: 0 },
  { label: '5 ★', value: 5 },
  { label: '4 ★', value: 4 },
  { label: '3 ★', value: 3 },
  { label: '2 ★', value: 2 },
  { label: '1 ★', value: 1 },
]

const PAGE_SIZE = 12

export function AvisClient() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  const [showForm, setShowForm] = useState(false)

  // Fetch products for the form
  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, brand, slug')
      .eq('is_active', true)
      .order('brand', { ascending: true })
      .limit(200)
      .then(({ data }) => setProducts((data as Product[]) || []))
  }, [])

  // Fetch distribution once
  useEffect(() => {
    supabase
      .from('product_reviews')
      .select('rating')
      .eq('is_approved', true)
      .then(({ data }) => {
        if (!data) return
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        data.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1 })
        setDistribution(dist)
        setTotalCount(data.length)
      })
  }, [])

  const fetchPage = useCallback(async (pageIndex: number, star: number, append: boolean) => {
    if (!append) setLoading(true)

    let query = supabase
      .from('product_reviews')
      .select('id, user_name, rating, comment, created_at, product_id, products(name, slug)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1)

    if (star > 0) query = query.eq('rating', star)

    const { data } = await query
    const results = ((data as unknown) as Review[]) || []
    setReviews((prev) => (append ? [...prev, ...results] : results))
    setHasMore(results.length === PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(0)
    setReviews([])
    fetchPage(0, filter, false)
  }, [filter, fetchPage])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPage(next, filter, true)
  }

  const avg =
    totalCount > 0
      ? Object.entries(distribution).reduce((sum, [star, cnt]) => sum + Number(star) * cnt, 0) / totalCount
      : 0

  const filteredCount = filter > 0 ? (distribution[filter] ?? 0) : totalCount

  return (
    <main className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-background border-b border-border pt-32 lg:pt-40 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-3">Retours clients</p>
          <h1 className="text-3xl lg:text-4xl font-light tracking-[0.12em] uppercase mb-8">
            Avis clients
          </h1>

          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row gap-8 sm:items-start">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-light">{avg.toFixed(1)}</span>
                  <span className="text-muted-foreground text-lg">/5</span>
                </div>
                <Stars rating={Math.round(avg)} size="md" />
                <p className="text-sm text-muted-foreground">{totalCount} avis vérifiés</p>
              </div>
              <div className="flex-1 max-w-xs space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar key={star} star={star} count={distribution[star] ?? 0} total={totalCount} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Write review CTA / Form ────────────────────────────────────── */}
      <section className="border-b border-border bg-cream/20 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {!showForm ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium tracking-wide">Vous avez testé un de nos décants ?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Partagez votre expérience en quelques secondes.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex-shrink-0 px-6 py-3 bg-foreground text-background text-xs tracking-[0.15em] uppercase hover:bg-primary transition-colors"
              >
                Laisser un avis
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-light tracking-[0.1em] uppercase">Laisser un avis</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </button>
              </div>
              <WriteReviewForm
                products={products}
                onSubmitted={() => {
                  setShowForm(false)
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Reviews list ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-10">

        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => {
            const count = f.value === 0 ? totalCount : (distribution[f.value] ?? 0)
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-1.5 text-sm border transition-colors ${
                  filter === f.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
                <span className="ml-1.5 opacity-60 text-xs">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border">
            <Star className="w-10 h-10 text-border mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              {filter > 0
                ? `Aucun avis ${filter} étoile${filter > 1 ? 's' : ''} pour le moment.`
                : 'Aucun avis pour le moment. Soyez les premiers !'}
            </p>
            {filter > 0 && (
              <button onClick={() => setFilter(0)} className="text-sm text-primary hover:underline mt-1">
                Voir tous les avis
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-6 uppercase tracking-[0.1em]">
              {filteredCount} avis{filter > 0 ? ` — ${filter} étoile${filter > 1 ? 's' : ''}` : ''}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="border border-border p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-sm">{review.user_name}</p>
                      <Stars rating={review.rating} />
                    </div>
                    <time className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  {review.products && (
                    <Link
                      href={`/parfum/${review.products.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      {review.products.name}
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 border border-foreground text-sm tracking-[0.1em] uppercase hover:bg-foreground hover:text-background transition-colors"
                >
                  Voir plus d&apos;avis
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  )
}
