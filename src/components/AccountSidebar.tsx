'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, Heart, MapPin, MessageSquare, LogOut, Shield, User } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  isActive: (pathname: string) => boolean
}

const items: NavItem[] = [
  {
    label: 'Mon profil',
    href: '/compte',
    icon: User,
    isActive: (p) => p === '/compte',
  },
  {
    label: 'Mes commandes',
    href: '/compte/commandes',
    icon: Package,
    isActive: (p) => p.startsWith('/compte/commandes'),
  },
  {
    label: 'Mes favoris',
    href: '/favoris',
    icon: Heart,
    isActive: (p) => p.startsWith('/favoris'),
  },
  {
    label: 'Mes adresses',
    href: '/compte/adresses',
    icon: MapPin,
    isActive: (p) => p.startsWith('/compte/adresses'),
  },
  {
    label: 'Support',
    href: '/compte/tickets',
    icon: MessageSquare,
    isActive: (p) => p.startsWith('/compte/tickets'),
  },
]

export function AccountSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuthStore()

  return (
    <aside className="bg-cream shadow-sm">
      <nav>
        {items.map((item) => {
          const active = item.isActive(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3.5 border-l-2 transition-colors ${
                active
                  ? 'border-primary text-foreground font-medium bg-foreground/[0.03]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-5 py-3.5 border-l-2 border-transparent text-red-600/80 hover:text-red-600 hover:bg-muted/40 transition-colors text-left"
        >
          <LogOut className="w-5 h-5" />
          <span>Se déconnecter</span>
        </button>

        {profile?.is_admin && (
          <>
            <div className="mx-5 my-2 border-t border-border" />
            <Link
              href="/admin"
              className="flex items-center gap-3 px-5 py-3 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Administration</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
