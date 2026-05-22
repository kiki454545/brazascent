'use client'

import Image from 'next/image'

interface Props {
  notes: { top: string[]; heart: string[]; base: string[] }
  noteImages?: Record<string, string>
}

function NoteCircle({ note, imageUrl }: { note: string; imageUrl?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[72px]">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md border border-white/20 shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={note}
            width={64}
            height={64}
            className="w-full h-full object-cover mix-blend-multiply"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <span className="text-[8px] text-stone-400 text-center px-1 leading-tight">
              {note.split(' ').slice(0, 2).join('\n')}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-white/55 text-center leading-tight max-w-[72px]">
        {note}
      </span>
    </div>
  )
}

const LEVELS = [
  {
    key: 'top' as const,
    label: 'NOTES DE TÊTE',
    sub: 'Première impression',
    accent: '#D4AF6B',
    maxW: '55%',
    bg: 'rgba(212,175,107,0.04)',
  },
  {
    key: 'heart' as const,
    label: 'NOTES DE CŒUR',
    sub: 'Le caractère du parfum',
    accent: '#C47B8A',
    maxW: '75%',
    bg: 'transparent',
  },
  {
    key: 'base' as const,
    label: 'NOTES DE FOND',
    sub: 'La signature durable',
    accent: '#A07840',
    maxW: '100%',
    bg: 'rgba(160,120,64,0.05)',
  },
]

export default function OlfactivePyramid({ notes, noteImages }: Props) {
  const hasAny = notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0
  if (!hasAny) return null

  function getImage(note: string) {
    if (!noteImages) return undefined
    return (
      noteImages[note] ||
      noteImages[note.toLowerCase()] ||
      noteImages[note.charAt(0).toUpperCase() + note.slice(1).toLowerCase()]
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0906' }}>
      <div className="relative">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="py-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#D4AF6B" stopOpacity="0.12" />
              <stop offset="50%"  stopColor="#C47B8A" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#A07840" stopOpacity="0.10" />
            </linearGradient>
          </defs>
          <polygon points="50%,0 100%,100% 0,100%" fill="url(#py-grad)" />
          <polygon
            points="50%,0 100%,100% 0,100%"
            fill="none"
            stroke="#D4AF6B"
            strokeOpacity="0.10"
            strokeWidth="1"
          />
          <line x1="17%" y1="33.3%" x2="83%" y2="33.3%" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
          <line x1="8.5%" y1="66.6%" x2="91.5%" y2="66.6%" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
        </svg>

        <div className="relative z-10">
          {LEVELS.map((level, i) => {
            const levelNotes = notes[level.key]
            return (
              <div
                key={level.key}
                className="py-7 px-6"
                style={{ background: level.bg }}
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: level.accent }} />
                  <div className="text-center">
                    <p className="text-[11px] font-semibold tracking-[0.3em]" style={{ color: level.accent }}>
                      {level.label}
                    </p>
                    <p className="text-[10px] text-white/30 tracking-[0.15em] mt-1">{level.sub}</p>
                  </div>
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: level.accent }} />
                </div>

                <div className="flex justify-center">
                  <div
                    className="flex flex-wrap gap-x-4 gap-y-5 justify-center"
                    style={{ maxWidth: level.maxW }}
                  >
                    {levelNotes.length > 0 ? (
                      levelNotes.map((note) => (
                        <NoteCircle key={note} note={note} imageUrl={getImage(note)} />
                      ))
                    ) : (
                      <span className="text-xs text-white/20 italic py-2">—</span>
                    )}
                  </div>
                </div>

                {i < LEVELS.length - 1 && (
                  <div className="mt-7 border-b border-white/5" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
