'use client'

import Image from 'next/image'
import Link from 'next/link'
import { noteToSlug } from '@/lib/notes'

interface Props {
  notes: { top: string[]; heart: string[]; base: string[] }
  noteImages?: Record<string, string>
}

const TIERS = [
  { key: 'top' as const, label: 'Tête', sub: '15–30 min', desc: 'Première impression', barWidth: 'w-1' },
  { key: 'heart' as const, label: 'Cœur', sub: '2–4 heures', desc: 'Caractère du parfum', barWidth: 'w-1.5' },
  { key: 'base' as const, label: 'Fond', sub: '6 heures+', desc: 'Signature durable', barWidth: 'w-2' },
]

function getImage(note: string, noteImages?: Record<string, string>) {
  if (!noteImages) return undefined
  return (
    noteImages[note] ||
    noteImages[note.toLowerCase()] ||
    noteImages[note.charAt(0).toUpperCase() + note.slice(1).toLowerCase()]
  )
}

function NoteCircle({ note, noteImages }: { note: string; noteImages?: Record<string, string> }) {
  const img = getImage(note, noteImages)
  return (
    <div className="flex flex-col items-center gap-1.5 w-14">
      <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-cream shrink-0">
        {img ? (
          <Image src={img} alt={note} width={48} height={48} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <span className="text-[8px] text-muted-foreground text-center leading-tight px-0.5">
              {note.split(' ')[0]}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{note}</span>
    </div>
  )
}

function LinkedNote({ note, noteImages }: { note: string; noteImages?: Record<string, string> }) {
  if (!note) return null
  return (
    <Link
      href={`/notes/${noteToSlug(note)}`}
      aria-label={`Voir les parfums avec la note ${note}`}
      className="hover:opacity-75 transition-opacity"
    >
      <NoteCircle note={note} noteImages={noteImages} />
    </Link>
  )
}

export default function OlfactivePyramid({ notes, noteImages }: Props) {
  const tiersWithNotes = TIERS.filter(t => notes[t.key].length > 0)

  if (tiersWithNotes.length === 0) return null

  // Un seul palier renseigné → affichage "Notes principales" à plat
  if (tiersWithNotes.length === 1) {
    const allNotes = notes[tiersWithNotes[0].key]
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg tracking-[0.15em] uppercase">Notes principales</h2>
          <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 tracking-wide">
            Pyramide non communiquée par la marque
          </span>
        </div>
        <div className="border border-border p-5">
          <div className="flex flex-wrap gap-4">
            {allNotes.map(note => (
              <LinkedNote key={note} note={note} noteImages={noteImages} />
            ))}
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground/50 tracking-[0.1em]">
          La marque n&apos;a pas communiqué la répartition tête / cœur / fond pour ce parfum.
        </p>
      </div>
    )
  }

  // Pyramide complète (≥ 2 paliers renseignés)
  return (
    <div>
      <div className="flex items-start gap-6">

        {/* SVG pyramide décoratif */}
        <div className="shrink-0 pt-1 hidden sm:block">
          <svg width="28" height="80" viewBox="0 0 28 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="14,2 26,78 2,78" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
            <line x1="8" y1="28" x2="20" y2="28" stroke="currentColor" strokeWidth="0.75" className="text-border" />
            <line x1="4" y1="54" x2="24" y2="54" stroke="currentColor" strokeWidth="0.75" className="text-border" />
            <circle cx="14" cy="2" r="2" fill="#C9A962" />
          </svg>
        </div>

        {/* Tiers */}
        <div className="flex-1 divide-y divide-border border border-border">
          {TIERS.map((tier) => {
            const tierNotes = notes[tier.key]
            return (
              <div key={tier.key} className="flex gap-4 p-4">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`${tier.barWidth} bg-primary/70 self-stretch rounded-full`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground">
                      {tier.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground tracking-wide hidden sm:inline">
                      {tier.sub} · {tier.desc}
                    </span>
                  </div>
                  {tierNotes.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {tierNotes.map(note => (
                        <LinkedNote key={note} note={note} noteImages={noteImages} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">Non communiqué</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground/50 tracking-[0.1em] text-right">
        TÊTE → CŒUR → FOND · du plus volatile au plus persistant
      </p>
    </div>
  )
}
