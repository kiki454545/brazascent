'use client'

import { useRef } from 'react'
import { m, useInView } from 'framer-motion'

interface Accord {
  nom: string
  intensite: number
  couleur: string
}

interface Props {
  accords: Accord[]
}

export default function ScentAccords({ accords }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  if (!accords || accords.length === 0) return null

  const sorted = [...accords].sort((a, b) => b.intensite - a.intensite)

  return (
    <div ref={ref}>
      <h2 className="text-lg tracking-[0.15em] uppercase mb-5">Accords principaux</h2>
      <div className="space-y-3">
        {sorted.map((accord, i) => (
          <div key={accord.nom} className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-28 shrink-0 truncate">
              {accord.nom}
            </span>
            <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden relative">
              <m.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: accord.couleur }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${accord.intensite}%` } : { width: 0 }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
              <m.span
                className="absolute inset-y-0 left-3 flex items-center text-xs font-medium text-white/90 mix-blend-screen"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 + 0.5 }}
              >
                {accord.nom}
              </m.span>
            </div>
            <span className="text-xs text-muted-foreground w-9 text-right shrink-0">
              {accord.intensite}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
