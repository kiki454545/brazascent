'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => { initialize().catch(() => {}) }, { timeout: 2000 })
      } else {
        setTimeout(() => { initialize().catch(() => {}) }, 0)
      }
    }
  }, [initialize, isInitialized])

  return <>{children}</>
}
