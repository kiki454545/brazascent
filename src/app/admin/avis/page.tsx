'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Check, X, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Review {
  id: string
  product_id: string
  user_id: string | null
  user_name: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  products?: { name: string; slug: string } | null
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-admin-border'}`} />
      ))}
    </div>
  )
}

export default function AdminAvisPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('product_reviews')
      .select('*, products(name, slug)')
      .order('created_at', { ascending: false })

    if (filter === 'pending') query = query.eq('is_approved', false)
    if (filter === 'approved') query = query.eq('is_approved', true)

    const { data } = await query
    setReviews((data as Review[]) || [])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const approve = async (id: string) => {
    setActionLoading(id)
    await supabase.from('product_reviews').update({ is_approved: true }).eq('id', id)
    await fetchReviews()
    setActionLoading(null)
  }

  const reject = async (id: string) => {
    setActionLoading(id)
    await supabase.from('product_reviews').delete().eq('id', id)
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setActionLoading(null)
  }

  const pendingCount = reviews.filter((r) => !r.is_approved).length

  return (
    <div className="admin p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-admin-text mb-1">Avis clients</h1>
        <p className="text-admin-muted text-sm">Modérez les avis avant leur publication sur le site.</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'pending', label: 'En attente' },
          { key: 'approved', label: 'Approuvés' },
          { key: 'all', label: 'Tous' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm rounded-none border transition-colors ${
              filter === key
                ? 'bg-admin-text text-white border-admin-text'
                : 'bg-admin-surface border-admin-border text-admin-muted hover:border-admin-text'
            }`}
          >
            {label}
            {key === 'pending' && pendingCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-admin-muted" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-admin-muted">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun avis{filter === 'pending' ? ' en attente' : filter === 'approved' ? ' approuvé' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-admin-surface border border-admin-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-medium text-admin-text text-sm">{review.user_name}</span>
                    <Stars rating={review.rating} />
                    <time className="text-xs text-admin-muted">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </time>
                    {review.is_approved && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5">Approuvé</span>
                    )}
                  </div>
                  <p className="text-sm text-admin-muted mb-3 leading-relaxed">{review.comment}</p>
                  {review.products && (
                    <Link
                      href={`/parfum/${review.products.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-[#C9A962] hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {review.products.name}
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => approve(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs transition-colors disabled:opacity-50"
                    >
                      {actionLoading === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approuver
                    </button>
                  )}
                  <button
                    onClick={() => reject(review.id)}
                    disabled={actionLoading === review.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs transition-colors disabled:opacity-50"
                  >
                    {actionLoading === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
