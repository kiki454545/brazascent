'use client'

import Link from 'next/link'
import {
  ShoppingBag,
  Gift,
  Star,
  MessageCircle,
  Package,
  ExternalLink,
} from 'lucide-react'
import { captureEvent, captureException } from '@/lib/analytics'

interface LinkItem {
  label: string
  href: string
  icon: React.ReactNode
  external?: boolean
  variant?: 'gold' | 'default' | 'social'
}

const links: LinkItem[] = [
  {
    label: 'Boutique officielle',
    href: '/parfums',
    icon: <ShoppingBag className="w-5 h-5" />,
    variant: 'gold',
  },
  {
    label: 'Découvrir les packs',
    href: '/packs',
    icon: <Gift className="w-5 h-5" />,
    variant: 'gold',
  },
  {
    label: 'Meilleures ventes',
    href: '/parfums?sort=bestsellers',
    icon: <Star className="w-5 h-5" />,
    variant: 'default',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@braza.scent?_r=1&_t=ZN-93DizAlYMis',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
    external: true,
    variant: 'social',
  },
  {
    label: 'Snapchat',
    href: 'https://snapchat.com/t/RIDz6Z16',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.317 4.883l-.004.081c-.004.027.016.05.043.057.392.09 1.273-.05 1.747-.154.077-.018.154.032.154.111 0 .217-.352.88-.649 1.137-.041.036-.027.097.02.122.229.124 1.092.544 1.092 1.052 0 .435-.56.754-1.01.886-.054.016-.085.07-.07.124.028.1.069.224.118.363.27.77.664 1.887.664 2.617 0 .317-.272.622-.83.622-.226 0-.48-.04-.78-.12-.41-.108-.854-.214-1.18-.214-.305 0-.593.048-.898.146-.624.201-1.26.535-2.046.535-.867 0-1.458-.331-2.146-.535-.33-.103-.617-.146-.88-.146-.333 0-.78.11-1.174.214-.294.076-.543.12-.772.12-.555 0-.826-.305-.826-.622 0-.73.394-1.847.664-2.617.05-.14.09-.263.117-.363a.097.097 0 0 0-.069-.124c-.45-.132-1.01-.45-1.01-.886 0-.508.863-.928 1.092-1.052a.087.087 0 0 0 .02-.122c-.297-.257-.649-.92-.649-1.137 0-.079.077-.13.154-.111.474.104 1.355.244 1.748.154a.054.054 0 0 0 .042-.057l-.004-.081c-.086-1.664-.212-3.69.317-4.883C7.859 1.07 11.216.793 12.206.793z" />
      </svg>
    ),
    external: true,
    variant: 'social',
  },
  {
    label: 'Laisser un avis',
    href: '/avis',
    icon: <Star className="w-5 h-5" />,
    variant: 'default',
  },
  {
    label: 'Support & Contact',
    href: '/contact',
    icon: <MessageCircle className="w-5 h-5" />,
    variant: 'default',
  },
  {
    label: 'Suivre ma commande',
    href: '/compte/commandes',
    icon: <Package className="w-5 h-5" />,
    variant: 'default',
  },
]

function track(label: string, url: string) {
  try {
    captureEvent('link_click', { label, url, source: 'qr_links_page' })
  } catch {}
}

function LinkButton({ item }: { item: LinkItem }) {
  const baseClass =
    'relative flex items-center gap-3 w-full px-6 py-4 rounded-xl font-medium tracking-wide transition-all duration-200 active:scale-[0.98]'

  const variantClass =
    item.variant === 'gold'
      ? 'bg-[#BF9952] text-black hover:bg-[#D4AF6B] shadow-[0_0_20px_rgba(191,153,82,0.3)] hover:shadow-[0_0_28px_rgba(191,153,82,0.5)]'
      : item.variant === 'social'
      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30 backdrop-blur-sm'
      : 'bg-white/6 text-white border border-white/12 hover:bg-white/10 hover:border-white/20'

  const props = {
    className: `${baseClass} ${variantClass}`,
    onClick: () => track(item.label, item.href),
  }

  const content = (
    <>
      <span className="flex-shrink-0">{item.icon}</span>
      <span className="flex-1 text-left text-sm sm:text-base">{item.label}</span>
      {item.external && <ExternalLink className="w-4 h-4 opacity-50 flex-shrink-0" />}
    </>
  )

  if (item.external) {
    return (
      <a {...props} href={item.href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return (
    <Link {...props} href={item.href}>
      {content}
    </Link>
  )
}

export function LinksClient() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-12 px-4"
      style={{
        background: 'radial-gradient(ellipse at top, #1a1208 0%, #0d0d0d 50%, #000000 100%)',
      }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center mb-10 text-center">
        {/* Logo */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#BF9952]/70 mb-1">
            Parfums de niche
          </p>
          <h1
            className="text-3xl sm:text-4xl font-light tracking-[0.3em] uppercase text-white"
            style={{ fontFamily: 'var(--font-serif-display, serif)' }}
          >
            Braza Scent
          </h1>
          <div className="w-16 h-px bg-[#BF9952]/50 mx-auto mt-3" />
        </div>

        <p className="text-lg sm:text-xl font-light text-white/90 mb-2 tracking-wide">
          Rejoignez l&apos;univers BrazaScent
        </p>
        <p className="text-sm text-white/50 max-w-xs leading-relaxed">
          Décants premium préparés à partir de flacons authentiques.
        </p>
      </div>

      {/* Links */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {links.map(item => (
          <LinkButton key={item.label} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center px-4 max-w-sm">
        <p className="text-[10px] text-white/25 leading-relaxed mb-2">
          BrazaScent n&apos;est pas affilié aux marques citées. Les noms de marques sont utilisés
          uniquement à titre informatif.
        </p>
        <a
          href="https://brazascent.com"
          className="text-xs text-[#BF9952]/50 hover:text-[#BF9952] transition-colors tracking-widest uppercase"
        >
          www.brazascent.com
        </a>
      </div>
    </div>
  )
}
