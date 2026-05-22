'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Loader2, Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NoteImage {
  id: string
  note_name: string
  image_url: string | null
}

type Filter = 'all' | 'done' | 'missing'

export default function NotesOlfactivesPage() {
  const [notes, setNotes] = useState<NoteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [newNoteName, setNewNoteName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingNote = useRef<string | null>(null)

  useEffect(() => { fetchNotes() }, [])

  const fetchNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('note_images')
      .select('*')
      .order('note_name')
    setNotes(data || [])
    setLoading(false)
  }

  const triggerUpload = (noteName: string) => {
    pendingNote.current = noteName
    fileInputRef.current?.click()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const note = pendingNote.current
    if (!file || !note) return

    setUploading(note)
    setError(null)
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Max 10MB')

      const ext = file.name.split('.').pop()
      const safeName = note.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '-')
      const filePath = `notes/global-${safeName}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath)

      const { error: dbErr } = await supabase
        .from('note_images')
        .upsert({ note_name: note, image_url: publicUrl }, { onConflict: 'note_name' })
      if (dbErr) throw dbErr

      setNotes((prev) =>
        prev.map((n) => n.note_name === note ? { ...n, image_url: publicUrl } : n)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(null)
      pendingNote.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = async (note: NoteImage) => {
    await supabase.from('note_images').update({ image_url: null }).eq('id', note.id)
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, image_url: null } : n))
  }

  const handleDeleteNote = async (id: string) => {
    await supabase.from('note_images').delete().eq('id', id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const handleAddNew = () => {
    const name = newNoteName.trim()
    if (!name) return
    // Vérifie si la note existe déjà
    if (notes.some((n) => n.note_name.toLowerCase() === name.toLowerCase())) {
      setError('Cette note existe déjà.')
      return
    }
    setNewNoteName('')
    // Insère d'abord en base, puis upload
    supabase.from('note_images').insert({ note_name: name, image_url: null }).then(async ({ error: dbErr }) => {
      if (dbErr) { setError(dbErr.message); return }
      await fetchNotes()
      triggerUpload(name)
    })
  }

  const withImage = notes.filter((n) => n.image_url)
  const withoutImage = notes.filter((n) => !n.image_url)

  const filtered = notes.filter((n) => {
    const matchSearch = n.note_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'done' ? !!n.image_url :
      !n.image_url
    return matchSearch && matchFilter
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notes olfactives</h1>
          <p className="text-admin-muted text-sm mt-1">
            Bibliothèque globale — les images s&apos;appliquent automatiquement sur toutes les fiches produit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
            {withImage.length} avec photo
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
            {withoutImage.length} sans photo
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Ajouter une nouvelle note */}
      <div className="bg-admin-surface rounded-xl p-5 mb-5 shadow-sm">
        <h2 className="text-sm font-medium text-admin-text mb-3">Ajouter une note absente</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newNoteName}
            onChange={(e) => setNewNoteName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
            placeholder="Ex : Vétiver, Muguet…"
            className="flex-1 px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
          />
          <button
            onClick={handleAddNew}
            disabled={!newNoteName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-black rounded-lg text-sm font-medium hover:bg-[#b8943f] transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une note…"
            className="w-full pl-9 pr-4 py-2.5 bg-admin-surface border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-admin-border text-sm">
          {([
            { key: 'all', label: 'Toutes' },
            { key: 'missing', label: 'Sans photo' },
            { key: 'done', label: 'Avec photo' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 transition-colors ${
                filter === f.key
                  ? 'bg-[#C9A962] text-black font-medium'
                  : 'bg-admin-surface text-admin-muted hover:bg-admin-surface-alt'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#C9A962] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-admin-muted">Aucune note trouvée.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {filtered.map((note) => {
            const isUploading = uploading === note.note_name
            return (
              <div key={note.id} className="flex flex-col items-center gap-2 group">
                <div
                  className={`relative w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm cursor-pointer transition-colors ${
                    note.image_url
                      ? 'bg-white border-admin-border hover:border-[#C9A962]'
                      : 'bg-admin-surface-alt border-dashed border-admin-border hover:border-[#C9A962]'
                  }`}
                  onClick={() => !isUploading && triggerUpload(note.note_name)}
                  title={note.image_url ? 'Remplacer la photo' : 'Ajouter une photo'}
                >
                  {isUploading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-[#C9A962] animate-spin" />
                    </div>
                  ) : note.image_url ? (
                    <>
                      <Image
                        src={note.image_url}
                        alt={note.note_name}
                        fill
                        className="object-cover mix-blend-multiply"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); triggerUpload(note.note_name) }}
                          className="p-1 bg-white/20 hover:bg-white/40 rounded-full"
                          title="Remplacer"
                        >
                          <Upload className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(note) }}
                          className="p-1 bg-red-500/80 hover:bg-red-600 rounded-full"
                          title="Retirer la photo"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="w-5 h-5 text-admin-light group-hover:text-[#C9A962] transition-colors" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] text-center leading-tight max-w-[72px] truncate ${
                    note.image_url ? 'text-admin-text' : 'text-admin-light'
                  }`}>
                    {note.note_name}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-admin-light hover:text-red-500 transition-all"
                    title="Supprimer la note"
                  >
                    <span className="text-[10px]">×</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
