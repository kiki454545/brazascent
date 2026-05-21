'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Save,
  Loader2,
  GripVertical,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Helper pour ignorer les AbortError
const isAbortError = (error: unknown): boolean => {
  if (!error) return false
  const err = error as { name?: string; message?: string }
  return err.name === 'AbortError' ||
         err.message?.includes('AbortError') ||
         err.message?.includes('signal is aborted') ||
         false
}

interface Accord {
  name: string
  color: string
  intensity: number
}

interface AccordIA {
  nom: string
  intensite: number
  couleur: string
}

interface ProductForm {
  name: string
  slug: string
  brand: string
  short_description: string
  description: string
  price: number
  original_price: number | null
  category: string
  sizes: string[]
  stock_by_size: Record<string, number>
  price_by_size: Record<string, number>
  notes_top: string[]
  notes_heart: string[]
  notes_base: string[]
  main_accords: Accord[]
  note_images: Record<string, string>
  accords: AccordIA[]
  images: string[]
  stock: number
  is_new: boolean
  is_bestseller: boolean
  is_active: boolean
  is_promo: boolean
  unlimited_stock: boolean
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'inventory'>('info')

  const [form, setForm] = useState<ProductForm>({
    name: '',
    slug: '',
    brand: 'Braza Scent',
    short_description: '',
    description: '',
    price: 0,
    original_price: null,
    category: 'Eau de Parfum',
    sizes: ['2ml', '5ml', '10ml'],
    stock_by_size: { '2ml': 50, '5ml': 50, '10ml': 50 },
    price_by_size: { '2ml': 10, '5ml': 20, '10ml': 35 },
    notes_top: [],
    notes_heart: [],
    notes_base: [],
    main_accords: [],
    note_images: {},
    accords: [],
    images: [],
    stock: 150,
    is_new: true,
    is_bestseller: false,
    is_active: true,
    is_promo: false,
    unlimited_stock: false
  })

  const [newNote, setNewNote] = useState({ top: '', heart: '', base: '' })
  const [newSize, setNewSize] = useState('')
  const [generatingAccords, setGeneratingAccords] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [accordsText, setAccordsText] = useState('')

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (data) {
        const sizes = data.sizes || ['2ml', '5ml', '10ml']
        const stockBySize = data.stock_by_size || sizes.reduce((acc: Record<string, number>, size: string) => {
          acc[size] = Math.floor((data.stock || 0) / sizes.length)
          return acc
        }, {})
        const rawPriceBySize = typeof data.price_by_size === 'string'
          ? JSON.parse(data.price_by_size)
          : data.price_by_size
        const priceBySize = rawPriceBySize || sizes.reduce((acc: Record<string, number>, size: string) => {
          acc[size] = data.price || 0
          return acc
        }, {})
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          brand: data.brand || 'Braza Scent',
          short_description: data.short_description || '',
          description: data.description || '',
          price: data.price || 0,
          original_price: data.original_price || null,
          category: data.category || 'Eau de Parfum',
          sizes: sizes,
          stock_by_size: stockBySize,
          price_by_size: priceBySize,
          notes_top: data.notes_top || [],
          notes_heart: data.notes_heart || [],
          notes_base: data.notes_base || [],
          main_accords: data.main_accords || [],
          note_images: data.note_images || {},
          accords: data.accords || [],
          images: data.images || [],
          stock: data.stock || 0,
          is_new: data.is_new ?? true,
          is_bestseller: data.is_bestseller ?? false,
          is_active: data.is_active ?? true,
          is_promo: data.is_promo ?? false,
          unlimited_stock: data.unlimited_stock ?? false
        })
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Error fetching product:', err)
        setError('Produit non trouvé')
      }
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!form.name.trim()) {
        throw new Error('Le nom du produit est requis')
      }
      if (form.sizes.length === 0) {
        throw new Error('Ajoutez au moins une taille')
      }
      const hasValidPrice = Object.values(form.price_by_size).some(price => price > 0)
      if (!hasValidPrice) {
        throw new Error('Au moins une taille doit avoir un prix supérieur à 0')
      }
      if (form.images.length === 0) {
        throw new Error('Ajoutez au moins une image')
      }

      // Essayer d'abord avec unlimited_stock
      let updateData: Record<string, any> = {
        name: form.name,
        slug: form.slug,
        brand: form.brand,
        short_description: form.short_description,
        description: form.description,
        price: form.price,
        original_price: form.original_price,
        category: form.category,
        sizes: form.sizes,
        stock_by_size: form.stock_by_size,
        price_by_size: form.price_by_size,
        notes_top: form.notes_top,
        notes_heart: form.notes_heart,
        notes_base: form.notes_base,
        main_accords: form.main_accords,
        note_images: form.note_images,
        accords: form.accords,
        images: form.images,
        stock: form.stock,
        is_new: form.is_new,
        is_bestseller: form.is_bestseller,
        is_active: form.is_active,
        is_promo: form.is_promo,
        unlimited_stock: form.unlimited_stock
      }

      console.log('Updating product with data:', updateData)

      let { data, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()

      // Si erreur liée à unlimited_stock, réessayer sans ce champ
      if (updateError && (updateError.message?.includes('unlimited_stock') || updateError.code === '42703')) {
        console.log('Column unlimited_stock does not exist, retrying without it')
        const { unlimited_stock, ...dataWithoutUnlimited } = updateData
        const retryResult = await supabase
          .from('products')
          .update(dataWithoutUnlimited)
          .eq('id', productId)
          .select()
        data = retryResult.data
        updateError = retryResult.error
      }

      console.log('Update result:', { data, error: updateError })

      if (updateError) {
        console.error('Supabase error details:', JSON.stringify(updateError, null, 2))
        throw new Error(updateError.message || 'Erreur lors de la mise à jour dans la base de données')
      }

      router.push('/admin/produits')
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Error updating product:', err)
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Seules les images sont acceptées')
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('La taille maximale est de 5MB par image')
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          const localUrl = URL.createObjectURL(file)
          uploadedUrls.push(localUrl)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(filePath)
          uploadedUrls.push(publicUrl)
        }
      }

      setForm({ ...form, images: [...form.images, ...uploadedUrls] })
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Error uploading images:', err)
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...form.images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setForm({ ...form, images: newImages })
  }

  const addNote = (type: 'top' | 'heart' | 'base') => {
    const key = `notes_${type}` as keyof ProductForm
    const noteValue = newNote[type].trim()
    if (noteValue && !(form[key] as string[]).includes(noteValue)) {
      setForm({
        ...form,
        [key]: [...(form[key] as string[]), noteValue]
      })
      setNewNote({ ...newNote, [type]: '' })
    }
  }

  const removeNote = (type: 'top' | 'heart' | 'base', index: number) => {
    const key = `notes_${type}` as keyof ProductForm
    setForm({
      ...form,
      [key]: (form[key] as string[]).filter((_, i) => i !== index)
    })
  }

  const addAccord = () => {
    setForm({ ...form, main_accords: [...form.main_accords, { name: '', color: '#C9A962', intensity: 50 }] })
  }

  const removeAccord = (index: number) => {
    setForm({ ...form, main_accords: form.main_accords.filter((_, i) => i !== index) })
  }

  const updateAccord = (index: number, field: keyof Accord, value: string | number) => {
    const updated = [...form.main_accords]
    updated[index] = { ...updated[index], [field]: value }
    setForm({ ...form, main_accords: updated })
  }

  const updateNoteImage = (note: string, url: string) => {
    setForm({ ...form, note_images: { ...form.note_images, [note]: url } })
  }

  const ACCORD_COLORS: Record<string, string> = {
    // FR
    'boisé': '#8B6B14', 'boise': '#8B6B14',
    'musqué': '#C4A882', 'musque': '#C4A882', 'musc': '#C4A882',
    'vanillé': '#F5C842', 'vanille': '#F5C842',
    'ambré': '#CC7722', 'ambre': '#CC7722',
    'épicé': '#C4541A', 'epice': '#C4541A',
    'floral': '#E8A0BF', 'fleuri': '#E8A0BF',
    'frais': '#4A9EBF', 'fraîche': '#4A9EBF',
    'oriental': '#8B3A3A',
    'agrume': '#F4A523', 'agrumes': '#F4A523', 'citrus': '#F4A523',
    'aquatique': '#2E86AB', 'marin': '#2E86AB',
    'poudré': '#D4A5A5', 'pudre': '#D4A5A5',
    'vert': '#5A8A3C', 'végétal': '#5A8A3C',
    'gourmand': '#8B4513',
    'chypré': '#6B8E23', 'chypre': '#6B8E23',
    'fougère': '#4A7B4F', 'fougere': '#4A7B4F',
    'cuir': '#7B4B2A', 'leather': '#7B4B2A',
    'baume': '#9B7B3A',
    'fumé': '#696969', 'fume': '#696969',
    'sucré': '#E88080', 'sucre': '#E88080',
    'terreux': '#8B7355',
    // EN
    'woody': '#8B6B14', 'wood': '#8B6B14',
    'musk': '#C4A882', 'musky': '#C4A882',
    'vanilla': '#F5C842',
    'amber': '#CC7722', 'ambery': '#CC7722',
    'spicy': '#C4541A', 'spice': '#C4541A',
    'rose': '#E8799A',
    'fresh': '#4A9EBF',
    'aquatic': '#2E86AB',
    'powdery': '#D4A5A5',
    'green': '#5A8A3C',
    'sweet': '#E88080',
    'smoky': '#696969',
    'earthy': '#8B7355',
    'cedar': '#A0714F',
    'sandalwood': '#C4956A',
    'oud': '#5C3317',
    'patchouli': '#6B4E3D',
    'vetiver': '#7D8C4F',
  }

  const applyAccordsFromText = () => {
    const names = accordsText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (names.length === 0) return
    const step = names.length > 1 ? Math.round(45 / (names.length - 1)) : 0
    const accords = names.map((nom, i) => {
      const key = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      const couleur =
        ACCORD_COLORS[nom.toLowerCase()] ||
        ACCORD_COLORS[key] ||
        '#C9A962'
      return { nom, intensite: Math.round(88 - i * step), couleur }
    })
    setForm((prev) => ({ ...prev, accords }))
  }

  const generateAccords = async () => {
    setGeneratingAccords(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/admin/generate-accords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.name, marque: form.brand }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur API')
      setForm((prev) => ({ ...prev, accords: json.accords }))
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setGeneratingAccords(false)
    }
  }

  const addSize = () => {
    const size = newSize.trim()
    if (size && !form.sizes.includes(size)) {
      const newStockBySize = { ...form.stock_by_size, [size]: 50 }
      const newPriceBySize = { ...form.price_by_size, [size]: 0 }
      const totalStock = Object.values(newStockBySize).reduce((a, b) => a + b, 0)
      setForm({
        ...form,
        sizes: [...form.sizes, size],
        stock_by_size: newStockBySize,
        price_by_size: newPriceBySize,
        stock: totalStock
      })
      setNewSize('')
    }
  }

  const removeSize = (index: number) => {
    const sizeToRemove = form.sizes[index]
    const newStockBySize = { ...form.stock_by_size }
    const newPriceBySize = { ...form.price_by_size }
    delete newStockBySize[sizeToRemove]
    delete newPriceBySize[sizeToRemove]
    const totalStock = Object.values(newStockBySize).reduce((a, b) => a + b, 0)
    setForm({
      ...form,
      sizes: form.sizes.filter((_, i) => i !== index),
      stock_by_size: newStockBySize,
      price_by_size: newPriceBySize,
      stock: totalStock
    })
  }

  const updatePriceForSize = (size: string, price: number) => {
    setForm({
      ...form,
      price_by_size: { ...form.price_by_size, [size]: price }
    })
  }

  const updateStockForSize = (size: string, stock: number) => {
    const newStockBySize = { ...form.stock_by_size, [size]: stock }
    const totalStock = Object.values(newStockBySize).reduce((a, b) => a + b, 0)
    setForm({
      ...form,
      stock_by_size: newStockBySize,
      stock: totalStock
    })
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !form.name) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/admin/produits"
          className="text-[#C9A962] hover:underline"
        >
          Retour aux produits
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/produits"
          className="p-2 hover:bg-admin-surface-alt rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Modifier le produit</h1>
          <p className="text-admin-muted">{form.name}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-admin-border">
        {[
          { id: 'info', label: 'Informations' },
          { id: 'media', label: 'Médias' },
          { id: 'inventory', label: 'Inventaire' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'info' | 'media' | 'inventory')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#C9A962] text-[#C9A962]'
                : 'border-transparent text-admin-muted hover:text-admin-text'
            }`}
          >
            {tab.label}
            {tab.id === 'media' && form.images.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#C9A962]/10 text-[#C9A962] rounded-full">
                {form.images.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'info' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Informations générales</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        name: e.target.value,
                        slug: generateSlug(e.target.value)
                      })
                    }}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                    placeholder="Ex: Oud Royal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-surface-alt border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                    placeholder="oud-royal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    Marque
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-admin-text mb-2">
                    Catégorie
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  >
                    <option value="Eau de Parfum">Eau de Parfum</option>
                    <option value="Eau de Toilette">Eau de Toilette</option>
                    <option value="Extrait de Parfum">Extrait de Parfum</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-admin-text mb-2">
                  Description courte
                </label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  placeholder="Une phrase résumant le parfum"
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-admin-text mb-2">
                  Description complète
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  placeholder="Description détaillée du parfum..."
                />
              </div>
            </div>

            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-1">Notes olfactives</h2>
              <p className="text-xs text-admin-light mb-4">Colle les noms depuis Fragrantica — un par ligne ou séparés par des virgules</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { key: 'notes_top' as const,   label: 'Notes de tête',  placeholder: 'Bergamote\nCitron\nGingembre' },
                  { key: 'notes_heart' as const, label: 'Notes de cœur',  placeholder: 'Rose\nJasmin\nPivoine' },
                  { key: 'notes_base' as const,  label: 'Notes de fond',  placeholder: 'Cèdre\nVétiver\nMusc' },
                ]).map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-admin-text mb-2">{label}</label>
                    <textarea
                      rows={4}
                      value={(form[key] as string[]).join('\n')}
                      onChange={(e) => {
                        const notes = e.target.value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
                        setForm({ ...form, [key]: notes })
                      }}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962] resize-none font-mono"
                    />
                    {(form[key] as string[]).length > 0 && (
                      <p className="text-xs text-admin-light mt-1">{(form[key] as string[]).length} note{(form[key] as string[]).length > 1 ? 's' : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium">Accords principaux</h2>
                  <p className="text-xs text-admin-light mt-0.5">Intensité 0–100 · couleur hexadécimale</p>
                </div>
                <button
                  type="button"
                  onClick={addAccord}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-surface-alt rounded-lg hover:bg-admin-surface-alt transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
              {form.main_accords.length === 0 && (
                <p className="text-sm text-admin-light">Aucun accord. Cliquez sur Ajouter pour commencer.</p>
              )}
              <div className="space-y-3">
                {form.main_accords.map((accord, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={accord.name}
                      onChange={(e) => updateAccord(index, 'name', e.target.value)}
                      placeholder="Nom de l'accord"
                      className="flex-1 px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
                    />
                    <input
                      type="color"
                      value={accord.color}
                      onChange={(e) => updateAccord(index, 'color', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-admin-border p-0.5"
                      title="Couleur"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={accord.intensity}
                      onChange={(e) => updateAccord(index, 'intensity', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-20 px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
                      placeholder="Intensité"
                    />
                    <span className="text-xs text-admin-light shrink-0">%</span>
                    <button type="button" onClick={() => removeAccord(index)} className="p-2 text-admin-light hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Accords olfactifs */}
            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-1">Accords olfactifs</h2>
              <p className="text-xs text-admin-light mb-4">
                Colle les noms depuis Fragrantica (un par ligne) — couleurs et intensités auto
              </p>

              <textarea
                value={accordsText}
                onChange={(e) => setAccordsText(e.target.value)}
                placeholder={'Boisé\nMusqué\nVanillé\nAmbré\nÉpicé'}
                rows={5}
                className="w-full px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962] font-mono resize-none mb-3"
              />

              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={applyAccordsFromText}
                  disabled={!accordsText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors text-sm disabled:opacity-50"
                >
                  Appliquer
                </button>
                <button
                  type="button"
                  onClick={generateAccords}
                  disabled={generatingAccords || !form.name}
                  className="flex items-center gap-2 px-4 py-2 bg-admin-surface-alt rounded-lg hover:bg-admin-surface-alt transition-colors text-sm disabled:opacity-50"
                >
                  {generatingAccords ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Génération…</>
                  ) : (
                    <><span>✨</span>Générer avec l&apos;IA</>
                  )}
                </button>
                {form.accords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setForm({ ...form, accords: [] }); setAccordsText('') }}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Effacer
                  </button>
                )}
              </div>

              {generateError && (
                <p className="text-sm text-red-500 mt-3">{generateError}</p>
              )}

              {/* Aperçu */}
              {form.accords.length > 0 && (
                <div className="mt-4 space-y-2">
                  {form.accords.map((accord) => (
                    <div key={accord.nom} className="flex items-center gap-3">
                      <span className="text-sm text-admin-muted w-28 shrink-0 truncate">{accord.nom}</span>
                      <div className="flex-1 h-5 bg-admin-surface-alt rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${accord.intensite}%`, backgroundColor: accord.couleur }}
                        />
                      </div>
                      <span className="text-xs text-admin-light w-8 text-right shrink-0">{accord.intensite}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Tailles disponibles</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {form.sizes.map((size, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-admin-surface-alt rounded-lg"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(index)}
                      className="text-admin-light hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSize()
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
                  placeholder="Ex: 30ml"
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="px-4 py-2 bg-admin-surface-alt rounded-lg hover:bg-admin-surface-alt transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'media' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-admin-surface rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-medium mb-4">Images du produit</h2>

            {form.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {form.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-[3/4] bg-admin-surface-alt rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={image}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-[#C9A962] text-white text-xs rounded">
                        Principale
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(index, 0)}
                          className="p-2 bg-admin-surface rounded-lg hover:bg-admin-surface-alt transition-colors"
                          title="Définir comme principale"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-admin-border rounded-xl p-12 text-center cursor-pointer hover:border-[#C9A962] transition-colors"
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-[#C9A962] animate-spin mb-4" />
                  <p className="text-admin-muted">Upload en cours...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-admin-light mx-auto mb-4" />
                  <p className="text-admin-muted mb-2">
                    Cliquez pour sélectionner des images
                  </p>
                  <p className="text-sm text-admin-light mb-4">
                    PNG, JPG jusqu&apos;à 5MB. Ratio 3:4 recommandé.
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="mt-6">
              <p className="text-sm text-admin-muted">
                La première image sera l&apos;image principale affichée dans les listes.
              </p>
            </div>

            {[...form.notes_top, ...form.notes_heart, ...form.notes_base].length > 0 && (
              <div className="mt-8 pt-8 border-t border-admin-border">
                <h2 className="text-lg font-medium mb-1">Images des notes olfactives</h2>
                <p className="text-sm text-admin-muted mb-4">
                  Associez une URL d&apos;image à chaque note pour la pyramide olfactive.
                </p>
                <div className="space-y-3">
                  {[...new Set([...form.notes_top, ...form.notes_heart, ...form.notes_base])].map((note) => (
                    <div key={note} className="flex items-center gap-3">
                      <span className="w-28 text-sm font-medium text-admin-text truncate shrink-0">{note}</span>
                      <input
                        type="url"
                        value={form.note_images[note] || ''}
                        onChange={(e) => updateNoteImage(note, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Prix et stock par taille</h2>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, unlimited_stock: !form.unlimited_stock })}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      form.unlimited_stock
                        ? 'bg-green-500 text-white'
                        : 'bg-admin-surface-alt text-admin-muted hover:bg-admin-surface-alt'
                    }`}
                  >
                    {form.unlimited_stock ? 'Stock illimité' : 'Stock illimité'}
                  </button>
                  {!form.unlimited_stock && (
                    <div className="text-sm text-admin-muted">
                      Stock total : <span className="font-medium text-admin-text">{form.stock}</span> unités
                    </div>
                  )}
                </div>
              </div>

              {form.unlimited_stock && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">
                    Le stock est illimité pour ce produit. Les quantités en stock ne seront pas décomptées.
                  </p>
                </div>
              )}

              {form.sizes.length > 0 ? (
                <div className="space-y-4">
                  {form.sizes.map((size) => (
                    <div key={size} className="p-4 bg-admin-surface-alt rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium text-admin-text">{size}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-admin-muted mb-1">
                            Prix
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.price_by_size[size] ?? 0}
                              onChange={(e) => updatePriceForSize(size, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 pr-8 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-light text-sm">€</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-admin-muted mb-1">
                            Stock
                          </label>
                          {form.unlimited_stock ? (
                            <div className="w-full px-3 py-2 border border-admin-border rounded-lg bg-admin-surface text-admin-muted">
                              Illimité
                            </div>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={form.stock_by_size[size] ?? 0}
                              onChange={(e) => updateStockForSize(size, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                              placeholder="0"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-admin-muted">
                  <p>Aucune taille définie.</p>
                  <p className="text-sm">Ajoutez des tailles dans l&apos;onglet &quot;Informations&quot;.</p>
                </div>
              )}
            </div>

            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Badges et visibilité</h2>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-admin-surface-alt rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Produit actif</p>
                    <p className="text-sm text-admin-muted">Le produit est visible sur le site</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-admin-border accent-[#C9A962]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-admin-surface-alt rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Nouveau</p>
                    <p className="text-sm text-admin-muted">Afficher le badge &quot;Nouveau&quot;</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
                    className="w-5 h-5 rounded border-admin-border accent-[#C9A962]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-admin-surface-alt rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium">Bestseller</p>
                    <p className="text-sm text-admin-muted">Afficher le badge &quot;Bestseller&quot;</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_bestseller}
                    onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })}
                    className="w-5 h-5 rounded border-admin-border accent-[#C9A962]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-red-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-red-700">Promo</p>
                    <p className="text-sm text-red-400">Badge rouge &quot;Promo&quot; + visible dans l&apos;onglet Promos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_promo}
                    onChange={(e) => setForm({ ...form, is_promo: e.target.checked })}
                    className="w-5 h-5 rounded border-red-300 accent-red-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-orange-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-orange-700">Masquer le produit</p>
                    <p className="text-sm text-orange-400">Le produit n&apos;apparaît plus sur le site</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: !e.target.checked })}
                    className="w-5 h-5 rounded border-orange-300 accent-orange-500"
                  />
                </label>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-admin-border">
          <Link
            href="/admin/produits"
            className="px-6 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
