'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { m } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  Package,
  Upload
} from 'lucide-react'
import { supabase, supabaseFetch } from '@/lib/supabase'

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

// Invalide le cache ISR de /packs et /packs/[slug] — sans ça les changements
// (ex. désactivation d'un pack) mettent jusqu'à 24h à apparaître sur le site.
async function revalidatePacks(slug?: string) {
  try {
    await fetch('/api/admin/revalidate-packs', {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ slug: slug ?? null }),
    })
  } catch (error) {
    console.error('Error revalidating packs pages:', error)
  }
}

interface Pack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  product_ids: string[]
  product_selections: ProductSelection[] | null
  tag: string | null
  is_active: boolean
  promo_allowed: boolean
  allow_size_choice: boolean
  discount_percentage: number | null
  created_at: string
}

interface Product {
  id: string
  name: string
  images: string[]
  price: number
  sizes: string[]
  price_by_size: Record<string, number> | null
}

interface ProductSelection {
  productId: string
  size: string
}

interface PackForm {
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  product_ids: string[]
  product_selections: ProductSelection[]
  tag: string
  is_active: boolean
  promo_allowed: boolean
  allow_size_choice: boolean
  discount_percentage: number | null
}

const emptyForm: PackForm = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  original_price: null,
  image: '',
  product_ids: [],
  product_selections: [],
  tag: '',
  is_active: true,
  promo_allowed: true,
  allow_size_choice: false,
  discount_percentage: null,
}

export default function AdminPacksPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPack, setEditingPack] = useState<Pack | null>(null)
  const [form, setForm] = useState<PackForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchPacks()
    fetchProducts()
  }, [])

  const fetchPacks = async () => {
    try {
      const { data, error } = await supabaseFetch<Pack[]>('packs', {
        order: { column: 'created_at', ascending: false }
      })

      if (error) {
        console.error('Error fetching packs:', error)
        return
      }
      setPacks(data || [])
    } catch (error) {
      console.error('Error fetching packs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabaseFetch<Product[]>('products', {
        select: 'id, name, images, price, sizes, price_by_size',
        order: { column: 'name', ascending: true }
      })

      if (error) {
        console.error('Error fetching products:', error)
        return
      }
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `pack-${Date.now()}.${fileExt}`
      const filePath = `packs/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, image: publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Erreur lors du téléchargement de l\'image')
    } finally {
      setUploading(false)
    }
  }

  const openCreateModal = () => {
    setEditingPack(null)
    setForm(emptyForm)
    setError(null)
    setShowModal(true)
  }

  const openEditModal = (pack: Pack) => {
    setEditingPack(pack)
    // Utiliser les sélections sauvegardées ou reconstituer avec les tailles par défaut
    let selections: ProductSelection[]
    if (pack.product_selections && pack.product_selections.length > 0) {
      selections = pack.product_selections
    } else {
      // Fallback pour les packs existants sans product_selections
      selections = (pack.product_ids || []).map(id => {
        const product = products.find(p => p.id === id)
        const defaultSize = product?.sizes?.[0] || ''
        return { productId: id, size: defaultSize }
      })
    }
    setForm({
      name: pack.name,
      slug: pack.slug,
      description: pack.description,
      price: pack.price,
      original_price: pack.original_price,
      image: pack.image,
      product_ids: pack.product_ids || [],
      product_selections: selections,
      tag: pack.tag || '',
      is_active: pack.is_active ?? true,
      promo_allowed: pack.promo_allowed ?? true,
      allow_size_choice: pack.allow_size_choice ?? false,
      discount_percentage: pack.discount_percentage ?? null,
    })
    setError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!form.name.trim()) {
        throw new Error('Le nom du pack est requis')
      }
      if (!form.image) {
        throw new Error('Une image est requise')
      }
      if (form.product_ids.length === 0) {
        throw new Error('Sélectionnez au moins un produit')
      }
      if (form.price <= 0) {
        throw new Error('Le prix doit être supérieur à 0')
      }

      const packData = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description,
        price: form.discount_percentage ? parseFloat(calculatedPackPrice().toFixed(2)) : form.price,
        original_price: form.original_price || null,
        image: form.image,
        product_ids: form.product_ids,
        product_selections: form.product_selections,
        tag: form.tag || null,
        is_active: form.is_active,
        promo_allowed: form.promo_allowed,
        allow_size_choice: form.allow_size_choice,
        discount_percentage: form.discount_percentage,
      }

      console.log('Saving pack data:', packData)

      if (editingPack) {
        const { error, data } = await supabase
          .from('packs')
          .update(packData)
          .eq('id', editingPack.id)
          .select()

        console.log('Update result:', { error, data })
        if (error) throw error
      } else {
        const { error, data } = await supabase
          .from('packs')
          .insert(packData)
          .select()

        console.log('Insert result:', { error, data })
        if (error) throw error
      }

      await revalidatePacks(packData.slug)
      setShowModal(false)
      fetchPacks()
    } catch (error: any) {
      console.error('Save error:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pack: Pack) => {
    if (!confirm(`Supprimer le pack "${pack.name}" ?`)) return

    try {
      const { error } = await supabase
        .from('packs')
        .delete()
        .eq('id', pack.id)

      if (error) {
        console.error('Error deleting pack:', error)
        return
      }
      await revalidatePacks(pack.slug)
      fetchPacks()
    } catch (error) {
      console.error('Error deleting pack:', error)
    }
  }

  const toggleProductSelection = (productId: string) => {
    const product = products.find(p => p.id === productId)
    const defaultSize = product?.sizes?.[0] || ''

    setForm(prev => {
      const isSelected = prev.product_ids.includes(productId)
      return {
        ...prev,
        product_ids: isSelected
          ? prev.product_ids.filter(id => id !== productId)
          : [...prev.product_ids, productId],
        product_selections: isSelected
          ? prev.product_selections.filter(s => s.productId !== productId)
          : [...prev.product_selections, { productId, size: defaultSize }]
      }
    })
  }

  const updateProductSize = (productId: string, size: string) => {
    setForm(prev => ({
      ...prev,
      product_selections: prev.product_selections.map(s =>
        s.productId === productId ? { ...s, size } : s
      )
    }))
  }

  const getProductPrice = (product: Product, size: string): number => {
    if (product.price_by_size && product.price_by_size[size] > 0) {
      return product.price_by_size[size]
    }
    return product.price
  }

  const calculateTotalOriginalPrice = (): number => {
    return form.product_selections.reduce((total, selection) => {
      const product = products.find(p => p.id === selection.productId)
      if (!product) return total
      return total + getProductPrice(product, selection.size)
    }, 0)
  }

  const calculatedPackPrice = (): number => {
    if (!form.discount_percentage) return form.price
    const total = calculateTotalOriginalPrice()
    return total * (1 - form.discount_percentage / 100)
  }

  const filteredPacks = packs.filter(pack =>
    pack.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSelectedProducts = () => {
    return products.filter(p => form.product_ids.includes(p.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Packs</h1>
          <p className="text-admin-muted">{packs.length} pack(s)</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#B8984F] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau pack
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-light" />
          <input
            type="text"
            placeholder="Rechercher un pack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962] focus:border-transparent"
          />
        </div>
      </div>

      {/* Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacks.map((pack) => (
          <m.div
            key={pack.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-admin-surface rounded-lg shadow-sm overflow-hidden"
          >
            <div className="relative aspect-square">
              {pack.image ? (
                <Image
                  src={pack.image}
                  alt={pack.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-admin-surface-alt flex items-center justify-center">
                  <Package className="w-12 h-12 text-admin-light" />
                </div>
              )}
              {pack.tag && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-[#C9A962] text-white text-xs rounded">
                  {pack.tag}
                </span>
              )}
              {!pack.is_active && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                  Inactif
                </span>
              )}
              {pack.promo_allowed === false && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs rounded">
                  Sans promo
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-1">{pack.name}</h3>
              <p className="text-sm text-admin-muted mb-2 line-clamp-2">{pack.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold">{pack.price} €</span>
                {pack.original_price && (
                  <span className="text-sm text-admin-light line-through">{pack.original_price} €</span>
                )}
              </div>
              <p className="text-xs text-admin-light mb-3">
                {pack.product_ids?.length || 0} produit(s)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(pack)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-admin-border rounded hover:bg-admin-surface-alt transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(pack)}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </m.div>
        ))}
      </div>

      {filteredPacks.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-admin-light mx-auto mb-4" />
          <p className="text-admin-muted">Aucun pack trouvé</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-admin-surface rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-admin-surface border-b border-admin-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingPack ? 'Modifier le pack' : 'Nouveau pack'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-admin-surface-alt rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Image du pack *</label>
                <div className="flex items-start gap-4">
                  {form.image ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                      <Image
                        src={form.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-32 h-32 border-2 border-dashed border-admin-border rounded-lg flex flex-col items-center justify-center hover:border-[#C9A962] transition-colors"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-admin-light" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-admin-light mb-1" />
                          <span className="text-xs text-admin-muted">Ajouter</span>
                        </>
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Name & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du pack *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                    placeholder="Coffret Découverte"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                    placeholder="coffret-decouverte"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                  placeholder="Description du pack..."
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prix (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prix barré (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.original_price || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, original_price: parseFloat(e.target.value) || null }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                    placeholder="Optionnel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tag</label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="w-full px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                    placeholder="Bestseller, Nouveau..."
                  />
                </div>
              </div>

              {/* Products Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Produits inclus * ({form.product_ids.length} sélectionné(s))
                </label>
                <div className="border border-admin-border rounded-lg max-h-64 overflow-y-auto">
                  {products.map((product) => {
                    const prices = product.price_by_size
                      ? Object.values(product.price_by_size).filter(p => p > 0)
                      : []
                    const minPrice = prices.length > 0 ? Math.min(...prices) : product.price
                    return (
                      <label
                        key={product.id}
                        className={`flex items-center gap-3 p-3 hover:bg-admin-surface-alt cursor-pointer border-b last:border-0 ${
                          form.product_ids.includes(product.id) ? 'bg-[#C9A962]/10' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.product_ids.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 text-[#C9A962] rounded focus:ring-[#C9A962]"
                        />
                        {product.images?.[0] && (
                          <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-admin-muted">Dès {minPrice || 0} €</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Selected Products with Size Selection */}
              {form.product_ids.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">Contenu du pack (avec tailles)</label>
                    <span className="text-sm text-admin-muted">
                      Total : {calculateTotalOriginalPrice().toFixed(2)} €
                    </span>
                  </div>
                  <div className="border border-admin-border rounded-lg divide-y">
                    {getSelectedProducts().map((product) => {
                      const selection = form.product_selections.find(s => s.productId === product.id)
                      const selectedSize = selection?.size || product.sizes?.[0] || ''
                      const currentPrice = getProductPrice(product, selectedSize)

                      return (
                        <div key={product.id} className="flex items-center gap-3 p-3">
                          {product.images?.[0] && (
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                          </div>
                          <select
                            value={selectedSize}
                            onChange={(e) => updateProductSize(product.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 border border-admin-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A962]"
                          >
                            {product.sizes?.map((size) => (
                              <option key={size} value={size}>
                                {size} - {getProductPrice(product, size)} €
                              </option>
                            ))}
                          </select>
                          <span className="font-medium text-[#C9A962] w-16 text-right">
                            {currentPrice} €
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleProductSelection(product.id)}
                            className="p-1 text-admin-light hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-admin-muted mt-2">
                    Astuce : Le prix barré peut correspondre au total des produits individuels ({calculateTotalOriginalPrice().toFixed(2)} €)
                  </p>
                </div>
              )}

              {/* Choix du format par le client */}
              <div className="space-y-3 p-4 border border-admin-border rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_size_choice"
                    checked={form.allow_size_choice}
                    onChange={(e) => setForm(prev => ({ ...prev, allow_size_choice: e.target.checked }))}
                    className="w-4 h-4 text-[#C9A962] rounded focus:ring-[#C9A962]"
                  />
                  <label htmlFor="allow_size_choice" className="text-sm font-medium">
                    Permettre au client de choisir le format de chaque parfum
                  </label>
                </div>
                {form.allow_size_choice && (
                  <p className="text-xs text-admin-muted ml-6">
                    Le client pourra changer la taille (2ml, 5ml, 10ml…) de chaque parfum sur la page du pack. Le prix s'adaptera automatiquement si un pourcentage de réduction est défini.
                  </p>
                )}
              </div>

              {/* Pourcentage de réduction automatique */}
              <div className="space-y-3 p-4 border border-admin-border rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="use_discount_pct"
                    checked={form.discount_percentage !== null}
                    onChange={(e) => setForm(prev => ({ ...prev, discount_percentage: e.target.checked ? 10 : null }))}
                    className="w-4 h-4 text-[#C9A962] rounded focus:ring-[#C9A962]"
                  />
                  <label htmlFor="use_discount_pct" className="text-sm font-medium">
                    Calculer le prix par pourcentage de réduction
                  </label>
                </div>
                {form.discount_percentage !== null && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={form.discount_percentage}
                          onChange={(e) => setForm(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-3 py-2 border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A962] text-center font-bold"
                        />
                        <span className="text-lg font-bold text-[#C9A962]">%</span>
                      </div>
                      <span className="text-sm text-admin-muted">de réduction sur le total des produits</span>
                    </div>
                    {form.product_ids.length > 0 && (
                      <div className="p-3 bg-[#C9A962]/10 rounded-lg">
                        <p className="text-xs text-admin-muted">Total produits (tailles fixes) : <strong>{calculateTotalOriginalPrice().toFixed(2)} €</strong></p>
                        <p className="text-sm font-semibold text-[#C9A962] mt-1">
                          Prix du pack calculé : {calculatedPackPrice().toFixed(2)} €
                          <span className="text-xs font-normal text-admin-muted ml-2">(sauvegardé automatiquement)</span>
                        </p>
                        {form.allow_size_choice && (
                          <p className="text-xs text-amber-600 mt-1">
                            Avec le choix de format activé, ce prix recalcule en temps réel côté client selon les tailles choisies.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-[#C9A962] rounded focus:ring-[#C9A962]"
                />
                <label htmlFor="is_active" className="text-sm">Pack actif (visible sur le site)</label>
              </div>

              {/* Promo Allowed */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="promo_allowed"
                  checked={form.promo_allowed}
                  onChange={(e) => setForm(prev => ({ ...prev, promo_allowed: e.target.checked }))}
                  className="w-4 h-4 text-[#C9A962] rounded focus:ring-[#C9A962]"
                />
                <label htmlFor="promo_allowed" className="text-sm">Codes promo autorisés sur ce pack</label>
              </div>
              {!form.promo_allowed && (
                <p className="text-xs text-amber-600 ml-6">
                  Un avertissement sera affiché sur la page du pack indiquant que les codes promo ne sont pas utilisables.
                </p>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-admin-border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#B8984F] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {editingPack ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </m.div>
        </div>
      )}
    </div>
  )
}
