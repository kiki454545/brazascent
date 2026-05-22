'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import { Plus, Edit, Trash2, Truck, Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ShippingMethod {
  id: string
  title: string
  description: string | null
  description_2: string | null
  price: number
  image_url: string | null
  badge: string | null
  free_threshold: number | null
  sort_order: number
  enabled: boolean
}

interface FormState {
  title: string
  description: string
  description_2: string
  price: string
  image_url: string
  badge: string
  free_threshold: string
  sort_order: string
  enabled: boolean
}

const emptyForm: FormState = {
  title: '',
  description: '',
  description_2: '',
  price: '',
  image_url: '',
  badge: '',
  free_threshold: '',
  sort_order: '0',
  enabled: true,
}

export default function ShippingMethodsAdminPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ShippingMethod | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadMethods = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error loading shipping methods:', error)
    } else {
      setMethods(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMethods()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, sort_order: String(methods.length + 1) })
    setError(null)
    setShowModal(true)
  }

  const openEdit = (m: ShippingMethod) => {
    setEditing(m)
    setForm({
      title: m.title,
      description: m.description ?? '',
      description_2: m.description_2 ?? '',
      price: String(m.price),
      image_url: m.image_url ?? '',
      badge: m.badge ?? '',
      free_threshold: m.free_threshold !== null ? String(m.free_threshold) : '',
      sort_order: String(m.sort_order),
      enabled: m.enabled,
    })
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
    setError(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `method-${Date.now()}.${fileExt}`
      const { error: upErr } = await supabase.storage
        .from('shipping-methods')
        .upload(fileName, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage
        .from('shipping-methods')
        .getPublicUrl(fileName)
      setForm(prev => ({ ...prev, image_url: publicUrl }))
    } catch (err) {
      console.error('Upload error:', err)
      setError('Erreur lors du téléchargement de l\'image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (!form.title.trim()) throw new Error('Le titre est requis')
      const priceNum = parseFloat(form.price)
      if (Number.isNaN(priceNum) || priceNum < 0) throw new Error('Prix invalide')

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        description_2: form.description_2.trim() || null,
        price: priceNum,
        image_url: form.image_url.trim() || null,
        badge: form.badge.trim() || null,
        free_threshold: form.free_threshold.trim() ? parseFloat(form.free_threshold) : null,
        sort_order: parseInt(form.sort_order) || 0,
        enabled: form.enabled,
        updated_at: new Date().toISOString(),
      }

      if (editing) {
        const { error: upErr } = await supabase
          .from('shipping_methods')
          .update(payload)
          .eq('id', editing.id)
        if (upErr) throw upErr
      } else {
        const { error: insErr } = await supabase
          .from('shipping_methods')
          .insert(payload)
        if (insErr) throw insErr
      }

      await loadMethods()
      closeModal()
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', deleteId)
    if (error) {
      console.error('Delete error:', error)
    } else {
      setMethods(methods.filter(m => m.id !== deleteId))
    }
    setDeleteId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#C9A962] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Modes de livraison</h1>
          <p className="text-admin-muted">
            {methods.length} méthode{methods.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une méthode
        </button>
      </div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {methods.map(method => (
          <div
            key={method.id}
            className={`bg-admin-surface rounded-xl shadow-sm overflow-hidden ${
              !method.enabled ? 'opacity-50' : ''
            }`}
          >
            <div className="aspect-video bg-admin-surface-alt relative">
              {method.image_url ? (
                <Image
                  src={method.image_url}
                  alt={method.title}
                  fill
                  className="object-contain p-6"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Truck className="w-12 h-12 text-admin-light" />
                </div>
              )}
              {method.badge && (
                <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-admin-surface text-admin-text border border-[#C9A962]/40 rounded">
                  {method.badge}
                </span>
              )}
              {!method.enabled && (
                <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                  Désactivée
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-medium">{method.title}</h3>
                <span className="font-semibold whitespace-nowrap">
                  {Number(method.price).toFixed(2)} €
                </span>
              </div>
              {method.description && (
                <p className="text-sm text-admin-muted">{method.description}</p>
              )}
              {method.description_2 && (
                <p className="text-sm text-admin-muted">{method.description_2}</p>
              )}
              {method.free_threshold !== null && (
                <p className="text-xs text-green-600 mt-2">
                  Gratuit dès {Number(method.free_threshold).toFixed(2)} €
                </p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-admin-border">
                <span className="text-xs text-admin-light">Ordre: {method.sort_order}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(method)}
                    className="p-2 text-admin-light hover:text-[#C9A962] transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(method.id)}
                    className="p-2 text-admin-light hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <div className="col-span-full bg-admin-surface rounded-xl shadow-sm p-12 text-center">
            <Truck className="w-12 h-12 text-admin-light mx-auto mb-4" />
            <p className="text-admin-muted">Aucune méthode de livraison configurée</p>
          </div>
        )}
      </m.div>

      {/* Modal édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-admin-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-admin-border sticky top-0 bg-admin-surface">
              <h2 className="text-xl font-semibold">
                {editing ? 'Modifier la méthode' : 'Nouvelle méthode'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-admin-surface-alt rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Point Relais Mondial Relay"
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Livraison en point relais"
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">2ème description</label>
                <input
                  type="text"
                  value={form.description_2}
                  onChange={e => setForm({ ...form, description_2: e.target.value })}
                  placeholder="3 à 5 jours ouvrés"
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prix (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seuil gratuit (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.free_threshold}
                    onChange={e => setForm({ ...form, free_threshold: e.target.value })}
                    placeholder="Vide = jamais gratuit"
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Badge</label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={e => setForm({ ...form, badge: e.target.value })}
                    placeholder="Le meilleur prix"
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ordre d&apos;affichage</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm({ ...form, sort_order: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image / icône</label>
                <div className="flex items-center gap-4">
                  {form.image_url ? (
                    <div className="w-20 h-20 relative border rounded-lg overflow-hidden bg-admin-surface-alt">
                      <Image
                        src={form.image_url}
                        alt="Aperçu"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 border border-admin-border rounded-lg bg-admin-surface-alt flex items-center justify-center">
                      <Truck className="w-8 h-8 text-admin-light" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-admin-surface-alt w-fit">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {uploading ? 'Upload...' : 'Choisir une image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: '' })}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Supprimer l&apos;image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={e => setForm({ ...form, enabled: e.target.checked })}
                  className="w-5 h-5 accent-[#C9A962]"
                />
                <span className="text-sm">
                  Méthode active (visible par les clients)
                </span>
              </label>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 border rounded-lg hover:bg-admin-surface-alt"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-admin-surface rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Supprimer cette méthode ?</h3>
            <p className="text-sm text-admin-muted mb-4">
              Les commandes existantes utilisant cette méthode garderont leur libellé mais le lien sera rompu.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-admin-surface-alt"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
