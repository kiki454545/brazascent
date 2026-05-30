'use client'

import { useState, useEffect, useCallback } from 'react'
import { m } from 'framer-motion'
import Image from 'next/image'
import {
  ShoppingCart, Clock, AlertTriangle, RefreshCw, Package, Euro, User,
  Mail, ChevronDown, ExternalLink, Eye, Phone, Calendar, XCircle,
  Shield, CheckCircle, BanIcon, TrendingUp, Send, Filter,
} from 'lucide-react'

interface CartItem {
  product_id: string
  name: string
  size: string
  quantity: number
  price: number
  image?: string
}

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
}

interface ActiveCart {
  id: string
  visitor_id: string
  session_id: string
  items: CartItem[]
  subtotal: number
  item_count: number
  last_activity: string
  abandoned_at: string | null
  converted_at: string | null
  user_email: string | null
  user_name?: string
  user_profile?: UserProfile
  created_at: string
  status: string
  reminder_1_sent_at: string | null
  reminder_2_sent_at: string | null
  reminder_3_sent_at: string | null
  recovered_at: string | null
  ignored_at: string | null
  recovery_promo_code: string | null
}

type FilterStatus = 'all' | 'active' | 'abandoned' | 'reminded' | 'recovered' | 'ignored'

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  abandoned: 'Abandonné',
  reminded: 'Relancé',
  recovered: 'Récupéré',
  ignored: 'Ignoré',
  expired: 'Expiré',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  abandoned: 'bg-orange-100 text-orange-700',
  reminded: 'bg-blue-100 text-blue-700',
  recovered: 'bg-emerald-100 text-emerald-700',
  ignored: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-400',
}

function timeSince(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}j ${h % 24}h`
  if (h > 0) return `${h}h ${m % 60}min`
  return `${m} min`
}

function reminderStep(cart: ActiveCart): string {
  if (cart.reminder_3_sent_at) return 'Rappel 3/3'
  if (cart.reminder_2_sent_at) return 'Rappel 2/3'
  if (cart.reminder_1_sent_at) return 'Rappel 1/3'
  return '—'
}

export default function AdminPaniersPage() {
  const [carts, setCarts] = useState<ActiveCart[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedCart, setExpandedCart] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [hasEmailFilter, setHasEmailFilter] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCarts = useCallback(async () => {
    try {
      const res = await fetch('/api/tracking?type=carts')
      const data = await res.json()
      setCarts(data.carts || [])
    } catch (err) {
      console.error('Error fetching carts:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCarts()
    const interval = setInterval(fetchCarts, 30000)
    return () => clearInterval(interval)
  }, [fetchCarts])

  const handleAction = async (cartId: string, action: 'ignore' | 'recover') => {
    setActionLoading(cartId + action)
    try {
      await fetch('/api/admin/carts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cartId, action }),
      })
      await fetchCarts()
    } finally {
      setActionLoading(null)
    }
  }

  // Stats
  const allNonConverted = carts.filter(c => !c.converted_at)
  const byStatus = (s: string) => allNonConverted.filter(c => c.status === s)
  const activeCount = byStatus('active').length
  const abandonedCount = byStatus('abandoned').length
  const remindedCount = byStatus('reminded').length
  const recoveredCount = carts.filter(c => c.status === 'recovered').length
  const totalAbandoned = abandonedCount + remindedCount + recoveredCount
  const recoveryRate = totalAbandoned > 0 ? Math.round((recoveredCount / totalAbandoned) * 100) : 0
  const potentialRevenue = [...byStatus('abandoned'), ...byStatus('reminded')].reduce((s, c) => s + c.subtotal, 0)
  const recoveredRevenue = carts.filter(c => c.status === 'recovered').reduce((s, c) => s + c.subtotal, 0)

  const filtered = carts.filter(cart => {
    if (filter !== 'all' && cart.status !== filter) return false
    if (hasEmailFilter && !cart.user_email) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Paniers</h1>
          <p className="text-admin-muted text-sm">Suivi des paniers actifs, abandonnés et récupérés</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); fetchCarts() }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<ShoppingCart className="w-5 h-5" />} color="blue" label="Paniers actifs" value={activeCount} />
        <Stat icon={<AlertTriangle className="w-5 h-5" />} color="orange" label="Abandonnés" value={abandonedCount + remindedCount}
          sub={remindedCount > 0 ? `${remindedCount} relancé${remindedCount > 1 ? 's' : ''}` : undefined} />
        <Stat icon={<TrendingUp className="w-5 h-5" />} color="emerald" label="Récupérés" value={`${recoveredCount} (${recoveryRate}%)`} />
        <Stat icon={<Euro className="w-5 h-5" />} color="gold" label="CA potentiel" value={`${potentialRevenue.toFixed(0)} €`}
          sub={recoveredRevenue > 0 ? `${recoveredRevenue.toFixed(0)} € récupérés` : undefined} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-admin-muted" />
        {(['all', 'active', 'abandoned', 'reminded', 'recovered', 'ignored'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? 'bg-[#19110B] text-white' : 'bg-admin-surface border border-admin-border hover:bg-admin-surface-alt'
            }`}
          >
            {s === 'all' ? `Tous (${carts.length})` : `${STATUS_LABELS[s] || s} (${s === 'recovered' ? recoveredCount : byStatus(s).length})`}
          </button>
        ))}
        <button
          onClick={() => setHasEmailFilter(v => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            hasEmailFilter ? 'bg-[#C9A962] text-white' : 'bg-admin-surface border border-admin-border hover:bg-admin-surface-alt'
          }`}
        >
          <Mail className="w-3 h-3" />
          Email dispo
        </button>
      </div>

      {/* List */}
      <div className="bg-admin-surface rounded-xl shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-admin-border">
            {filtered.map(cart => {
              const isExpanded = expandedCart === cart.id
              const step = reminderStep(cart)

              return (
                <div key={cart.id} className="hover:bg-admin-surface-alt transition-colors">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedCart(isExpanded ? null : cart.id)}
                  >
                    {/* Status icon */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      cart.status === 'recovered' ? 'bg-emerald-100 text-emerald-600'
                      : cart.status === 'ignored' ? 'bg-gray-100 text-gray-400'
                      : cart.status === 'reminded' ? 'bg-blue-100 text-blue-600'
                      : cart.status === 'abandoned' ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-600'
                    }`}>
                      {cart.status === 'recovered' ? <CheckCircle className="w-5 h-5" />
                        : cart.status === 'ignored' ? <BanIcon className="w-5 h-5" />
                        : cart.status === 'reminded' ? <Send className="w-5 h-5" />
                        : cart.status === 'abandoned' ? <AlertTriangle className="w-5 h-5" />
                        : <ShoppingCart className="w-5 h-5" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {cart.user_name || cart.user_email || 'Visiteur anonyme'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[cart.status] || 'bg-gray-100'}`}>
                          {STATUS_LABELS[cart.status] || cart.status}
                        </span>
                        {step !== '—' && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">{step}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-admin-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeSince(cart.last_activity)} inactif
                        </span>
                        <span>{cart.item_count} article{cart.item_count > 1 ? 's' : ''}</span>
                        {cart.user_email && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 shrink-0" />
                            {cart.user_email}
                          </span>
                        )}
                        {cart.recovery_promo_code && (
                          <span className="text-[#C9A962] font-mono">{cart.recovery_promo_code}</span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="font-semibold">{cart.subtotal.toFixed(2)} €</p>
                      <ChevronDown className={`w-4 h-4 text-admin-light ml-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-4 border-t border-admin-border"
                    >
                      {/* Items */}
                      {cart.items?.length > 0 && (
                        <div className="pt-4 mb-4">
                          <p className="text-xs text-admin-muted uppercase tracking-wider mb-3">Articles</p>
                          <div className="space-y-2">
                            {cart.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-admin-surface-alt rounded overflow-hidden relative shrink-0">
                                  {item.image
                                    ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-admin-light" /></div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.name}</p>
                                  <p className="text-xs text-admin-muted">{item.size} × {item.quantity}</p>
                                </div>
                                <p className="text-sm font-medium shrink-0">{(item.price * item.quantity).toFixed(2)} €</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reminder timeline */}
                      <div className="mb-4 text-xs text-admin-muted space-y-1">
                        {cart.abandoned_at && <p>Abandonné le {new Date(cart.abandoned_at).toLocaleString('fr-FR')}</p>}
                        {cart.reminder_1_sent_at && <p>Rappel 1 envoyé le {new Date(cart.reminder_1_sent_at).toLocaleString('fr-FR')}</p>}
                        {cart.reminder_2_sent_at && <p>Rappel 2 envoyé le {new Date(cart.reminder_2_sent_at).toLocaleString('fr-FR')}</p>}
                        {cart.reminder_3_sent_at && <p>Rappel 3 envoyé le {new Date(cart.reminder_3_sent_at).toLocaleString('fr-FR')}</p>}
                        {cart.recovered_at && <p className="text-emerald-600">Récupéré le {new Date(cart.recovered_at).toLocaleString('fr-FR')}</p>}
                        {cart.ignored_at && <p className="text-gray-400">Ignoré le {new Date(cart.ignored_at).toLocaleString('fr-FR')}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {cart.user_profile && (
                          <button
                            onClick={() => setSelectedUser(cart.user_profile!)}
                            className="flex items-center gap-2 px-3 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#2a1d14] transition-colors text-xs"
                          >
                            <Eye className="w-3 h-3" /> Profil
                          </button>
                        )}
                        {cart.user_email && cart.status !== 'recovered' && cart.status !== 'ignored' && (
                          <a
                            href={`mailto:${cart.user_email}?subject=Votre panier vous attend !`}
                            className="flex items-center gap-2 px-3 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#b8944d] transition-colors text-xs"
                            onClick={e => e.stopPropagation()}
                          >
                            <Mail className="w-3 h-3" /> Email manuel
                          </a>
                        )}
                        {cart.status !== 'recovered' && cart.status !== 'ignored' && (
                          <>
                            <button
                              onClick={() => handleAction(cart.id, 'recover')}
                              disabled={actionLoading === cart.id + 'recover'}
                              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3" /> Marquer récupéré
                            </button>
                            <button
                              onClick={() => handleAction(cart.id, 'ignore')}
                              disabled={actionLoading === cart.id + 'ignore'}
                              className="flex items-center gap-2 px-3 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors text-xs disabled:opacity-50"
                            >
                              <BanIcon className="w-3 h-3" /> Ignorer
                            </button>
                          </>
                        )}
                      </div>
                    </m.div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-admin-light mx-auto mb-4" />
            <p className="text-admin-muted font-medium">Aucun panier</p>
          </div>
        )}
      </div>

      {/* User modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-admin-surface rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Profil utilisateur</h2>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-admin-surface-alt rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#C9A962] rounded-full flex items-center justify-center text-white text-xl font-medium">
                  {selectedUser.first_name?.[0] || selectedUser.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">
                    {selectedUser.first_name || selectedUser.last_name
                      ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim()
                      : 'Non renseigné'}
                  </p>
                  {selectedUser.is_admin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <InfoRow icon={<Mail />} label="Email" value={selectedUser.email} />
                <InfoRow icon={<Phone />} label="Téléphone" value={selectedUser.phone || 'Non renseigné'} />
                <InfoRow icon={<Calendar />} label="Inscription" value={new Date(selectedUser.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                <InfoRow icon={<User />} label="Admin" value={selectedUser.is_admin ? 'Oui' : 'Non'} />
              </div>
              <a href={`/admin/utilisateurs?user=${selectedUser.id}`} className="mt-6 flex items-center justify-center gap-2 w-full py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#2a1d14] transition-colors text-sm">
                <ExternalLink className="w-4 h-4" /> Voir dans Utilisateurs
              </a>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, color, label, value, sub }: {
  icon: React.ReactNode
  color: 'blue' | 'orange' | 'emerald' | 'gold'
  label: string
  value: string | number
  sub?: string
}) {
  const bg = { blue: 'bg-blue-100 text-blue-600', orange: 'bg-orange-100 text-orange-600', emerald: 'bg-emerald-100 text-emerald-600', gold: 'bg-[#C9A962]/20 text-[#C9A962]' }
  return (
    <div className="bg-admin-surface rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${bg[color]}`}>{icon}</div>
        <span className="text-xs text-admin-muted">{label}</span>
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-admin-muted mt-1">{sub}</p>}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-admin-surface-alt rounded-lg">
      <div className="w-5 h-5 text-admin-light">{icon}</div>
      <div>
        <p className="text-xs text-admin-muted">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
