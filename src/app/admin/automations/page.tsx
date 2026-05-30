'use client'

import { useState, useEffect, useCallback } from 'react'
import { Mail, Clock, CheckCircle, XCircle, SkipForward, RefreshCw, Send, AlertTriangle } from 'lucide-react'

interface PostPurchaseEmail {
  id: string
  order_id: string
  email_type: string
  email: string
  scheduled_for: string
  sent_at: string | null
  status: string
  error_message: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  sent: 'Envoyé',
  failed: 'Échec',
  skipped: 'Ignoré',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-500',
}

const TYPE_LABEL: Record<string, string> = {
  reorder_suggestion: 'Réachat J+30',
  review_request: 'Demande avis J+7',
}

export default function AdminAutomationsPage() {
  const [emails, setEmails] = useState<PostPurchaseEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/post-purchase-emails')
      const data = await res.json()
      setEmails(data.emails || [])
    } catch (err) {
      console.error('Error fetching post-purchase emails:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const handleRetry = async (id: string) => {
    setRetryingId(id)
    try {
      await fetch('/api/admin/post-purchase-emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'retry' }),
      })
      await fetchEmails()
    } finally {
      setRetryingId(null)
    }
  }

  const handleCancel = async (id: string) => {
    await fetch('/api/admin/post-purchase-emails', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'skip' }),
    })
    await fetchEmails()
  }

  const filtered = filter === 'all' ? emails : emails.filter(e => e.status === filter)

  const counts = {
    pending: emails.filter(e => e.status === 'pending').length,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length,
    skipped: emails.filter(e => e.status === 'skipped').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automations post-achat</h1>
          <p className="text-admin-muted text-sm">Emails J+30 réachat programmés automatiquement</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchEmails() }}
          className="flex items-center gap-2 px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'En attente', count: counts.pending, color: 'bg-yellow-100 text-yellow-600', icon: <Clock className="w-5 h-5" /> },
          { label: 'Envoyés', count: counts.sent, color: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Échecs', count: counts.failed, color: 'bg-red-100 text-red-600', icon: <XCircle className="w-5 h-5" /> },
          { label: 'Ignorés', count: counts.skipped, color: 'bg-gray-100 text-gray-500', icon: <SkipForward className="w-5 h-5" /> },
        ].map(s => (
          <div key={s.label} className="bg-admin-surface rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
              <span className="text-xs text-admin-muted">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'sent', 'failed', 'skipped'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-[#19110B] text-white' : 'bg-admin-surface border border-admin-border hover:bg-admin-surface-alt'
            }`}
          >
            {s === 'all' ? `Tous (${emails.length})` : `${STATUS_LABEL[s] || s} (${counts[s as keyof typeof counts] ?? 0})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-admin-surface rounded-xl shadow-sm divide-y divide-admin-border">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-admin-light mx-auto mb-4" />
            <p className="text-admin-muted">Aucun email</p>
          </div>
        ) : filtered.map(email => (
          <div key={email.id} className="p-4 flex items-start gap-4">
            <div className={`mt-0.5 p-2 rounded-lg ${STATUS_COLOR[email.status] || 'bg-gray-100'}`}>
              {email.status === 'sent' ? <CheckCircle className="w-4 h-4" />
                : email.status === 'failed' ? <XCircle className="w-4 h-4" />
                : email.status === 'skipped' ? <SkipForward className="w-4 h-4" />
                : <Clock className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-medium truncate">{email.email}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[email.status]}`}>
                  {STATUS_LABEL[email.status] || email.status}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {TYPE_LABEL[email.email_type] || email.email_type}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-admin-muted">
                <span>Prévu: {new Date(email.scheduled_for).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                {email.sent_at && <span>Envoyé: {new Date(email.sent_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
              </div>
              {email.error_message && (
                <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="w-3 h-3" /> {email.error_message}
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              {email.status === 'failed' && (
                <button
                  onClick={() => handleRetry(email.id)}
                  disabled={retryingId === email.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#C9A962] text-white rounded-lg text-xs hover:bg-[#b8944d] transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  {retryingId === email.id ? 'Retry…' : 'Réessayer'}
                </button>
              )}
              {email.status === 'pending' && (
                <button
                  onClick={() => handleCancel(email.id)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-admin-border rounded-lg text-xs hover:bg-admin-surface-alt transition-colors"
                >
                  <XCircle className="w-3 h-3" /> Annuler
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
