import { ShieldCheck, Clock, Gift, Lock } from 'lucide-react'

const ITEMS = [
  {
    icon: ShieldCheck,
    label: '100% authentique',
    sub: 'Parfums garantis d\'origine',
  },
  {
    icon: Clock,
    label: 'Expédition 24/48h',
    sub: 'Depuis la France',
  },
  {
    icon: Gift,
    label: 'Échantillon offert',
    sub: 'Avec chaque commande',
  },
  {
    icon: Lock,
    label: 'Paiement sécurisé',
    sub: 'SSL · 3D Secure',
  },
]

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-border/60 py-6">
      {ITEMS.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
            <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
