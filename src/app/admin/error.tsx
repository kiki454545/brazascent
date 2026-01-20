'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Si c'est une AbortError, reset automatiquement sans afficher d'erreur
    if (
      error.name === 'AbortError' ||
      error.message?.includes('AbortError') ||
      error.message?.includes('signal is aborted')
    ) {
      reset()
      return
    }
    console.error('Admin error:', error)
  }, [error, reset])

  // Ne rien afficher pour les AbortError
  if (
    error.name === 'AbortError' ||
    error.message?.includes('AbortError') ||
    error.message?.includes('signal is aborted')
  ) {
    return null
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
        <h2 className="text-xl font-medium mb-4">Erreur</h2>
        <p className="text-gray-600 mb-6">
          Une erreur est survenue lors du chargement de cette page.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#19110B] text-white text-sm tracking-wider uppercase hover:bg-[#C9A962] transition-colors"
        >
          Reessayer
        </button>
      </div>
    </div>
  )
}
