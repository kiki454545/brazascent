'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface BlogForm {
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image: string
  author: string
  category: string
  tags: string
  is_published: boolean
}

const defaultForm: BlogForm = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: 'Braza Scent',
  category: 'conseils',
  tags: '',
  is_published: false,
}

const CATEGORIES = [
  { value: 'conseils', label: 'Conseils' },
  { value: 'education', label: 'Éducation' },
  { value: 'tendances', label: 'Tendances' },
  { value: 'actualites', label: 'Actualités' },
]

export default function AdminBlogEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === 'nouveau'

  const [form, setForm] = useState<BlogForm>(defaultForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setForm({
        slug: data.slug || '',
        title: data.title || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        cover_image: data.cover_image || '',
        author: data.author || 'Braza Scent',
        category: data.category || 'conseils',
        tags: (data.tags || []).join(', '),
        is_published: data.is_published || false,
      })
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (!isNew) fetchPost()
  }, [isNew, fetchPost])

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const set = (field: keyof BlogForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async (publish?: boolean) => {
    if (!form.title.trim()) return alert('Le titre est requis.')
    if (!form.slug.trim()) return alert('Le slug est requis.')

    setSaving(true)
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content || null,
      cover_image: form.cover_image.trim() || null,
      author: form.author.trim() || 'Braza Scent',
      category: form.category,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      is_published: publish !== undefined ? publish : form.is_published,
      published_at: (publish || form.is_published) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    if (isNew) {
      const { data, error } = await supabase.from('blog_posts').insert(payload).select().single()
      if (!error && data) {
        router.replace(`/admin/blog/${data.id}`)
      } else {
        alert('Erreur lors de la création.')
      }
    } else {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', id)
      if (error) {
        alert('Erreur lors de la sauvegarde.')
      } else {
        if (publish !== undefined) set('is_published', publish)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-light tracking-[0.1em] uppercase">
            {isNew ? 'Nouvel article' : 'Modifier l\'article'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={() => handleSave(!form.is_published)}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 border text-sm tracking-[0.1em] uppercase transition-colors ${
                form.is_published
                  ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              {form.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {form.is_published ? 'Dépublier' : 'Publier'}
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm tracking-[0.1em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* Titre */}
        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Titre *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              set('title', e.target.value)
              if (isNew) set('slug', generateSlug(e.target.value))
            }}
            className="w-full border border-border px-4 py-3 text-lg bg-background focus:outline-none focus:border-primary transition-colors"
            placeholder="Titre de l'article"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Slug (URL) *</label>
          <div className="flex items-center border border-border focus-within:border-primary transition-colors">
            <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r border-border">/blog/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-background focus:outline-none"
              placeholder="mon-article"
            />
          </div>
        </div>

        {/* Extrait */}
        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Extrait</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            rows={2}
            className="w-full border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Courte description affichée sur la liste du blog et pour le SEO (160 caractères recommandés)"
          />
          <p className="text-xs text-muted-foreground mt-1">{form.excerpt.length} / 160</p>
        </div>

        {/* Image de couverture */}
        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Image de couverture (URL)</label>
          <input
            type="url"
            value={form.cover_image}
            onChange={(e) => set('cover_image', e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors"
            placeholder="https://..."
          />
        </div>

        {/* Catégorie + Auteur */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Auteur</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => set('author', e.target.value)}
              className="w-full border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Tags (séparés par des virgules)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            className="w-full border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors"
            placeholder="parfum, conseil, florale"
          />
        </div>

        {/* Contenu HTML */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground">Contenu (HTML)</label>
            {form.slug && !isNew && (
              <a
                href={`/blog/${form.slug}`}
                target="_blank"
                className="text-xs text-primary hover:underline"
              >
                Prévisualiser →
              </a>
            )}
          </div>
          <textarea
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            rows={20}
            className="w-full border border-border px-4 py-3 text-sm bg-background focus:outline-none focus:border-primary transition-colors resize-y font-mono"
            placeholder="<h2>Titre de section</h2>&#10;<p>Votre contenu ici...</p>"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Utilisez les balises HTML : &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;&lt;li&gt;, &lt;a href=&quot;...&quot;&gt;
          </p>
        </div>

        {/* Bouton bas */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm tracking-[0.1em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : isNew ? 'Créer l\'article' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}
