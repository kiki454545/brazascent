'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Star, Check, X, ExternalLink, Loader2, Search, MessageSquare,
  ShieldCheck, ImageIcon, RotateCcw, Trash2, Send, Mail, Phone,
  UserPlus, Copy, Ban, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReviewPhoto {
  id: string
  private_storage_path: string | null
  public_storage_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  copy_error: string | null
  sort_order: number
}

interface Review {
  id: string
  product_id: string
  order_id: string | null
  user_name: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  verified_purchase: boolean
  source: string | null
  purchased_size: string | null
  shop_response: string | null
  shop_response_at: string | null
  rejected_reason: string | null
  created_at: string
  products: { name: string; slug: string } | null
  orders: { order_number: string } | null
  review_photos: ReviewPhoto[]
}

// ─── Demandes manuelles (Lot 6.5) ───────────────────────────────────────────

type SourceChannel = 'snapchat' | 'instagram' | 'tiktok' | 'whatsapp' | 'autre'

const CHANNEL_LABELS: Record<SourceChannel, string> = {
  snapchat: 'Snapchat',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  autre: 'Autre',
}

interface ManualRequest {
  id: string
  product_id: string
  first_name: string
  customer_email: string | null
  internal_note: string | null
  source_channel: SourceChannel | null
  expires_at: string
  used_at: string | null
  disabled_at: string | null
  review_id: string | null
  created_at: string
  products: { name: string; slug: string } | null
  product_reviews: { status: string } | null
}

type ManualRequestState = 'active' | 'used' | 'expired' | 'disabled'

function manualRequestState(r: ManualRequest): ManualRequestState {
  if (r.disabled_at) return 'disabled'
  if (r.used_at) return 'used'
  if (new Date(r.expires_at) < new Date()) return 'expired'
  return 'active'
}

function ManualRequestStateBadge({ state }: { state: ManualRequestState }) {
  const styles: Record<ManualRequestState, string> = {
    active: 'bg-green-100 text-green-700',
    used: 'bg-blue-100 text-blue-700',
    expired: 'bg-admin-border text-admin-muted',
    disabled: 'bg-red-100 text-red-700',
  }
  const labels: Record<ManualRequestState, string> = {
    active: 'Active',
    used: 'Utilisée',
    expired: 'Expirée',
    disabled: 'Désactivée',
  }
  return <span className={`text-xs px-2 py-0.5 ${styles[state]}`}>{labels[state]}</span>
}

interface ReminderToken {
  id: string
  order_id: string
  product_id: string
  customer_email: string
  reminder_count: number
  last_reminder_at: string | null
  last_reminder_channel: 'email' | 'whatsapp' | null
  expires_at: string
  created_at: string
  products: { name: string } | null
  orders: { order_number: string; customer_name: string | null; shipping_address: unknown } | null
}

type TabKey = 'pending' | 'approved' | 'rejected' | 'verified' | 'with_photos' | 'no_response' | 'all'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'En attente' },
  { key: 'approved', label: 'Approuvés' },
  { key: 'rejected', label: 'Refusés' },
  { key: 'verified', label: 'Vérifiés' },
  { key: 'with_photos', label: 'Avec photos' },
  { key: 'no_response', label: 'Sans réponse' },
  { key: 'all', label: 'Tous' },
]

// ─── Helpers auth ───────────────────────────────────────────────────────────

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

// ─── UI bits ────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-admin-border'}`} />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: Review['status'] }) {
  if (status === 'approved') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5">Approuvé</span>
  if (status === 'rejected') return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5">Refusé</span>
  return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5">En attente</span>
}

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0] || ''
}

function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-().]/g, '').replace(/^\+/, '')
  if (p.startsWith('0')) p = '33' + p.slice(1)
  return p
}

// ─── Photo preview ──────────────────────────────────────────────────────────

function ReviewPhotos({ photos, signedUrls, onRetry, retrying }: {
  photos: ReviewPhoto[]
  signedUrls: Record<string, string | null>
  onRetry: (photoId: string) => void
  retrying: string | null
}) {
  if (photos.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {photos.map((photo) => {
        const src = photo.status === 'approved' && photo.public_storage_path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/review-photos/${photo.public_storage_path}`
          : photo.private_storage_path
            ? signedUrls[photo.private_storage_path]
            : null

        return (
          <div key={photo.id} className="relative">
            <div className="w-16 h-16 rounded overflow-hidden bg-admin-border relative">
              {src ? (
                <Image src={src} alt="Photo avis" fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-admin-muted" />
                </div>
              )}
            </div>
            {photo.copy_error && (
              <div className="mt-1">
                <span className="block text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Erreur de copie</span>
                <button
                  onClick={() => onRetry(photo.id)}
                  disabled={retrying === photo.id}
                  className="flex items-center gap-1 text-[10px] text-admin-muted hover:text-admin-text mt-0.5 disabled:opacity-50"
                >
                  {retrying === photo.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RotateCcw className="w-2.5 h-2.5" />}
                  Retenter
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminAvisPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('pending')
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [retryingPhoto, setRetryingPhoto] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string | null>>({})
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseDraft, setResponseDraft] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showReminders, setShowReminders] = useState(false)
  const [reminders, setReminders] = useState<ReminderToken[]>([])
  const [remindersLoading, setRemindersLoading] = useState(false)
  const [remindingId, setRemindingId] = useState<string | null>(null)

  // ── Demandes manuelles (Lot 6.5) ──
  const [showManualRequests, setShowManualRequests] = useState(false)
  const [manualRequests, setManualRequests] = useState<ManualRequest[]>([])
  const [manualRequestsLoading, setManualRequestsLoading] = useState(false)
  const [manualActionLoading, setManualActionLoading] = useState<string | null>(null)
  const [manualError, setManualError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [productOptions, setProductOptions] = useState<{ id: string; name: string }[]>([])
  const [createProductId, setCreateProductId] = useState('')
  const [createProductSearch, setCreateProductSearch] = useState('')
  const [createFirstName, setCreateFirstName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createNote, setCreateNote] = useState('')
  const [createChannel, setCreateChannel] = useState<SourceChannel | ''>('')
  const [creating, setCreating] = useState(false)
  const [revealedLink, setRevealedLink] = useState<{ url: string; firstName: string; productName: string; whatsappPhone: string | null } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // Récupère les avis puis, dans la foulée, les URL signées des photos encore
  // privées à afficher — regroupé dans un seul chargement pour éviter un
  // enchaînement d'effets (fetch avis → effet dérivé → fetch signatures).
  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('product_reviews')
        .select('*, products(name, slug), orders(order_number), review_photos(*)')
        .order('created_at', { ascending: false })
      const list = (data as unknown as Review[]) || []
      setReviews(list)

      const pendingPaths = list
        .flatMap((r) => r.review_photos || [])
        .filter((p) => p.status !== 'approved' && p.private_storage_path)
        .map((p) => p.private_storage_path as string)

      if (pendingPaths.length > 0) {
        const headers = await authHeaders()
        const res = await fetch('/api/admin/reviews/photos/sign', {
          method: 'POST',
          headers,
          body: JSON.stringify({ paths: pendingPaths }),
        })
        const body = await res.json().catch(() => null)
        if (body?.urls) setSignedUrls((prev) => ({ ...prev, ...body.urls }))
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const fetchReminders = useCallback(async () => {
    try {
      const headers = await authHeaders()
      const res = await fetch('/api/admin/reviews/remind', { headers })
      const body = await res.json().catch(() => null)
      setReminders((body?.reminders as ReminderToken[]) || [])
    } catch (err) {
      console.error('Error fetching reminders:', err)
    } finally {
      setRemindersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showReminders) fetchReminders()
  }, [showReminders, fetchReminders])

  // ── Demandes manuelles : chargement ──────────────────────────────────────
  const fetchManualRequests = useCallback(async () => {
    try {
      const headers = await authHeaders()
      const res = await fetch('/api/admin/reviews/manual-requests', { headers })
      const body = await res.json().catch(() => null)
      setManualRequests((body?.requests as ManualRequest[]) || [])
    } catch (err) {
      console.error('Error fetching manual requests:', err)
    } finally {
      setManualRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showManualRequests) fetchManualRequests()
  }, [showManualRequests, fetchManualRequests])

  useEffect(() => {
    if (!showCreateForm || productOptions.length > 0) return
    supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setProductOptions(data || []))
  }, [showCreateForm, productOptions.length])

  const filteredProductOptions = useMemo(() => {
    const q = createProductSearch.trim().toLowerCase()
    if (!q) return productOptions.slice(0, 20)
    return productOptions.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20)
  }, [productOptions, createProductSearch])

  const createManualRequest = async () => {
    setManualError('')
    if (!createProductId) { setManualError('Choisissez un produit.'); return }
    if (!createFirstName.trim()) { setManualError('Le prénom est requis.'); return }
    if (!createEmail.trim() && !createPhone.trim()) { setManualError('Indiquez au moins un email ou un téléphone.'); return }

    setCreating(true)
    const headers = await authHeaders()
    const res = await fetch('/api/admin/reviews/manual-requests', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId: createProductId,
        firstName: createFirstName.trim(),
        customerEmail: createEmail.trim() || null,
        customerPhone: createPhone.trim() || null,
        internalNote: createNote.trim() || null,
        sourceChannel: createChannel || null,
      }),
    })
    const body = await res.json().catch(() => null)
    setCreating(false)

    if (!res.ok) {
      setManualError(body?.error || 'Erreur lors de la création.')
      return
    }

    const productName = productOptions.find((p) => p.id === createProductId)?.name || ''
    setRevealedLink({ url: body.reviewUrl, firstName: createFirstName.trim(), productName, whatsappPhone: body.whatsappPhone || null })
    setLinkCopied(false)
    setCreateProductId('')
    setCreateProductSearch('')
    setCreateFirstName('')
    setCreateEmail('')
    setCreatePhone('')
    setCreateNote('')
    setCreateChannel('')
    setShowCreateForm(false)
    await fetchManualRequests()
  }

  const regenerateManualRequest = async (r: ManualRequest) => {
    setManualError('')
    setManualActionLoading(r.id)
    const headers = await authHeaders()
    const res = await fetch(`/api/admin/reviews/manual-requests/${r.id}/regenerate`, { method: 'POST', headers })
    const body = await res.json().catch(() => null)
    setManualActionLoading(null)

    if (!res.ok) {
      setManualError(body?.error || 'Erreur lors de la régénération.')
      return
    }

    setRevealedLink({ url: body.reviewUrl, firstName: r.first_name, productName: r.products?.name || '', whatsappPhone: null })
    setLinkCopied(false)
    await fetchManualRequests()
  }

  const disableManualRequest = async (r: ManualRequest) => {
    setManualActionLoading(r.id)
    const headers = await authHeaders()
    await fetch(`/api/admin/reviews/manual-requests/${r.id}/disable`, { method: 'POST', headers })
    await fetchManualRequests()
    setManualActionLoading(null)
  }

  const copyRevealedLink = async () => {
    if (!revealedLink) return
    try {
      await navigator.clipboard.writeText(revealedLink.url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Copie manuelle possible depuis le champ affiché si l'API clipboard échoue.
    }
  }

  // ── Comptages par onglet ──────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { pending: 0, approved: 0, rejected: 0, verified: 0, with_photos: 0, no_response: 0, all: reviews.length }
    for (const r of reviews) {
      if (r.status === 'pending') c.pending++
      if (r.status === 'approved') c.approved++
      if (r.status === 'rejected') c.rejected++
      if (r.verified_purchase) c.verified++
      if ((r.review_photos || []).length > 0) c.with_photos++
      if (r.status === 'approved' && !r.shop_response) c.no_response++
    }
    return c
  }, [reviews])

  // ── Statistiques par source (Lot 6.5) ──────────────────────────────────────
  const sourceStats = useMemo(() => {
    let verifiedPurchase = 0
    let socialManual = 0
    let unverified = 0
    for (const r of reviews) {
      if (r.verified_purchase) verifiedPurchase++
      else if (r.source === 'social_manual') socialManual++
      else unverified++
    }
    return { verifiedPurchase, socialManual, unverified }
  }, [reviews])

  // ── Filtrage (onglet + recherche + note) ──────────────────────────────────
  const filtered = useMemo(() => {
    let list = reviews
    if (tab === 'pending') list = list.filter((r) => r.status === 'pending')
    else if (tab === 'approved') list = list.filter((r) => r.status === 'approved')
    else if (tab === 'rejected') list = list.filter((r) => r.status === 'rejected')
    else if (tab === 'verified') list = list.filter((r) => r.verified_purchase)
    else if (tab === 'with_photos') list = list.filter((r) => (r.review_photos || []).length > 0)
    else if (tab === 'no_response') list = list.filter((r) => r.status === 'approved' && !r.shop_response)

    if (ratingFilter) list = list.filter((r) => r.rating === ratingFilter)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((r) =>
        r.user_name.toLowerCase().includes(q) ||
        r.products?.name.toLowerCase().includes(q) ||
        r.orders?.order_number.toLowerCase().includes(q)
      )
    }
    return list
  }, [reviews, tab, ratingFilter, search])

  // ── Actions ────────────────────────────────────────────────────────────────

  const moderate = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(id)
    const headers = await authHeaders()
    await fetch('/api/admin/reviews/moderate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, action, rejectedReason: reason }),
    })
    await fetchReviews()
    setActionLoading(null)
    setRejectingId(null)
    setRejectReason('')
  }

  const retryPhoto = async (photoId: string) => {
    setRetryingPhoto(photoId)
    const headers = await authHeaders()
    await fetch('/api/admin/reviews/photos/retry-copy', { method: 'POST', headers, body: JSON.stringify({ photoId }) })
    await fetchReviews()
    setRetryingPhoto(null)
  }

  const submitResponse = async (id: string) => {
    if (!responseDraft.trim()) return
    setActionLoading(id)
    const headers = await authHeaders()
    await fetch('/api/admin/reviews/respond', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, response: responseDraft }),
    })
    await fetchReviews()
    setActionLoading(null)
    setRespondingTo(null)
    setResponseDraft('')
  }

  const hardDelete = async (id: string) => {
    setActionLoading(id)
    const headers = await authHeaders()
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', headers })
    await fetchReviews()
    setActionLoading(null)
    setDeleteConfirmId(null)
  }

  const remindEmail = async (reviewTokenId: string) => {
    setRemindingId(reviewTokenId)
    const headers = await authHeaders()
    await fetch('/api/admin/reviews/remind', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reviewTokenId, action: 'email' }),
    })
    await fetchReminders()
    setRemindingId(null)
  }

  const remindWhatsapp = async (reminder: ReminderToken) => {
    setRemindingId(reminder.id)
    const headers = await authHeaders()
    const res = await fetch('/api/admin/reviews/remind', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reviewTokenId: reminder.id, action: 'prepare_whatsapp' }),
    })
    const body = await res.json().catch(() => null)

    if (!body?.phone) {
      setRemindingId(null)
      return
    }

    const greeting = body.firstName ? `Bonjour ${body.firstName} 👋` : 'Bonjour 👋'
    const message = [
      greeting,
      '',
      "J'espère que votre commande BrazaScent vous plaît.",
      `Votre avis sur ${body.productName} nous aiderait énormément.`,
      '',
      'Vous pouvez le laisser ici :',
      body.reviewUrl,
      '',
      'Merci encore pour votre confiance.',
      '',
      'Théo — BrazaScent',
    ].join('\n')

    const phone = normalizePhone(body.phone)
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank')

    await fetch('/api/admin/reviews/remind', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reviewTokenId: reminder.id, action: 'log_whatsapp' }),
    })
    await fetchReminders()
    setRemindingId(null)
  }

  return (
    <div className="admin p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-admin-text mb-1">Avis clients</h1>
          <p className="text-admin-muted text-sm">Modérez les avis avant leur publication sur le site.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1">
              Achat vérifié : {sourceStats.verifiedPurchase}
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1">
              Social manuel : {sourceStats.socialManual}
            </span>
            <span className="text-xs bg-admin-border text-admin-muted px-2 py-1">
              Non vérifiés : {sourceStats.unverified}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (!showManualRequests) setManualRequestsLoading(true)
              setShowManualRequests((v) => !v)
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-admin-border text-admin-muted hover:border-admin-text hover:text-admin-text transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {showManualRequests ? 'Masquer les demandes manuelles' : 'Demandes manuelles'}
          </button>
          <button
            onClick={() => {
              if (!showReminders) setRemindersLoading(true)
              setShowReminders((v) => !v)
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-admin-border text-admin-muted hover:border-admin-text hover:text-admin-text transition-colors"
          >
            <Send className="w-4 h-4" />
            {showReminders ? 'Masquer les relances' : 'Clients en attente de dépôt'}
          </button>
        </div>
      </div>

      {/* ── Lien révélé une seule fois (création ou régénération) ── */}
      {revealedLink && (
        <div className="mb-8 border border-[#C9A962] bg-[#C9A962]/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-admin-text">
                Lien pour {revealedLink.firstName} — {revealedLink.productName}
              </p>
              <p className="text-xs text-red-600 mt-1">
                Ce lien ne pourra plus être affiché après fermeture de cette fenêtre. Copiez-le et envoyez-le maintenant.
              </p>
              <input
                readOnly
                value={revealedLink.url}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full mt-2 px-3 py-2 text-xs bg-admin-bg border border-admin-border font-mono"
              />
            </div>
            <button onClick={() => setRevealedLink(null)} className="text-admin-muted hover:text-admin-text flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={copyRevealedLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-text text-white text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              {linkCopied ? 'Copié !' : 'Copier le lien'}
            </button>
            {revealedLink.whatsappPhone && (
              <button
                onClick={() => {
                  const greeting = revealedLink.firstName ? `Bonjour ${revealedLink.firstName} 👋` : 'Bonjour 👋'
                  const message = [
                    greeting,
                    '',
                    `Merci encore pour votre confiance sur ${revealedLink.productName} !`,
                    'Votre avis nous aiderait énormément, vous pouvez le laisser ici :',
                    revealedLink.url,
                  ].join('\n')
                  window.open(`https://wa.me/${normalizePhone(revealedLink.whatsappPhone!)}?text=${encodeURIComponent(message)}`, '_blank')
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600 text-green-700 text-xs hover:bg-green-50 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Ouvrir WhatsApp
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Panneau demandes manuelles (Lot 6.5) ── */}
      {showManualRequests && (
        <div className="mb-8 border border-admin-border bg-admin-surface">
          <div className="p-4 border-b border-admin-border flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-admin-text">Demandes d&apos;avis manuelles (clients hors site)</h2>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-text text-white text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {showCreateForm ? 'Annuler' : 'Créer une demande d’avis manuelle'}
            </button>
          </div>

          {manualError && (
            <p className="text-xs text-red-600 px-4 pt-3">{manualError}</p>
          )}

          {showCreateForm && (
            <div className="p-4 border-b border-admin-border space-y-3">
              <div className="relative">
                <label className="block text-xs font-medium text-admin-text mb-1">Produit *</label>
                <input
                  type="text"
                  value={createProductId ? (productOptions.find((p) => p.id === createProductId)?.name ?? createProductSearch) : createProductSearch}
                  onChange={(e) => { setCreateProductSearch(e.target.value); setCreateProductId('') }}
                  placeholder="Rechercher un produit…"
                  className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                />
                {createProductSearch && !createProductId && filteredProductOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-admin-surface border border-admin-border shadow-lg">
                    {filteredProductOptions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setCreateProductId(p.id); setCreateProductSearch(p.name) }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-admin-bg"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-admin-text mb-1">Prénom client *</label>
                  <input
                    type="text"
                    value={createFirstName}
                    onChange={(e) => setCreateFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-admin-text mb-1">Canal d&apos;origine</label>
                  <select
                    value={createChannel}
                    onChange={(e) => setCreateChannel(e.target.value as SourceChannel | '')}
                    className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                  >
                    <option value="">—</option>
                    {(Object.keys(CHANNEL_LABELS) as SourceChannel[]).map((c) => (
                      <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-admin-text mb-1">Email (optionnel)</label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-admin-text mb-1">Téléphone (optionnel)</label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="06…"
                    className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                  />
                </div>
              </div>
              <p className="text-xs text-admin-muted">Au moins un email ou un téléphone est requis. Le téléphone n&apos;est jamais stocké en clair — seul son empreinte est conservée.</p>

              <div>
                <label className="block text-xs font-medium text-admin-text mb-1">Note interne (optionnelle)</label>
                <input
                  type="text"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="Contexte pour l'équipe (jamais visible publiquement)"
                  className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                />
              </div>

              <button
                onClick={createManualRequest}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-admin-text text-white text-sm disabled:opacity-50"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Générer le lien
              </button>
            </div>
          )}

          {manualRequestsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-admin-muted" /></div>
          ) : manualRequests.length === 0 ? (
            <p className="text-admin-muted text-sm p-6">Aucune demande manuelle créée pour l&apos;instant.</p>
          ) : (
            <div className="divide-y divide-admin-border">
              {manualRequests.map((r) => {
                const state = manualRequestState(r)
                return (
                  <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-admin-text flex items-center gap-2 flex-wrap">
                        {r.first_name} — {r.products?.name || 'Produit'}
                        <ManualRequestStateBadge state={state} />
                        {r.source_channel && (
                          <span className="text-xs text-admin-muted">{CHANNEL_LABELS[r.source_channel]}</span>
                        )}
                      </p>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Créée le {new Date(r.created_at).toLocaleDateString('fr-FR')} · Expire le {new Date(r.expires_at).toLocaleDateString('fr-FR')}
                        {r.review_id && (
                          <> · Avis {r.product_reviews?.status === 'pending' ? 'en attente' : r.product_reviews?.status === 'approved' ? 'approuvé' : r.product_reviews?.status === 'rejected' ? 'refusé' : ''}</>
                        )}
                      </p>
                      {r.internal_note && (
                        <p className="text-xs text-admin-muted mt-0.5 italic">Note : {r.internal_note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.review_id && r.products?.slug && (
                        <Link
                          href={`/parfum/${r.products.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-[#C9A962] hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Voir l&apos;avis
                        </Link>
                      )}
                      {state !== 'used' && (
                        <button
                          onClick={() => regenerateManualRequest(r)}
                          disabled={manualActionLoading === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-admin-border text-xs text-admin-muted hover:border-admin-text hover:text-admin-text transition-colors disabled:opacity-50"
                        >
                          {manualActionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Générer un nouveau lien
                        </button>
                      )}
                      {state !== 'disabled' && state !== 'used' && (
                        <button
                          onClick={() => disableManualRequest(r)}
                          disabled={manualActionLoading === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-admin-border text-admin-muted hover:border-red-600 hover:text-red-600 text-xs transition-colors disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Désactiver
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Panneau relances (tokens non utilisés — clients n'ayant pas encore déposé d'avis) ── */}
      {showReminders && (
        <div className="mb-8 border border-admin-border bg-admin-surface">
          <div className="p-4 border-b border-admin-border">
            <h2 className="text-sm font-medium text-admin-text">Clients ayant reçu un lien d&apos;avis, sans dépôt pour l&apos;instant</h2>
          </div>
          {remindersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-admin-muted" /></div>
          ) : reminders.length === 0 ? (
            <p className="text-admin-muted text-sm p-6">Aucun lien en attente de dépôt.</p>
          ) : (
            <div className="divide-y divide-admin-border">
              {reminders.map((r) => {
                const phone = (r.orders?.shipping_address as { phone?: string } | null)?.phone
                return (
                  <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-admin-text">
                        {extractFirstName(r.orders?.customer_name) || r.customer_email} — {r.products?.name || 'Produit'}
                      </p>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Commande {r.orders?.order_number || '—'} · Expire le {new Date(r.expires_at).toLocaleDateString('fr-FR')}
                        {r.reminder_count > 0 && (
                          <> · {r.reminder_count} relance{r.reminder_count > 1 ? 's' : ''}
                            {r.last_reminder_at && ` (dernière : ${r.last_reminder_channel === 'email' ? '📧' : '💬'} ${new Date(r.last_reminder_at).toLocaleDateString('fr-FR')})`}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => remindEmail(r.id)}
                        disabled={remindingId === r.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-admin-border text-xs text-admin-muted hover:border-admin-text hover:text-admin-text transition-colors disabled:opacity-50"
                      >
                        {remindingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        Relancer par email
                      </button>
                      {phone && (
                        <button
                          onClick={() => remindWhatsapp(r)}
                          disabled={remindingId === r.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-green-600 text-green-700 text-xs hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Relancer par WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Onglets ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm rounded-none border transition-colors ${
              tab === key
                ? 'bg-admin-text text-white border-admin-text'
                : 'bg-admin-surface border-admin-border text-admin-muted hover:border-admin-text'
            }`}
          >
            {label}
            {counts[key] > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-admin-border'}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Recherche + filtre note ── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Client, produit ou n° de commande…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-admin-border bg-admin-surface focus:outline-none focus:border-admin-text"
          />
        </div>
        <select
          value={ratingFilter ?? ''}
          onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 text-sm border border-admin-border bg-admin-surface focus:outline-none focus:border-admin-text"
        >
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-admin-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-admin-muted">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun avis dans cette vue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review.id} className="bg-admin-surface border border-admin-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="font-medium text-admin-text text-sm">{review.user_name}</span>
                    <Stars rating={review.rating} />
                    <time className="text-xs text-admin-muted">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                    <StatusBadge status={review.status} />
                    {review.verified_purchase && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5">
                        <ShieldCheck className="w-3 h-3" /> Achat vérifié
                      </span>
                    )}
                    {review.purchased_size && (
                      <span className="text-xs text-admin-muted">Format : {review.purchased_size}</span>
                    )}
                  </div>

                  <p className="text-sm text-admin-muted mb-2 leading-relaxed">{review.comment}</p>

                  {review.rejected_reason && (
                    <p className="text-xs text-red-600 mb-2">Motif du refus : {review.rejected_reason}</p>
                  )}

                  <ReviewPhotos
                    photos={review.review_photos || []}
                    signedUrls={signedUrls}
                    onRetry={retryPhoto}
                    retrying={retryingPhoto}
                  />

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {review.products && (
                      <Link href={`/parfum/${review.products.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-[#C9A962] hover:underline">
                        <ExternalLink className="w-3 h-3" /> {review.products.name}
                      </Link>
                    )}
                    {review.orders && (
                      <Link href={`/admin/commandes/${review.order_id}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-admin-muted hover:text-admin-text hover:underline">
                        <ExternalLink className="w-3 h-3" /> Commande {review.orders.order_number}
                      </Link>
                    )}
                  </div>

                  {/* Réponse boutique */}
                  {review.shop_response ? (
                    <div className="mt-3 p-3 bg-admin-bg border-l-2 border-[#C9A962]">
                      <p className="text-xs font-medium text-admin-text mb-1">Réponse BrazaScent</p>
                      <p className="text-xs text-admin-muted">{review.shop_response}</p>
                      <button
                        onClick={() => { setRespondingTo(review.id); setResponseDraft(review.shop_response || '') }}
                        className="text-xs text-[#C9A962] hover:underline mt-1.5"
                      >
                        Modifier la réponse
                      </button>
                    </div>
                  ) : respondingTo !== review.id ? (
                    <button
                      onClick={() => { setRespondingTo(review.id); setResponseDraft('') }}
                      className="flex items-center gap-1.5 text-xs text-admin-muted hover:text-admin-text mt-3"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Répondre au client
                    </button>
                  ) : null}

                  {respondingTo === review.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={responseDraft}
                        onChange={(e) => setResponseDraft(e.target.value)}
                        rows={2}
                        placeholder="Votre réponse, visible publiquement sous l'avis…"
                        className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => submitResponse(review.id)}
                          disabled={actionLoading === review.id || !responseDraft.trim()}
                          className="px-3 py-1.5 bg-admin-text text-white text-xs disabled:opacity-50"
                        >
                          {actionLoading === review.id ? 'Envoi…' : 'Publier la réponse'}
                        </button>
                        <button onClick={() => { setRespondingTo(null); setResponseDraft('') }} className="text-xs text-admin-muted hover:text-admin-text">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Refus avec motif */}
                  {rejectingId === review.id && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Motif du refus (facultatif, interne)"
                        className="w-full px-3 py-2 text-sm border border-admin-border bg-admin-bg focus:outline-none focus:border-admin-text"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moderate(review.id, 'reject', rejectReason)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs disabled:opacity-50"
                        >
                          Confirmer le refus
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectReason('') }} className="text-xs text-admin-muted hover:text-admin-text">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suppression définitive — confirmation forte, séparée du refus */}
                  {deleteConfirmId === review.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200">
                      <p className="text-xs text-red-700 mb-2">
                        Suppression définitive et irréversible (avis + photos). Ceci diffère du refus, qui conserve l&apos;avis en base.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => hardDelete(review.id)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 bg-red-700 text-white text-xs disabled:opacity-50"
                        >
                          {actionLoading === review.id ? 'Suppression…' : 'Supprimer définitivement'}
                        </button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-admin-muted hover:text-admin-text">
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => moderate(review.id, 'approve')}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs transition-colors disabled:opacity-50"
                    >
                      {actionLoading === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approuver
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => setRejectingId(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs transition-colors disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Refuser
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirmId(review.id)}
                    disabled={actionLoading === review.id}
                    title="Suppression définitive"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-admin-border text-admin-muted hover:border-red-600 hover:text-red-600 text-xs transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
