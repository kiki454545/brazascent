'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { m } from 'framer-motion'
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

// ─── Composant upload Fragrantica par catégorie ───────────────────────────────
// Ligne combinée Tenue + Sillage en un seul upload
function FragranticaPerformanceRow({ productId }: { productId: string }) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [longevity, setLongevity] = useState<string | null>(null)
  const [sillage, setSillage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const analyze = async () => {
    if (!image) return
    setLoading(true); setError(null); setLongevity(null); setSillage(null)
    try {
      const fd = new FormData()
      fd.append('image', image)
      fd.append('productId', productId)
      fd.append('type', 'performance')
      const res = await fetch('/api/admin/analyze-fragrantica', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setLongevity(data.longevity ?? null)
      setSillage(data.sillage ?? null)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-admin-bg rounded-lg border border-admin-border">
      <span className="text-xs font-medium text-admin-text w-28 shrink-0">⌛≈ Tenue + Sillage</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]; if (!f) return
          setImage(f); setLongevity(null); setSillage(null); setError(null)
          const r = new FileReader(); r.onload = ev => setPreview(ev.target?.result as string); r.readAsDataURL(f)
        }}
      />
      {preview ? (
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-10 w-16 object-cover rounded border border-admin-border" />
          <button type="button" onClick={() => { setImage(null); setPreview(null); setLongevity(null); setSillage(null) }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-admin-border rounded hover:bg-admin-surface-alt transition-colors shrink-0">
          <Upload className="w-3 h-3" /> Screenshot
        </button>
      )}
      {image && (
        <button type="button" onClick={analyze} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#C9A962]/10 border border-[#C9A962]/40 text-[#C9A962] rounded hover:bg-[#C9A962]/20 transition-colors disabled:opacity-50 shrink-0">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {loading ? '...' : 'Analyser'}
        </button>
      )}
      <div className="flex-1 min-w-0 flex gap-3">
        {(longevity || sillage) && (
          <>
            {longevity && <p className="text-xs text-emerald-500 font-medium">✓ Tenue : {longevity}</p>}
            {sillage   && <p className="text-xs text-emerald-500 font-medium">✓ Sillage : {sillage}</p>}
          </>
        )}
        {error && <p className="text-xs text-orange-400 truncate">⚠ {error.slice(0, 60)}</p>}
        {!longevity && !sillage && !error && (
          <p className="text-xs text-admin-light">1 screenshot pour les 2 — section "Profil olfactif" Fragrantica</p>
        )}
      </div>
    </div>
  )
}

// Ligne combinée Saisons + Journée en un seul upload
function FragranticaContextRow({ productId }: { productId: string }) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [seasons, setSeasons] = useState<string | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const analyze = async () => {
    if (!image) return
    setLoading(true); setError(null); setSeasons(null); setTimeOfDay(null)
    try {
      const fd = new FormData()
      fd.append('image', image)
      fd.append('productId', productId)
      fd.append('type', 'context')
      const res = await fetch('/api/admin/analyze-fragrantica', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      const s = data.seasons as Record<string, number>
      const t = data.time_of_day as Record<string, number>
      setSeasons(s ? Object.entries(s).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}%`).join(' · ') : null)
      setTimeOfDay(t ? Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}%`).join(' · ') : null)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-admin-bg rounded-lg border border-admin-border">
      <span className="text-xs font-medium text-admin-text w-28 shrink-0">🌍☀️ Saisons + Journée</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]; if (!f) return
          setImage(f); setSeasons(null); setTimeOfDay(null); setError(null)
          const r = new FileReader(); r.onload = ev => setPreview(ev.target?.result as string); r.readAsDataURL(f)
        }}
      />
      {preview ? (
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-10 w-16 object-cover rounded border border-admin-border" />
          <button type="button" onClick={() => { setImage(null); setPreview(null); setSeasons(null); setTimeOfDay(null) }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-admin-border rounded hover:bg-admin-surface-alt transition-colors shrink-0">
          <Upload className="w-3 h-3" /> Screenshot
        </button>
      )}
      {image && (
        <button type="button" onClick={analyze} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#C9A962]/10 border border-[#C9A962]/40 text-[#C9A962] rounded hover:bg-[#C9A962]/20 transition-colors disabled:opacity-50 shrink-0">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {loading ? '...' : 'Analyser'}
        </button>
      )}
      <div className="flex-1 min-w-0 space-y-0.5">
        {(seasons || timeOfDay) ? (
          <>
            {seasons   && <p className="text-xs text-emerald-500 font-medium truncate">✓ Saisons : {seasons}</p>}
            {timeOfDay && <p className="text-xs text-emerald-500 font-medium truncate">✓ Journée : {timeOfDay}</p>}
          </>
        ) : error ? (
          <p className="text-xs text-orange-400 truncate">⚠ {error.slice(0, 60)}</p>
        ) : (
          <p className="text-xs text-admin-light">Section &quot;Quand le porter&quot; — saisons + jour/nuit</p>
        )}
      </div>
    </div>
  )
}

function FragranticaRow({ catType, label, hint, productId }: {
  catType: string; label: string; hint: string; productId: string
}) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const analyze = async () => {
    if (!image) return
    setLoading(true); setError(null); setResult(null)
    try {
      const fd = new FormData()
      fd.append('image', image)
      fd.append('productId', productId)
      fd.append('type', catType)
      const res = await fetch('/api/admin/analyze-fragrantica', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      if (catType === 'genre') setResult(data.genre ?? '—')
      else if (catType === 'seasons') {
        const s = data.seasons as Record<string, number>
        setResult(s ? Object.entries(s).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}%`).join(' · ') : '—')
      } else if (catType === 'timeOfDay') {
        const t = data.time_of_day as Record<string, number>
        setResult(t ? Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}%`).join(' · ') : '—')
      }
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-admin-bg rounded-lg border border-admin-border">
      <span className="text-xs font-medium text-admin-text w-20 shrink-0">{label}</span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]; if (!f) return
          setImage(f); setResult(null); setError(null)
          const r = new FileReader(); r.onload = ev => setPreview(ev.target?.result as string); r.readAsDataURL(f)
        }}
      />
      {preview ? (
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-10 w-16 object-cover rounded border border-admin-border" />
          <button type="button" onClick={() => { setImage(null); setPreview(null); setResult(null) }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-admin-border rounded hover:bg-admin-surface-alt transition-colors shrink-0">
          <Upload className="w-3 h-3" /> Screenshot
        </button>
      )}
      {image && (
        <button type="button" onClick={analyze} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#C9A962]/10 border border-[#C9A962]/40 text-[#C9A962] rounded hover:bg-[#C9A962]/20 transition-colors disabled:opacity-50 shrink-0">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {loading ? '...' : 'Analyser'}
        </button>
      )}
      <div className="flex-1 min-w-0">
        {result && <p className="text-xs text-emerald-500 font-medium truncate">✓ {result}</p>}
        {error && <p className="text-xs text-orange-400 truncate">⚠ {error.slice(0, 60)}</p>}
        {!result && !error && <p className="text-xs text-admin-light truncate">{hint}</p>}
      </div>
    </div>
  )
}

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
  pyramid_image: string
  accords: AccordIA[]
  images: string[]
  stock: number
  is_new: boolean
  is_bestseller: boolean
  is_active: boolean
  is_promo: boolean
  unlimited_stock: boolean
  ml_stock: number
  fragrantica_url: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pyramidFileInputRef = useRef<HTMLInputElement>(null)
  const noteFileInputRef = useRef<HTMLInputElement>(null)
  const pendingNoteRef = useRef<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [originalStock, setOriginalStock] = useState(0)
  const [uploadingPyramid, setUploadingPyramid] = useState(false)
  const [uploadingNote, setUploadingNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fragranticaLoading, setFragranticaLoading] = useState(false)
  const [fragranticaResult, setFragranticaResult] = useState<{
    longevity: string | null
    sillage: string | null
    seasons: Record<string, number> | string[]
    time_of_day: Record<string, number> | string[]
    genre: string | null
    raw_claude?: string | null
  } | null>(null)
  const [fragranticaImage, setFragranticaImage] = useState<File | null>(null)
  const [fragranticaPreview, setFragranticaPreview] = useState<string | null>(null)
  const fragranticaInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'inventory'>('info')
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([])

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
    pyramid_image: '',
    accords: [],
    images: [],
    stock: 150,
    is_new: true,
    is_bestseller: false,
    is_active: true,
    is_promo: false,
    unlimited_stock: false,
    ml_stock: 0,
    fragrantica_url: '',
  })

  const [newNote, setNewNote] = useState({ top: '', heart: '', base: '' })
  const [newSize, setNewSize] = useState('')
  const [mlDisponible, setMlDisponible] = useState<number>(0)
  const [accordsText, setAccordsText] = useState('')
  const [savingAccords, setSavingAccords] = useState(false)
  const [accordsSaved, setAccordsSaved] = useState(false)
  const [globalAccordColors, setGlobalAccordColors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProduct()
    supabase.from('accord_colors').select('accord_name, bg_color').then(({ data }) => {
      const map: Record<string, string> = {}
      for (const row of data || []) map[row.accord_name] = row.bg_color
      setGlobalAccordColors(map)
    })
    supabase.from('brands').select('id, name').order('name').then(({ data }) => {
      if (data) setBrands(data)
    })
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
          pyramid_image: data.pyramid_image || '',
          accords: data.accords || [],
          images: data.images || [],
          stock: data.stock || 0,
          is_new: data.is_new ?? true,
          is_bestseller: data.is_bestseller ?? false,
          is_active: data.is_active ?? true,
          is_promo: data.is_promo ?? false,
          unlimited_stock: data.unlimited_stock ?? false,
          ml_stock: data.ml_stock || 0,
          fragrantica_url: data.fragrantica_url || '',
        })
        setOriginalStock(data.stock || 0)
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
        pyramid_image: form.pyramid_image || null,
        accords: form.accords,
        images: form.images,
        stock: form.stock,
        is_new: form.is_new,
        is_bestseller: form.is_bestseller,
        is_active: form.is_active,
        is_promo: form.is_promo,
        unlimited_stock: form.unlimited_stock,
        ml_stock: form.ml_stock,
        fragrantica_url: form.fragrantica_url || null,
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

      // Déclencher les alertes stock si le produit repasse en stock
      if (originalStock === 0 && form.stock > 0) {
        fetch('/api/stock-alert/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        }).catch(console.error)
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

  const handlePyramidUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPyramid(true)
    setError(null)

    try {
      if (!file.type.startsWith('image/')) throw new Error('Seules les images sont acceptées')
      if (file.size > 10 * 1024 * 1024) throw new Error('La taille maximale est de 10MB')

      const fileExt = file.name.split('.').pop()
      const fileName = `pyramid-${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      setForm((prev) => ({ ...prev, pyramid_image: publicUrl }))

      // Sauvegarder immédiatement en base
      await supabase.from('products').update({ pyramid_image: publicUrl }).eq('id', productId)
    } catch (err) {
      if (!isAbortError(err)) {
        setError(err instanceof Error ? err.message : 'Erreur upload pyramide')
      }
    } finally {
      setUploadingPyramid(false)
      if (pyramidFileInputRef.current) pyramidFileInputRef.current.value = ''
    }
  }

  const removePyramidImage = async () => {
    setForm((prev) => ({ ...prev, pyramid_image: '' }))
    await supabase.from('products').update({ pyramid_image: null }).eq('id', productId)
  }

  const triggerNoteUpload = (note: string) => {
    pendingNoteRef.current = note
    noteFileInputRef.current?.click()
  }

  const handleNoteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const note = pendingNoteRef.current
    if (!file || !note) return

    setUploadingNote(note)
    try {
      const fileExt = file.name.split('.').pop()
      const safeName = note.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-')
      const filePath = `notes/${productId}-${safeName}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath)

      const updated = { ...form.note_images, [note]: publicUrl }
      setForm((prev) => ({ ...prev, note_images: updated }))
      await supabase.from('products').update({ note_images: updated }).eq('id', productId)
    } catch (err) {
      if (!isAbortError(err)) setError(err instanceof Error ? err.message : 'Erreur upload note')
    } finally {
      setUploadingNote(null)
      pendingNoteRef.current = null
      if (noteFileInputRef.current) noteFileInputRef.current.value = ''
    }
  }

  const removeNoteImage = async (note: string) => {
    const updated = { ...form.note_images }
    delete updated[note]
    setForm((prev) => ({ ...prev, note_images: updated }))
    await supabase.from('products').update({ note_images: updated }).eq('id', productId)
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
      // Cherche dans la table globale (exact puis partiel)
      const couleur =
        globalAccordColors[nom] ??
        Object.entries(globalAccordColors).find(([k]) => nom.toLowerCase().includes(k.toLowerCase()))?.[1] ??
        '#C9A962'
      return { nom, intensite: Math.round(88 - i * step), couleur }
    })
    setForm((prev) => ({ ...prev, accords }))
  }

const saveAccords = async () => {
    setSavingAccords(true)
    setAccordsSaved(false)
    try {
      const { error: saveError } = await supabase
        .from('products')
        .update({ accords: form.accords })
        .eq('id', productId)
      if (saveError) throw saveError
      setAccordsSaved(true)
      setTimeout(() => setAccordsSaved(false), 3000)
    } catch (err) {
      console.error(err instanceof Error ? err.message : 'Erreur sauvegarde')
    } finally {
      setSavingAccords(false)
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

  const parseMlFromSize = (size: string): number => {
    const match = size.replace(',', '.').match(/([\d.]+)\s*ml/i)
    return match ? parseFloat(match[1]) : 0
  }

  const [mlSaving, setMlSaving] = useState(false)

  const applyMlStock = async () => {
    if (!mlDisponible || mlDisponible <= 0) return
    const newMlStock = (form.ml_stock || 0) + mlDisponible
    const newStockBySize: Record<string, number> = {}
    for (const size of form.sizes) {
      const ml = parseMlFromSize(size)
      newStockBySize[size] = ml > 0 ? Math.floor(newMlStock / ml) : (form.stock_by_size[size] ?? 0)
    }
    const totalStock = Object.values(newStockBySize).reduce((a, b) => a + b, 0)
    setMlSaving(true)
    await supabase.from('products').update({ ml_stock: newMlStock, stock_by_size: newStockBySize, stock: totalStock }).eq('id', productId)
    setMlSaving(false)
    setForm(prev => ({ ...prev, ml_stock: newMlStock, stock_by_size: newStockBySize, stock: totalStock }))
    setMlDisponible(0)
  }

  const resetMlStock = async () => {
    setMlSaving(true)
    await supabase.from('products').update({ ml_stock: 0 }).eq('id', productId)
    setMlSaving(false)
    setForm(prev => ({ ...prev, ml_stock: 0 }))
    setMlDisponible(0)
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
          <m.div
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
                  <select
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                    {brands.length === 0 && (
                      <option value={form.brand}>{form.brand}</option>
                    )}
                  </select>
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

            {/* Fragrantica screenshot */}
            <div className="bg-admin-surface rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Fragrantica — Votes</h2>
              {(() => {
                const CATEGORIES = [
                  { type: 'genre', label: '⚥ Genre', hint: 'Section Genre avec les votes par catégorie' },
                ] as const

                return (
                  <div className="space-y-3">
                    <FragranticaPerformanceRow productId={productId} />
                    <FragranticaContextRow productId={productId} />
                    {CATEGORIES.map(({ type: catType, label, hint }) => (
                      <FragranticaRow
                        key={catType}
                        catType={catType}
                        label={label}
                        hint={hint}
                        productId={productId}
                      />
                    ))}
                  </div>
                )
              })()}

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
                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveAccords}
                      disabled={savingAccords}
                      className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-black rounded-lg hover:bg-[#b8943f] transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {savingAccords ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde…</>
                      ) : (
                        <><Save className="w-4 h-4" />Sauvegarder les accords</>
                      )}
                    </button>
                    {accordsSaved && (
                      <span className="text-sm text-green-600">✓ Accords sauvegardés</span>
                    )}
                  </div>
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
          </m.div>
        )}

        {activeTab === 'media' && (
          <m.div
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

            <div className="mt-8 pt-8 border-t border-admin-border">
              <p className="text-sm text-admin-muted">
                Les images des notes olfactives sont gérées globalement dans{' '}
                <a href="/admin/notes-olfactives" className="text-[#C9A962] hover:underline font-medium">
                  Admin › Notes olfactives
                </a>
                {' '}— elles s&apos;appliquent automatiquement à tous les parfums.
              </p>
            </div>
          </m.div>
        )}

        {activeTab === 'inventory' && (
          <m.div
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

              {!form.unlimited_stock && form.sizes.length > 0 && (
                <div className="mt-5 pt-5 border-t border-admin-border">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-admin-text">Stock en ml</p>
                      <p className="text-xs text-admin-muted">Le volume restant est calculé automatiquement à chaque commande.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-light text-[#C9A962] tabular-nums">
                        {form.ml_stock > 0 ? `${form.ml_stock} ml` : '— ml'}
                      </span>
                      {form.ml_stock > 0 && (
                        <button
                          type="button"
                          onClick={resetMlStock}
                          disabled={mlSaving}
                          className="text-xs px-2.5 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end gap-3 flex-wrap">
                    <div>
                      <label className="block text-xs font-medium text-admin-muted mb-1">
                        Ajouter des ml
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={mlDisponible || ''}
                          placeholder="ex: 100"
                          onChange={e => setMlDisponible(parseFloat(e.target.value) || 0)}
                          className="w-36 px-3 py-2 pr-9 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted text-sm">ml</span>
                      </div>
                    </div>
                    {mlDisponible > 0 && (
                      <div className="flex items-end gap-2 flex-wrap">
                        <div className="flex gap-2 flex-wrap text-xs text-admin-muted pb-2">
                          {(() => {
                            const total = (form.ml_stock || 0) + mlDisponible
                            return form.sizes.map(size => {
                              const ml = parseMlFromSize(size)
                              const qty = ml > 0 ? Math.floor(total / ml) : null
                              return qty !== null ? (
                                <span key={size} className="px-2 py-1 bg-admin-surface-alt rounded border border-admin-border">
                                  <span className="text-[#C9A962] font-medium">{size}</span>
                                  {' → '}
                                  <span className="text-admin-text font-medium">{qty} unités</span>
                                </span>
                              ) : null
                            })
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={applyMlStock}
                          disabled={mlSaving}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#b8943f] transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {mlSaving ? (
                            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
                          ) : (
                            <>+ Ajouter</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
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

                {form.is_promo && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-red-700">Prix de la promotion</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-red-600 mb-1">Prix barré (avant promo)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.original_price ?? ''}
                            onChange={(e) => setForm({ ...form, original_price: e.target.value ? parseFloat(e.target.value) : null })}
                            placeholder="Ex: 12.90"
                            className="w-full px-3 py-2 pr-8 bg-white border border-red-300 text-admin-text rounded-lg focus:outline-none focus:border-red-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">€</span>
                        </div>
                        <p className="text-xs text-red-400 mt-1">Affiché barré à côté du prix promo</p>
                      </div>
                      <div className="flex items-center justify-center">
                        {form.original_price && (() => {
                          const prices = Object.values(form.price_by_size ?? {}).filter((v): v is number => typeof v === 'number' && v > 0)
                          const minPrice = prices.length > 0 ? Math.min(...prices) : 0
                          const pct = minPrice > 0 ? Math.round((1 - minPrice / form.original_price) * 100) : 0
                          return pct > 0 ? (
                            <div className="text-center">
                              <span className="text-2xl font-bold text-red-600">-{pct}%</span>
                              <p className="text-xs text-red-400 mt-1">de réduction</p>
                            </div>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>
                )}

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
          </m.div>
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
