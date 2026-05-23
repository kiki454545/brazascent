'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Upload, Trash2, GripVertical, Eye, EyeOff, Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface HomeVideo {
  id: string
  url: string
  storage_path: string
  order_index: number
  active: boolean
  created_at: string
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<HomeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('home_videos')
      .select('*')
      .order('order_index')
    setVideos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchVideos() }, [])

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(null), 3000) }
    else { setError(msg); setTimeout(() => setError(null), 4000) }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    for (const file of Array.from(files)) {
      if (file.size > 100 * 1024 * 1024) {
        notify('Taille maximale : 100 MB', 'error')
        continue
      }
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `home/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) {
        notify(`Erreur upload : ${uploadError.message}`, 'error')
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(storagePath)

      const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.order_index)) + 1 : 0
      const { error: insertError } = await supabase.from('home_videos').insert({
        url: publicUrl,
        storage_path: storagePath,
        order_index: maxOrder,
        active: true,
      })

      if (insertError) {
        notify(`Erreur BDD : ${insertError.message}`, 'error')
      }
    }

    await fetchVideos()
    setUploading(false)
    notify('Vidéo ajoutée avec succès')
  }

  const handleDelete = async (video: HomeVideo) => {
    if (!confirm('Supprimer cette vidéo ?')) return
    await supabase.storage.from('videos').remove([video.storage_path])
    await supabase.from('home_videos').delete().eq('id', video.id)
    await fetchVideos()
    notify('Vidéo supprimée')
  }

  const toggleActive = async (video: HomeVideo) => {
    await supabase.from('home_videos').update({ active: !video.active }).eq('id', video.id)
    await fetchVideos()
  }

  const handleDragStart = (index: number) => { dragItem.current = index }
  const handleDragEnter = (index: number) => { dragOverItem.current = index }

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    if (dragItem.current === dragOverItem.current) return

    const reordered = [...videos]
    const dragged = reordered.splice(dragItem.current, 1)[0]
    reordered.splice(dragOverItem.current, 0, dragged)

    const updated = reordered.map((v, i) => ({ ...v, order_index: i }))
    setVideos(updated)
    dragItem.current = null
    dragOverItem.current = null

    for (const v of updated) {
      await supabase.from('home_videos').update({ order_index: v.order_index }).eq('id', v.id)
    }
    notify('Ordre sauvegardé')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-[0.1em] text-admin-text mb-1">Vidéos Homepage</h1>
        <p className="text-sm text-admin-muted">Les vidéos actives se succèdent automatiquement toutes les 8 secondes sur la page d&apos;accueil.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{success}</div>
      )}

      {/* Upload zone */}
      <div
        className="mb-8 border-2 border-dashed border-admin-border rounded-xl p-10 text-center cursor-pointer hover:border-[#C9A962] transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3 text-admin-muted">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
            <p className="text-sm">Upload en cours…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-admin-muted">
            <Upload className="w-8 h-8" />
            <div>
              <p className="font-medium text-admin-text">Glisse une vidéo ici ou clique pour choisir</p>
              <p className="text-xs mt-1">MP4, WebM, MOV — max 100 MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Liste des vidéos */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A962]" />
        </div>
      ) : videos.length === 0 ? (
        <p className="text-center text-admin-muted py-12 text-sm">Aucune vidéo. Ajoute-en une ci-dessus.</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-admin-muted mb-2">Glisse pour réordonner</p>
          {videos.map((video, index) => (
            <div
              key={video.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className={`flex items-center gap-4 bg-admin-surface rounded-xl p-4 border border-admin-border transition-opacity ${video.active ? '' : 'opacity-50'}`}
            >
              <GripVertical className="w-5 h-5 text-admin-muted cursor-grab shrink-0" />

              {/* Aperçu vidéo */}
              <div className="w-20 h-14 bg-black rounded overflow-hidden shrink-0">
                <video
                  src={video.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-admin-muted truncate">{video.storage_path}</p>
                <p className="text-xs text-admin-light mt-0.5">Position {index + 1}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(video)}
                  className={`p-2 rounded-lg transition-colors text-sm ${video.active ? 'text-green-600 hover:bg-green-50' : 'text-admin-muted hover:bg-admin-surface-alt'}`}
                  title={video.active ? 'Visible' : 'Masqué'}
                >
                  {video.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(video)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
