'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { useRecentlyViewedStore } from '@/store/recentlyViewed'

interface RecentlyViewedProps {
  excludeId?: string
}

export function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const { items } = useRecentlyViewedStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const visible = items.filter((i) => i.id !== excludeId).slice(0, 6)
  if (visible.length === 0) return null

  return (
    <section className="py-12 border-t border-border">
      <div className="px-6 sm:px-10 lg:px-20">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground">
            Récemment consultés
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {visible.map((item) => (
            <Link
              key={item.id}
              href={`/parfum/${item.slug}`}
              className="group flex-shrink-0 w-32 sm:w-36"
            >
              <div className="relative aspect-square bg-cream overflow-hidden mb-2">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    loading="lazy"
                    sizes="144px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-cream" />
                )}
              </div>
              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                {item.name}
              </p>
              {item.brand && (
                <p className="text-xs text-muted-foreground truncate">{item.brand}</p>
              )}
              <p className="text-xs mt-0.5">{item.price.toLocaleString('fr-FR')} €</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
