'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Building2,
  Mail,
  Gift,
  MessageSquare
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produits', href: '/admin/produits', icon: Package },
  { name: 'Packs', href: '/admin/packs', icon: Gift },
  { name: 'Marques', href: '/admin/marques', icon: Building2 },
  { name: 'Commandes', href: '/admin/commandes', icon: ShoppingCart },
  { name: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, profile, isInitialized, initialize } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isInitialized) {
      initialize().catch(() => {
        // Ignorer les erreurs d'initialisation (AbortError, etc.)
      })
    }
  }, [isInitialized, initialize])

  useEffect(() => {
    // Attendre que tout soit initialisé avant de vérifier
    if (mounted && isInitialized) {
      // Si pas d'utilisateur ou pas admin, rediriger
      if (!user) {
        router.replace('/compte')
      } else if (profile && !profile.is_admin) {
        // Le profil est chargé mais l'utilisateur n'est pas admin
        router.replace('/compte')
      }
    }
  }, [mounted, isInitialized, user, profile, router])

  // Afficher le loader pendant le chargement
  if (!mounted || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  // Rediriger si pas connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500">Redirection...</p>
        </div>
      </div>
    )
  }

  // Attendre le profil
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Vérification des accès...</p>
        </div>
      </div>
    )
  }

  // Vérifier les droits admin
  if (!profile.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500">Accès refusé. Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#19110B] text-white transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-xl font-light tracking-[0.15em]">
              ADMIN
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">Braza Scent</p>
        </div>

        <nav className="p-4 space-y-1">
          {adminNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#C9A962] text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            href="/compte"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour au compte
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:block">
              <h1 className="text-lg font-medium">
                {adminNav.find(item =>
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                )?.name || 'Administration'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="text-sm text-gray-500 hover:text-[#C9A962]"
              >
                Voir le site
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#C9A962] rounded-full flex items-center justify-center text-white text-sm">
                  {profile.first_name?.[0] || profile.email[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {profile.first_name || profile.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
