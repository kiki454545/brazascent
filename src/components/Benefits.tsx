'use client'

import { m } from 'framer-motion'
import { Gift, Truck, Star } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'

export function Benefits() {
  const { settings } = useSettingsStore()
  const freeShippingThreshold = settings.freeShippingThreshold || 150

  const items = [
    { icon: Gift, title: 'Échantillons offerts', description: 'Dès 120€ d\'achat' },
    { icon: Truck, title: 'Livraison offerte', description: `Dès ${freeShippingThreshold}€ d'achat` },
    { icon: Star, title: 'Économies', description: 'Réductions sur les packs' },
  ]

  return (
    <section className="py-12 lg:py-16 bg-cream border-t border-border">
      <div className="px-6 sm:px-10 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((benefit, index) => (
            <m.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 justify-center"
            >
              <benefit.icon className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">{benefit.title}</p>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
