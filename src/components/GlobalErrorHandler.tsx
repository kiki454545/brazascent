'use client'

import { useEffect } from 'react'

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Gestionnaire pour les erreurs non gérées
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.name === 'AbortError' ||
        event.message?.includes('AbortError') ||
        event.message?.includes('signal is aborted')
      ) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    // Gestionnaire pour les rejections de promesses non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (
        reason?.name === 'AbortError' ||
        reason?.message?.includes('AbortError') ||
        reason?.message?.includes('signal is aborted') ||
        String(reason)?.includes('AbortError') ||
        String(reason)?.includes('signal is aborted')
      ) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return <>{children}</>
}
