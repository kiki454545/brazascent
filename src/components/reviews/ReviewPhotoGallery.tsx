'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ReviewPhotoGalleryProps {
  photos: { id: string; url: string }[]
  productName: string
}

// Miniatures + lightbox accessible. Uniquement des photos déjà approuvées
// (public_storage_path résolu en amont) — jamais de chemin privé ici.
export function ReviewPhotoGallery({ photos, productName }: ReviewPhotoGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)), [photos.length])
  const next = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length)), [photos.length])

  useEffect(() => {
    if (openIndex === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openIndex, close, prev, next])

  if (photos.length === 0) return null

  const altText = (i: number) => `Photo client du décant ${productName}${photos.length > 1 ? ` (${i + 1}/${photos.length})` : ''}`

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative w-16 h-16 overflow-hidden border border-border hover:border-primary transition-colors"
            aria-label={`Agrandir : ${altText(i)}`}
          >
            <Image
              src={photo.url}
              alt={altText(i)}
              fill
              sizes="64px"
              loading={i === 0 ? undefined : 'lazy'}
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie"
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
          >
            <X className="w-7 h-7" />
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev() }}
              aria-label="Photo précédente"
              className="absolute left-2 sm:left-6 text-white/80 hover:text-white p-2"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <div
            className="relative w-full max-w-2xl aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[openIndex].url}
              alt={altText(openIndex)}
              fill
              sizes="(max-width: 768px) 90vw, 640px"
              className="object-contain"
            />
          </div>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next() }}
              aria-label="Photo suivante"
              className="absolute right-2 sm:right-6 text-white/80 hover:text-white p-2"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
