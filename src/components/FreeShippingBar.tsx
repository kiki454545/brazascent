'use client'

import { Truck } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'

interface FreeShippingBarProps {
  total: number
}

export function FreeShippingBar({ total }: FreeShippingBarProps) {
  const { settings } = useSettingsStore()
  const threshold = settings.freeShippingThreshold || 150
  const remaining = Math.max(0, threshold - total)
  const progress = Math.min(100, (total / threshold) * 100)
  const reached = remaining === 0

  return (
    <div className="px-6 py-3 bg-muted/50 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <Truck className={`w-4 h-4 flex-shrink-0 ${reached ? 'text-green-500' : 'text-primary'}`} />
        <p className="text-xs">
          {reached ? (
            <span className="text-green-600 font-medium">Livraison offerte !</span>
          ) : (
            <>
              Plus que{' '}
              <span className="font-semibold text-foreground">
                {remaining.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>{' '}
              pour la livraison offerte
            </>
          )}
        </p>
      </div>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${reached ? 'bg-green-500' : 'bg-primary'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
