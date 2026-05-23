'use client'

interface Props {
  notes: { top: string[]; heart: string[]; base: string[] }
  noteImages?: Record<string, string>
}

const TIERS = [
  {
    key: 'top' as const,
    label: 'Tête',
    sub: '15–30 min',
    desc: 'Première impression',
    barWidth: 'w-1',
  },
  {
    key: 'heart' as const,
    label: 'Cœur',
    sub: '2–4 heures',
    desc: 'Caractère du parfum',
    barWidth: 'w-1.5',
  },
  {
    key: 'base' as const,
    label: 'Fond',
    sub: '6 heures+',
    desc: 'Signature durable',
    barWidth: 'w-2',
  },
]

export default function OlfactivePyramid({ notes }: Props) {
  const hasAny = notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0
  if (!hasAny) return null

  return (
    <div>
      <div className="flex items-start gap-6">

        {/* Pyramide SVG — indicateur visuel */}
        <div className="shrink-0 pt-1 hidden sm:block">
          <svg width="28" height="80" viewBox="0 0 28 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pyramid outline */}
            <polygon
              points="14,2 26,78 2,78"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />
            {/* Tier dividers */}
            <line x1="8" y1="28" x2="20" y2="28" stroke="currentColor" strokeWidth="0.75" className="text-border" />
            <line x1="4" y1="54" x2="24" y2="54" stroke="currentColor" strokeWidth="0.75" className="text-border" />
            {/* Gold dot at top */}
            <circle cx="14" cy="2" r="2" fill="#C9A962" />
          </svg>
        </div>

        {/* Tiers */}
        <div className="flex-1 space-y-0 divide-y divide-border border border-border">
          {TIERS.map((tier) => {
            const tierNotes = notes[tier.key]
            return (
              <div key={tier.key} className="flex gap-4 p-4">

                {/* Barre latérale de largeur progressive (effet pyramide) */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={`${tier.barWidth} bg-primary/70 self-stretch rounded-full`} />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-2.5">
                    <span className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground">
                      {tier.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tracking-wide hidden sm:inline">
                      {tier.sub} · {tier.desc}
                    </span>
                  </div>
                  {tierNotes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tierNotes.map((note) => (
                        <span
                          key={note}
                          className="text-[11px] px-2.5 py-1 border border-border text-muted-foreground tracking-wide hover:border-primary hover:text-foreground transition-colors"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">Non renseigné</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende discrète */}
      <p className="mt-3 text-[10px] text-muted-foreground/50 tracking-[0.1em] text-right">
        TÊTE → CŒUR → FOND · du plus volatile au plus persistant
      </p>
    </div>
  )
}
