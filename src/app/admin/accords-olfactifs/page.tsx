'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Search, Pencil, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AccordColor {
  id: string
  accord_name: string
  bg_color: string
  text_color: string
}

function parseFragranticaStyle(raw: string): { bgColor: string; textColor: string } | null {
  const toHex = (r: string, g: string, b: string) =>
    '#' + [r, g, b].map((v) => parseInt(v).toString(16).padStart(2, '0')).join('')

  const bgMatch = raw.match(/background:\s*rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/)
  const textMatch = raw.match(/(?:^|;)\s*color:\s*rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/)

  if (!bgMatch) return null
  return {
    bgColor: toHex(bgMatch[1], bgMatch[2], bgMatch[3]),
    textColor: textMatch ? toHex(textMatch[1], textMatch[2], textMatch[3]) : '#000000',
  }
}

function ColorBadge({ accord }: { accord: Pick<AccordColor, 'accord_name' | 'bg_color' | 'text_color'> }) {
  return (
    <span
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: accord.bg_color, color: accord.text_color }}
    >
      {accord.accord_name}
    </span>
  )
}

export default function AccordsOlfactifsPage() {
  const [accords, setAccords] = useState<AccordColor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Formulaire d'ajout
  const [newName, setNewName] = useState('')
  const [newStyle, setNewStyle] = useState('')
  const [stylePreview, setStylePreview] = useState<{ bgColor: string; textColor: string } | null>(null)
  const [adding, setAdding] = useState(false)

  // Edition inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStyle, setEditStyle] = useState('')

  useEffect(() => { fetchAccords() }, [])

  const fetchAccords = async () => {
    setLoading(true)
    const { data } = await supabase.from('accord_colors').select('*').order('accord_name')
    setAccords(data || [])
    setLoading(false)
  }

  const handleStyleChange = (val: string) => {
    setNewStyle(val)
    setStylePreview(parseFragranticaStyle(val))
  }

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name || !stylePreview) return
    setAdding(true)
    setError(null)
    const { error: dbErr } = await supabase.from('accord_colors').upsert(
      { accord_name: name, bg_color: stylePreview.bgColor, text_color: stylePreview.textColor },
      { onConflict: 'accord_name' }
    )
    if (dbErr) { setError(dbErr.message); setAdding(false); return }
    setNewName('')
    setNewStyle('')
    setStylePreview(null)
    setAdding(false)
    await fetchAccords()
  }

  const handleEditSave = async (accord: AccordColor) => {
    const parsed = parseFragranticaStyle(editStyle)
    if (!parsed) { setError('Style non reconnu — colle le style complet depuis Fragrantica.'); return }
    const { error: dbErr } = await supabase
      .from('accord_colors')
      .update({ bg_color: parsed.bgColor, text_color: parsed.textColor })
      .eq('id', accord.id)
    if (dbErr) { setError(dbErr.message); return }
    setAccords((prev) =>
      prev.map((a) => a.id === accord.id ? { ...a, bg_color: parsed.bgColor, text_color: parsed.textColor } : a)
    )
    setEditingId(null)
    setEditStyle('')
  }

  const handleDelete = async (id: string) => {
    await supabase.from('accord_colors').delete().eq('id', id)
    setAccords((prev) => prev.filter((a) => a.id !== id))
  }

  const filtered = accords.filter((a) =>
    a.accord_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Accords olfactifs</h1>
          <p className="text-admin-muted text-sm mt-1">
            Bibliothèque globale de couleurs — colle le style Fragrantica pour extraire les couleurs automatiquement.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#C9A962]/10 text-[#C9A962] text-sm rounded-full">
          {accords.length} accord{accords.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="bg-admin-surface rounded-xl p-5 mb-6 shadow-sm space-y-4">
        <h2 className="text-sm font-medium text-admin-text">Ajouter / mettre à jour un accord</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-admin-light mb-1 block">Nom de l&apos;accord</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Boisé, Rose, Musqué…"
              className="w-full px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
            />
          </div>
          <div>
            <label className="text-xs text-admin-light mb-1 block">Style copié depuis Fragrantica</label>
            <input
              type="text"
              value={newStyle}
              onChange={(e) => handleStyleChange(e.target.value)}
              placeholder='style="color: rgb(0,0,0); background: rgb(249,255,82); …"'
              className="w-full px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962] font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {stylePreview ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-admin-light">Aperçu :</span>
              <ColorBadge accord={{ accord_name: newName || 'Aperçu', bg_color: stylePreview.bgColor, text_color: stylePreview.textColor }} />
              <span className="text-xs text-admin-light font-mono">{stylePreview.bgColor} / {stylePreview.textColor}</span>
            </div>
          ) : newStyle ? (
            <p className="text-xs text-red-400">Style non reconnu. Colle le style complet depuis l&apos;inspecteur Fragrantica.</p>
          ) : null}
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !stylePreview || adding}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-black rounded-lg text-sm font-medium hover:bg-[#b8943f] transition-colors disabled:opacity-40"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {accords.some((a) => a.accord_name === newName.trim()) ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>

        <div className="pt-2 border-t border-admin-border">
          <p className="text-xs text-admin-light">
            <strong className="text-admin-muted">Comment obtenir le style Fragrantica :</strong>{' '}
            Sur une fiche Fragrantica, clic droit sur la barre colorée d&apos;un accord → &quot;Inspecter&quot; → copie l&apos;attribut <code className="bg-admin-surface-alt px-1 rounded">style="…"</code> de la barre.
          </p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-light" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un accord…"
          className="w-full pl-9 pr-4 py-2.5 bg-admin-surface border border-admin-border text-admin-text rounded-lg text-sm focus:outline-none focus:border-[#C9A962]"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#C9A962] animate-spin" />
        </div>
      ) : (
        <div className="bg-admin-surface rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-admin-border">
            {filtered.map((accord) => (
              <div key={accord.id} className="flex items-center gap-4 px-5 py-3 hover:bg-admin-surface-alt transition-colors group">
                {/* Badge couleur */}
                <ColorBadge accord={accord} />

                {/* Nom */}
                <span className="text-sm text-admin-text flex-1 font-medium">{accord.accord_name}</span>

                {/* Codes couleur */}
                <span className="text-xs text-admin-light font-mono hidden sm:block">
                  bg: {accord.bg_color} &nbsp; txt: {accord.text_color}
                </span>

                {/* Edition inline */}
                {editingId === accord.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editStyle}
                      onChange={(e) => setEditStyle(e.target.value)}
                      placeholder='style="color: rgb(…); background: rgb(…);…"'
                      className="flex-1 px-2 py-1 bg-admin-input border border-admin-border text-admin-text rounded text-xs font-mono focus:outline-none focus:border-[#C9A962]"
                      autoFocus
                    />
                    <button onClick={() => handleEditSave(accord)} className="p-1 text-green-500 hover:bg-green-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingId(null); setEditStyle('') }} className="p-1 text-admin-light hover:text-admin-text rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingId(accord.id); setEditStyle('') }}
                      className="p-1.5 text-admin-light hover:text-[#C9A962] rounded transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(accord.id)}
                      className="p-1.5 text-admin-light hover:text-red-500 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-admin-muted text-sm">Aucun accord trouvé.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
