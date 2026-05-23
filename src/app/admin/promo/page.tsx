'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Eye,
  X,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_uses: number | null
  max_uses_per_user: number | null
  current_uses: number
  starts_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface PromoCodeUsage {
  id: string
  promo_code_id: string
  user_id: string | null
  user_email: string | null
  order_id: string | null
  order_total: number | null
  discount_applied: number | null
  used_at: string
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null)
  const [usageLogs, setUsageLogs] = useState<PromoCodeUsage[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Formulaire
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    max_uses_per_user: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
  })

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromoCodes(data || [])
    } catch (err) {
      console.error('Error fetching promo codes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageLogs = async (promoCodeId: string) => {
    setLoadingUsage(true)
    try {
      const { data, error } = await supabase
        .from('promo_code_usage')
        .select('*')
        .eq('promo_code_id', promoCodeId)
        .order('used_at', { ascending: false })

      if (error) throw error
      setUsageLogs(data || [])
    } catch (err) {
      console.error('Error fetching usage logs:', err)
    } finally {
      setLoadingUsage(false)
    }
  }

  const handleOpenModal = (code?: PromoCode) => {
    if (code) {
      setSelectedCode(code)
      setFormData({
        code: code.code,
        description: code.description || '',
        discount_type: code.discount_type,
        discount_value: code.discount_value.toString(),
        min_order_amount: code.min_order_amount?.toString() || '',
        max_uses: code.max_uses?.toString() || '',
        max_uses_per_user: code.max_uses_per_user?.toString() || '',
        starts_at: code.starts_at ? new Date(code.starts_at).toISOString().slice(0, 16) : '',
        expires_at: code.expires_at ? new Date(code.expires_at).toISOString().slice(0, 16) : '',
        is_active: code.is_active,
      })
    } else {
      setSelectedCode(null)
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_uses: '',
        max_uses_per_user: '',
        starts_at: new Date().toISOString().slice(0, 16),
        expires_at: '',
        is_active: true,
      })
    }
    setError(null)
    setShowModal(true)
  }

  const handleViewUsage = async (code: PromoCode) => {
    setSelectedCode(code)
    setShowUsageModal(true)
    await fetchUsageLogs(code.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const codeData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        max_uses_per_user: formData.max_uses_per_user ? parseInt(formData.max_uses_per_user) : null,
        starts_at: formData.starts_at || new Date().toISOString(),
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      }

      if (selectedCode) {
        // Mise à jour
        const { error } = await supabase
          .from('promo_codes')
          .update(codeData)
          .eq('id', selectedCode.id)

        if (error) throw error
      } else {
        // Création
        const { error } = await supabase
          .from('promo_codes')
          .insert(codeData)

        if (error) {
          if (error.code === '23505') {
            throw new Error('Ce code promo existe déjà')
          }
          throw error
        }
      }

      setShowModal(false)
      fetchPromoCodes()
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (code: PromoCode) => {
    if (!confirm(`Supprimer le code promo "${code.code}" ?`)) return

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', code.id)

      if (error) throw error
      fetchPromoCodes()
    } catch (err) {
      console.error('Error deleting promo code:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const toggleActive = async (code: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id)

      if (error) throw error
      fetchPromoCodes()
    } catch (err) {
      console.error('Error toggling promo code:', err)
    }
  }

  const filteredCodes = promoCodes.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (code.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getCodeStatus = (code: PromoCode) => {
    if (!code.is_active) return { label: 'Inactif', color: 'bg-admin-surface-alt text-admin-muted' }

    const now = new Date()
    const startsAt = new Date(code.starts_at)
    const expiresAt = code.expires_at ? new Date(code.expires_at) : null

    if (startsAt > now) return { label: 'Programmé', color: 'bg-blue-100 text-blue-600' }
    if (expiresAt && expiresAt < now) return { label: 'Expiré', color: 'bg-red-100 text-red-600' }
    if (code.max_uses && code.current_uses >= code.max_uses) return { label: 'Limite atteinte', color: 'bg-orange-100 text-orange-600' }

    return { label: 'Actif', color: 'bg-green-100 text-green-600' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Codes Promo</h1>
          <p className="text-admin-muted text-sm mt-1">
            Gérez vos codes promotionnels
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau code
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-light" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un code..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:border-[#C9A962]"
        />
      </div>

      {/* Liste des codes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCodes.length === 0 ? (
        <div className="text-center py-12 bg-admin-surface rounded-lg shadow-sm">
          <Tag className="w-12 h-12 text-admin-light mx-auto mb-4" />
          <p className="text-admin-muted">Aucun code promo trouvé</p>
        </div>
      ) : (
        <div className="bg-admin-surface rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-admin-surface-alt border-b border-admin-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Réduction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Utilisations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Validité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredCodes.map((code) => {
                  const status = getCodeStatus(code)
                  return (
                    <tr key={code.id} className="hover:bg-admin-surface-alt">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono font-semibold text-[#19110B]">{code.code}</p>
                          {code.description && (
                            <p className="text-sm text-admin-muted truncate max-w-xs">{code.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {code.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-[#C9A962]" />
                              <span className="font-medium">{code.discount_value}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-[#C9A962]" />
                              <span className="font-medium">{code.discount_value} €</span>
                            </>
                          )}
                        </div>
                        {code.min_order_amount > 0 && (
                          <p className="text-xs text-admin-muted">Min. {code.min_order_amount} €</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-admin-light" />
                          <span>
                            {code.current_uses}
                            {code.max_uses && ` / ${code.max_uses}`}
                          </span>
                        </div>
                        {code.max_uses_per_user && (
                          <p className="text-xs text-admin-muted mt-0.5">
                            {code.max_uses_per_user}× / compte
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {code.expires_at ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-admin-light" />
                              <span>
                                {new Date(code.expires_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-admin-light">Illimité</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewUsage(code)}
                            className="p-2 hover:bg-admin-surface-alt rounded-lg transition-colors"
                            title="Voir les utilisations"
                          >
                            <Eye className="w-4 h-4 text-admin-muted" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(code)}
                            className="p-2 hover:bg-admin-surface-alt rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4 text-admin-muted" />
                          </button>
                          <button
                            onClick={() => toggleActive(code)}
                            className="p-2 hover:bg-admin-surface-alt rounded-lg transition-colors"
                            title={code.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {code.is_active ? (
                              <X className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(code)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Création/Edition */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-admin-surface rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {selectedCode ? 'Modifier le code promo' : 'Nouveau code promo'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-admin-surface-alt rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-admin-text mb-1">
                  Code promo *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BIENVENUE20"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% de réduction pour les nouveaux clients"
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1">
                    Type de réduction *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1">
                    Valeur *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-admin-text mb-1">
                  Montant minimum de commande (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="50.00"
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1">
                    Utilisations max (total)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Illimité"
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                  <p className="text-xs text-admin-muted mt-1">Laisser vide pour illimité</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1">
                    Utilisations max par compte
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                    placeholder="Illimité"
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                  <p className="text-xs text-admin-muted mt-1">Connexion requise si défini</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1">
                    Date de début
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-1">
                    Date de fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                  <p className="text-xs text-admin-muted mt-1">Laisser vide pour pas d'expiration</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#C9A962] border-admin-border rounded focus:ring-[#C9A962]"
                />
                <label htmlFor="is_active" className="text-sm text-admin-text">
                  Code actif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : selectedCode ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </m.div>
        </div>
      )}

      {/* Modal Logs d'utilisation */}
      {showUsageModal && selectedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-admin-surface rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">
                  Historique d'utilisation
                </h2>
                <p className="text-sm text-admin-muted font-mono">{selectedCode.code}</p>
              </div>
              <button
                onClick={() => setShowUsageModal(false)}
                className="p-2 hover:bg-admin-surface-alt rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingUsage ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : usageLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-admin-light mx-auto mb-4" />
                  <p className="text-admin-muted">Aucune utilisation enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {usageLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 bg-admin-surface-alt rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {log.user_email || 'Utilisateur anonyme'}
                        </p>
                        {log.order_id && (
                          <p className="text-sm text-admin-muted">
                            Commande: {log.order_id}
                          </p>
                        )}
                        <p className="text-xs text-admin-light">
                          {new Date(log.used_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        {log.discount_applied && (
                          <p className="font-medium text-green-600">
                            -{log.discount_applied.toFixed(2)} €
                          </p>
                        )}
                        {log.order_total && (
                          <p className="text-sm text-admin-muted">
                            Total: {log.order_total.toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-admin-surface-alt">
              <div className="flex items-center justify-between text-sm">
                <span className="text-admin-muted">
                  Total utilisations: <strong>{selectedCode.current_uses}</strong>
                  {selectedCode.max_uses && ` / ${selectedCode.max_uses}`}
                </span>
                <button
                  onClick={() => setShowUsageModal(false)}
                  className="px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
