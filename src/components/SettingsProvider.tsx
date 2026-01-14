'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    setMounted(true)

    // Éviter les double-appels en React 18 Strict Mode
    if (!fetchedRef.current) {
      fetchedRef.current = true
      fetchSettings()
    }
  }, [fetchSettings])

  // Afficher le spinner seulement pendant un court instant (500ms max)
  // pour éviter le flash de contenu, puis afficher le site
  const [forceShow, setForceShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setForceShow(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted || (!isLoaded && !forceShow)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Mode maintenance activé
  // Seuls les admins connectés peuvent accéder au site
  // La page /compte reste accessible pour permettre aux admins de se connecter
  const isAdmin = isInitialized && profile?.is_admin
  const isAccountPage = pathname === '/compte'

  if (settings.maintenanceMode && !isAdmin && !isAccountPage) {
    return <MaintenancePage />
  }

  return <>{children}</>
}
