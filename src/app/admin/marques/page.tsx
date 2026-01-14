'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  X,
  Save,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ImageUpload } from '@/components/ImageUpload'

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  created_at: string
}

interface BrandForm {
  name: string
  slug: string
  description: string
  logo: string
}

const defaultForm: BrandForm = {
  name: '',
  slug: '',
  description: '',
  logo: ''
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [form, setForm] = useState<BrandForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching brands:', error)
      } else if (data) {
        setBrands(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: generateSlug(name)
    })
  }

  const openCreateModal = () => {
    setEditingBrand(null)
    setForm(defaultForm)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand)
    setForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo: brand.logo || ''
    })
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBrand(null)
    setForm(defaultForm)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (!form.name.trim()) {
        throw new Error('Le nom de la marque est requis')
      }

      if (editingBrand) {
        // Mise à jour
        const { error: updateError } = await supabase
          .from('brands')
          .update({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            logo: form.logo || null
          })
          .eq('id', editingBrand.id)

        if (updateError) throw updateError

        setBrands(brands.map(b =>
          b.id === editingBrand.id
            ? { ...b, ...form, description: form.description || null, logo: form.logo || null }
            : b
        ))
      } else {
        // Création
        const { data, error: insertError } = await supabase
          .from('brands')
          .insert({
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            logo: form.logo || null
          })
          .select()
          .single()

        if (insertError) throw insertError

        if (data) {
          setBrands([...brands, data].sort((a, b) => a.name.localeCompare(b.name)))
        }
      }

      closeModal()
    } catch (err) {
      console.error('Error saving brand:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (brandId: string) => {
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandId)

      if (error) {
        console.error('Error deleting brand:', error)
      } else {
        setBrands(brands.filter(b => b.id !== brandId))
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setDeleteModal(null)
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-2xl font-semibold">Marques</h1>
          <p className="text-gray-500">{brands.length} marque{brands.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter une marque
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une marque..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
          />
        </div>
      </div>

      {/* Brands grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredBrands.length > 0 ? (
          filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="aspect-video bg-gray-100 relative">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{brand.name}</h3>
                {brand.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {brand.description}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-2 text-gray-400 hover:text-[#C9A962] transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModal(brand.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Aucune marque trouvée' : 'Aucune marque pour le moment'}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter votre première marque
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-medium">
                  {editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la marque *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
                    placeholder="Ex: Braza Scent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] bg-gray-50"
                    placeholder="braza-scent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] resize-none"
                    rows={3}
                    placeholder="Description de la marque..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de la marque
                  </label>
                  <ImageUpload
                    value={form.logo}
                    onChange={(url) => setForm({ ...form, logo: url })}
                    bucket="brands"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingBrand ? 'Modifier' : 'Créer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-medium mb-2">Supprimer cette marque ?</h3>
            <p className="text-gray-500 mb-6">
              Cette action est irréversible. La marque sera définitivement supprimée.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
