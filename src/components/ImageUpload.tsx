'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  bucket: 'products' | 'brands'
  className?: string
}

export function ImageUpload({ value, onChange, bucket, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image')
      return
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      onChange(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Erreur lors de l\'upload. Vérifiez que le bucket existe.')
    } finally {
      setUploading(false)
      // Réinitialiser l'input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />

      {value ? (
        <div className="relative group">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Changer l'image"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Supprimer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#C9A962] hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              <span className="text-sm text-gray-500">Upload en cours...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500">Cliquez pour ajouter une image</span>
              <span className="text-xs text-gray-400">PNG, JPG jusqu'à 5MB</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

interface MultiImageUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
  bucket: 'products' | 'brands'
  maxImages?: number
  className?: string
}

export function MultiImageUpload({
  values,
  onChange,
  bucket,
  maxImages = 5,
  className = ''
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Vérifier le nombre max d'images
    if (values.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images autorisées`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const newUrls: string[] = []

      for (const file of Array.from(files)) {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          continue
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          continue
        }

        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        newUrls.push(publicUrl)
      }

      if (newUrls.length > 0) {
        onChange([...values, ...newUrls])
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newValues = [...values]
    const [removed] = newValues.splice(fromIndex, 1)
    newValues.splice(toIndex, 0, removed)
    onChange(newValues)
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {values.map((url, index) => (
          <div key={url} className="relative group aspect-square">
            <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-[#C9A962] text-white text-xs rounded">
                  Principal
                </span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleReorder(index, 0)}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors text-xs"
                  title="Définir comme principal"
                >
                  1er
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Supprimer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {values.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#C9A962] hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-1"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        {values.length}/{maxImages} images. La première image sera l'image principale.
      </p>
    </div>
  )
}
