'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSettingsStore } from '@/store/settings'
import { useAuthStore } from '@/store/auth'

function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#19110B] px-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-light tracking-[0.2em] text-white mb-6">
          BRAZA SCENT
        </h1>
        <div className="w-24 h-[1px] bg-[#C9A962] mx-auto mb-8" />
        <h2 className="text-xl md:text-2xl text-[#C9A962] tracking-wider mb-4">
          Site en maintenance
        </h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          Nous effectuons actuellement une maintenance pour vous offrir une meilleure expérience.
          Nous serons de retour très bientôt.
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <div className="w-2 h-2 bg-[#C9A962] rounded-full animate-pulse" />
          <span>Maintenance en cours...</span>
        </div>
      </div>
    </div>
  )
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { fetchSettings, isLoaded, settings } = useSettingsStore()
  const { profile, isInitialized } = useAuthStore()
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => { fetchSettings().catch(() => {}) }, { timeout: 2000 })
      } else {
        setTimeout(() => { fetchSettings().catch(() => {}) }, 0)
      }
    }
  }, [fetchSettings])

  // Mode maintenance — uniquement après que les settings soient chargés côté client.
  // On ne bloque JAMAIS le rendu SSR ni l'hydratation avec un spinner :
  // cela tuerait le LCP en affichant un spinner dans tout le HTML prérendu.
  const isAdmin = isInitialized && profile?.is_admin
  const isAccountPage = pathname === '/compte'

  if (isLoaded && settings.maintenanceMode && !isAdmin && !isAccountPage) {
    return <MaintenancePage />
  }

  return <>{children}</>
}
