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

const FRAGRANTICA_ACCORD_COLORS: Record<string, string> = {
  // Boisés
  'Boisé':         '#8B6914',
  'Cèdre':         '#A0764A',
  'Santal':        '#C4956A',
  'Vétiver':       '#6B5C3E',
  'Patchouli':     '#6B4C11',
  'Oud':           '#4A2E0E',
  // Floraux
  'Floral':        '#E8A0BF',
  'Rose':          '#E8607A',
  'Jasmin':        '#F0E68C',
  'Fleur blanche': '#F5F0E8',
  'Iris':          '#9B8EC4',
  'Pivoine':       '#FF9EB5',
  // Orientaux / Ambrés
  'Oriental':      '#C4541A',
  'Ambré':         '#CC7722',
  'Vanille':       '#F5C842',
  'Gourmand':      '#8B4513',
  'Caramel':       '#C68642',
  'Miel':          '#D4A017',
  // Musqués / Poudrés
  'Musqué':        '#C4A882',
  'Poudré':        '#D4A5A5',
  'Doux':          '#E8C4C4',
  'Crémeux':       '#F0D9B5',
  // Épicés
  'Épicé':         '#8B2500',
  'Poivre':        '#5C3317',
  'Cannelle':      '#8B4513',
  'Cardamome':     '#6B4226',
  // Frais / Agrumes
  'Frais':         '#4A9EBF',
  'Agrume':        '#F4A523',
  'Citron':        '#FFF44F',
  'Bergamote':     '#D4E157',
  'Aquatique':     '#2E86AB',
  'Marin':         '#1A6B8A',
  'Ozonic':        '#87CEEB',
  // Verts / Aromatiques
  'Vert':          '#5A8A3C',
  'Aromatique':    '#7B9E5E',
  'Fougère':       '#4A7B4F',
  'Lavande':       '#967BB6',
  'Herbal':        '#6B8E5E',
  // Chyprés / Cuirés
  'Chypré':        '#6B8E23',
  'Cuir':          '#8B4A2F',
  'Fumé':          '#696969',
  'Animalic':      '#7B5E3E',
  // Fruités
  'Fruité':        '#FF6B6B',
  'Framboise':     '#C71585',
  'Pêche':         '#FFCBA4',
  'Cassis':        '#4B0082',
  // Résines
  'Résineux':      '#8B6914',
  'Encens':        '#704214',
  'Myrrhe':        '#8B4513',
  'Balsamique':    '#6B3A2A',
}

function getAccordColor(nom: string, fallback: string): string {
  if (FRAGRANTICA_ACCORD_COLORS[nom]) return FRAGRANTICA_ACCORD_COLORS[nom]
  const key = Object.keys(FRAGRANTICA_ACCORD_COLORS).find(
    k => nom.toLowerCase().includes(k.toLowerCase())
  )
  return key ? FRAGRANTICA_ACCORD_COLORS[key] : fallback
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
        {sorted.map((accord, i) => {
          const barColor = getAccordColor(accord.nom, accord.couleur)
          return (
            <div key={accord.nom} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-28 shrink-0 truncate">
                {accord.nom}
              </span>
              <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden relative">
                <m.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: barColor }}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${accord.intensite}%` } : { width: 0 }}
                  transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
