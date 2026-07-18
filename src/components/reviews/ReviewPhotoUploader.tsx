'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 Mo
const MAX_PHOTOS = 4

interface ReviewPhotoUploaderProps {
  photos: File[]
  onChange: (photos: File[]) => void
  disabled?: boolean
}

export function ReviewPhotoUploader({ photos, onChange, disabled }: ReviewPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Recalculée seulement quand la liste de fichiers change.
  const previews = useMemo(() => photos.map((file) => URL.createObjectURL(file)), [photos])

  // Nettoyage seul dans l'effet — aucun setState ici.
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previews])

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setError(null)

    const incoming = Array.from(fileList)
    const room = MAX_PHOTOS - photos.length

    if (room <= 0) {
      setError('Maximum 4 photos.')
      return
    }

    const accepted: File[] = []
    for (const file of incoming) {
      if (accepted.length >= room) break
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Formats acceptés : JPG, PNG, WEBP.')
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Chaque photo doit faire moins de 4 Mo.')
        continue
      }
      accepted.push(file)
    }

    if (accepted.length > 0) {
      onChange([...photos, ...accepted])
    }

    // Permet de resélectionner le même fichier après suppression
    if (inputRef.current) inputRef.current.value = ''
  }

  const removePhoto = (index: number) => {
    setError(null)
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((file, index) => (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-cream border border-border flex-shrink-0"
          >
            {previews[index] && (
              <Image
                src={previews[index]}
                alt={`Photo ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => removePhoto(index)}
              disabled={disabled}
              aria-label={`Supprimer la photo ${index + 1}`}
              className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wide">Ajouter</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <p className="text-xs text-muted-foreground mt-2">
        {photos.length}/{MAX_PHOTOS} photos — JPG, PNG ou WEBP, 4 Mo max chacune. Facultatif.
      </p>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
