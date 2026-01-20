'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch(() => {
        // Ignorer les erreurs d'initialisation (AbortError, etc.)
      })
    }
  }, [initialize, isInitialized])

  return <>{children}</>
}
