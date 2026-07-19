import { ShieldCheck } from 'lucide-react'

export function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] tracking-wide uppercase text-primary ${className}`}>
      <ShieldCheck className="w-3.5 h-3.5" />
      Achat vérifié
    </span>
  )
}
