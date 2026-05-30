'use client'

import { useEffect, useState, useRef } from 'react'
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
  MessageSquare,
  Tag,
  Eye,
  ShoppingBag,
  Truck,
  Flower2,
  Star,
  BookOpen,
  Video,
  Percent,
  GripVertical,
  RotateCcw,
  Check,
  Zap,
  Calculator
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { ThemeToggle } from '@/components/ThemeToggle'

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Visiteurs', href: '/admin/visiteurs', icon: Eye },
  { name: 'Paniers', href: '/admin/paniers', icon: ShoppingBag },
  { name: 'Produits', href: '/admin/produits', icon: Package },
  { name: 'Notes olfactives', href: '/admin/notes-olfactives', icon: Flower2 },
  { name: 'Accords olfactifs', href: '/admin/accords-olfactifs', icon: Flower2 },
  { name: 'Packs', href: '/admin/packs', icon: Gift },
  { name: 'Marques', href: '/admin/marques', icon: Building2 },
  { name: 'Commandes', href: '/admin/commandes', icon: ShoppingCart },
  { name: 'Livraisons', href: '/admin/livraisons', icon: Truck },
  { name: 'Produits Promo', href: '/admin/promos', icon: Percent },
  { name: 'Codes Promo', href: '/admin/promo', icon: Tag },
  { name: 'Avis clients', href: '/admin/avis', icon: Star },
  { name: 'Blog', href: '/admin/blog', icon: BookOpen },
  { name: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
  { name: 'Vidéos', href: '/admin/videos', icon: Video },
  { name: 'Automations', href: '/admin/automations', icon: Zap },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { name: 'Calculateur prix', href: '/admin/prix', icon: Calculator },
  { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
]

const DEFAULT_ORDER = adminNav.map(item => item.href)
const NAV_ORDER_KEY = 'admin-nav-order'

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(NAV_ORDER_KEY)
    if (saved) {
      const parsed: string[] = JSON.parse(saved)
      // keep only valid hrefs, append any new ones at end
      const valid = parsed.filter(href => DEFAULT_ORDER.includes(href))
      const missing = DEFAULT_ORDER.filter(href => !valid.includes(href))
      return [...valid, ...missing]
    }
  } catch {}
  return DEFAULT_ORDER
}

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
  const [reorderMode, setReorderMode] = useState(false)
  const [navOrder, setNavOrder] = useState<string[]>(DEFAULT_ORDER)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
    setNavOrder(loadOrder())
    if (!isInitialized) {
      initialize().catch(() => {})
    }
  }, [isInitialized, initialize])

  useEffect(() => {
    if (mounted && isInitialized) {
      if (!user) {
        router.replace('/compte')
      } else if (profile && !profile.is_admin) {
        router.replace('/compte')
      }
    }
  }, [mounted, isInitialized, user, profile, router])

  const sortedNav = navOrder
    .map(href => adminNav.find(item => item.href === href))
    .filter(Boolean) as typeof adminNav

  const handleDragStart = (index: number) => {
    dragItem.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOver.current = index
    setDragOverIndex(index)
  }

  const handleDrop = () => {
    if (dragItem.current === null || dragOver.current === null) return
    if (dragItem.current === dragOver.current) {
      dragItem.current = null
      dragOver.current = null
      setDragOverIndex(null)
      return
    }
    const newOrder = [...navOrder]
    const [removed] = newOrder.splice(dragItem.current, 1)
    newOrder.splice(dragOver.current, 0, removed)
    setNavOrder(newOrder)
    localStorage.setItem(NAV_ORDER_KEY, JSON.stringify(newOrder))
    dragItem.current = null
    dragOver.current = null
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    dragItem.current = null
    dragOver.current = null
    setDragOverIndex(null)
  }

  const resetOrder = () => {
    setNavOrder(DEFAULT_ORDER)
    localStorage.removeItem(NAV_ORDER_KEY)
  }

  if (!mounted || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-admin-muted">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <p className="text-admin-muted">Redirection...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-admin-muted">Vérification des accès...</p>
        </div>
      </div>
    )
  }

  if (!profile.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <p className="text-admin-muted">Accès refusé. Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin min-h-screen bg-admin-bg">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#19110B] text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-white/10">
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

        {/* Nav — scrollable, takes remaining space */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
          {sortedNav.map((item, index) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            const isDragTarget = dragOverIndex === index

            return (
              <div
                key={item.href}
                draggable={reorderMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
                  reorderMode ? 'cursor-grab active:cursor-grabbing' : ''
                } ${
                  isDragTarget
                    ? 'border-2 border-[#C9A962] bg-white/5'
                    : isActive && !reorderMode
                    ? 'bg-[#C9A962] text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {reorderMode && (
                  <GripVertical className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                {!reorderMode && (
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 flex-1"
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                )}
                {reorderMode && (
                  <>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{item.name}</span>
                  </>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer — always visible */}
        <div className="shrink-0 border-t border-white/10">
          {/* Reorder controls */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <button
              onClick={() => setReorderMode(r => !r)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-colors ${
                reorderMode
                  ? 'bg-[#C9A962] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {reorderMode ? <Check className="w-3 h-3" /> : <GripVertical className="w-3 h-3" />}
              {reorderMode ? 'Terminer' : 'Réorganiser'}
            </button>
            {reorderMode && (
              <button
                onClick={resetOrder}
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Réinitialiser l'ordre"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="px-4 pb-4 pt-2">
            <Link
              href="/compte"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour au compte
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <header className="bg-admin-surface shadow-sm sticky top-0 z-30 border-b border-admin-border">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-admin-surface-alt rounded-lg"
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
              <ThemeToggle className="text-admin-muted hover:text-[#C9A962]" />
              <Link
                href="/"
                target="_blank"
                className="text-sm text-admin-muted hover:text-[#C9A962]"
              >
                Voir le site
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#C9A962] rounded-full flex items-center justify-center text-white text-sm">
                  {profile.first_name?.[0] || profile.email[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-admin-text hidden sm:block">
                  {profile.first_name || profile.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
