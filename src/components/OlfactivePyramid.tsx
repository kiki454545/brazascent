'use client'

import Image from 'next/image'

interface Props {
  notes: { top: string[]; heart: string[]; base: string[] }
  noteImages?: Record<string, string>
}

const NOTE_IMAGES: Record<string, string> = {
  // Floraux
  'rose':               'https://images.unsplash.com/photo-1455887683047-f3d9b4e0f9ae',
  'jasmin':             'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
  'pivoine':            'https://images.unsplash.com/photo-1490750967868-88df5691cc99',
  'iris':               'https://images.unsplash.com/photo-1518895949257-6b3f82a59a27',
  'ylang-ylang':        'https://images.unsplash.com/photo-1599940824399-b87987ceb72a',
  'fleur d\'oranger':   'https://images.unsplash.com/photo-1587049352846-4a222e784d38',
  'tubéreuse':          'https://images.unsplash.com/photo-1490750967868-88df5691cc99',
  'lilas':              'https://images.unsplash.com/photo-1490750967868-88df5691cc99',
  'magnolia':           'https://images.unsplash.com/photo-1518895949257-6b3f82a59a27',
  'géranium':           'https://images.unsplash.com/photo-1455887683047-f3d9b4e0f9ae',
  'freesia':            'https://images.unsplash.com/photo-1490750967868-88df5691cc99',
  'muguet':             'https://images.unsplash.com/photo-1518895949257-6b3f82a59a27',
  'violette':           'https://images.unsplash.com/photo-1518895949257-6b3f82a59a27',
  'héliotrop':          'https://images.unsplash.com/photo-1490750967868-88df5691cc99',
  'néroli':             'https://images.unsplash.com/photo-1587049352846-4a222e784d38',
  // Agrumes
  'bergamote':          'https://images.unsplash.com/photo-1587049352846-4a222e784d38',
  'citron':             'https://images.unsplash.com/photo-1590502160462-58b41354f588',
  'orange':             'https://images.unsplash.com/photo-1547036967-23d11aacaee0',
  'pamplemousse':       'https://images.unsplash.com/photo-1576045057995-568f588f82fb',
  'mandarine':          'https://images.unsplash.com/photo-1547036967-23d11aacaee0',
  'citron vert':        'https://images.unsplash.com/photo-1562329265-95a6d7a83440',
  'yuzu':               'https://images.unsplash.com/photo-1590502160462-58b41354f588',
  'zeste de citron':    'https://images.unsplash.com/photo-1590502160462-58b41354f588',
  // Boisés
  'cèdre':              'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'bois de cèdre':      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'santal':             'https://images.unsplash.com/photo-1508739773434-c26b3d09e071',
  'santalum':           'https://images.unsplash.com/photo-1508739773434-c26b3d09e071',
  'vétiver':            'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'patchouli':          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
  'oud':                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'bois de gaïac':      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  'pin':                'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'cyprès':             'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'chêne':              'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'bois de santal':     'https://images.unsplash.com/photo-1508739773434-c26b3d09e071',
  // Orientaux / Balsamiques
  'vanille':            'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4',
  'ambre':              'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
  'musc':               'https://images.unsplash.com/photo-1547637589-f54c34f5d7a4',
  'benjoin':            'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
  'labdanum':           'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
  'myrrhe':             'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'encens':             'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'résine':             'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
  'tolu':               'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
  'styrax':             'https://images.unsplash.com/photo-1518495973542-4542c06a5843',
  // Épicés
  'gingembre':          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5',
  'poivre noir':        'https://images.unsplash.com/photo-1599940824399-b87987ceb72a',
  'poivre':             'https://images.unsplash.com/photo-1599940824399-b87987ceb72a',
  'cardamome':          'https://images.unsplash.com/photo-1615485290382-441e4d049cb5',
  'cannelle':           'https://images.unsplash.com/photo-1508963493744-76c4b2b26f7d',
  'clou de girofle':    'https://images.unsplash.com/photo-1508963493744-76c4b2b26f7d',
  'safran':             'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7',
  'muscade':            'https://images.unsplash.com/photo-1615485290382-441e4d049cb5',
  'cumin':              'https://images.unsplash.com/photo-1599940824399-b87987ceb72a',
  // Verts / Herbes
  'fougère':            'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'lavande':            'https://images.unsplash.com/photo-1499578124509-1611b77778c8',
  'basilic':            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'menthe':             'https://images.unsplash.com/photo-1576045057995-568f588f82fb',
  'herbe coupée':       'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'thym':               'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
  'romarin':            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
  'sauge':              'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
  'bambou':             'https://images.unsplash.com/photo-1448375240586-882707db888b',
  'mousse de chêne':    'https://images.unsplash.com/photo-1448375240586-882707db888b',
  // Fruités
  'pêche':              'https://images.unsplash.com/photo-1586201375761-83865001e31c',
  'framboise':          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'fraise':             'https://images.unsplash.com/photo-1464965911861-746a04b4bca6',
  'pomme':              'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
  'poire':              'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a',
  'prune':              'https://images.unsplash.com/photo-1515023115689-589c33041d3c',
  'cerise':             'https://images.unsplash.com/photo-1528821128474-27f963b062bf',
  'cassis':             'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  'melon':              'https://images.unsplash.com/photo-1571575173700-afb9492e6a50',
  'mangue':             'https://images.unsplash.com/photo-1553279768-865429fa0078',
  'ananas':             'https://images.unsplash.com/photo-1550258987-190a2d41a8ba',
  // Gourmands
  'caramel':            'https://images.unsplash.com/photo-1558961363-fa8fdf82db35',
  'chocolat':           'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2',
  'café':               'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
  'miel':               'https://images.unsplash.com/photo-1558642891-54be180ea339',
  'tonka':              'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4',
  'fève tonka':         'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4',
  'amande':             'https://images.unsplash.com/photo-1508963493744-76c4b2b26f7d',
  'praline':            'https://images.unsplash.com/photo-1558642891-54be180ea339',
  // Aquatiques / Frais
  'eau de mer':         'https://images.unsplash.com/photo-1505118380757-91f5f5632de0',
  'sel marin':          'https://images.unsplash.com/photo-1505118380757-91f5f5632de0',
  'ozonic':             'https://images.unsplash.com/photo-1505118380757-91f5f5632de0',
  'aquatique':          'https://images.unsplash.com/photo-1505118380757-91f5f5632de0',
  'thé vert':           'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
  'thé':                'https://images.unsplash.com/photo-1576092768241-dec231879fc3',
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function getNoteImage(note: string, noteImages?: Record<string, string>): string | null {
  if (noteImages?.[note]) return noteImages[note]
  const exact = NOTE_IMAGES[note.toLowerCase()]
  if (exact) return exact
  const norm = normalize(note)
  const match = Object.entries(NOTE_IMAGES).find(([k]) => normalize(k) === norm)
  return match ? match[1] : null
}

function NoteCircle({ note, noteImages }: { note: string; noteImages?: Record<string, string> }) {
  const img = getNoteImage(note, noteImages)
  return (
    <div className="flex flex-col items-center gap-2 min-w-[56px]">
      <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
        {img ? (
          <Image
            src={img}
            alt={note}
            width={56}
            height={56}
            sizes="56px"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-lg font-light text-white/40">
            {note[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-[11px] text-white/60 text-center leading-tight max-w-[64px]">
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
    maxW: '52%',
  },
  {
    key: 'heart' as const,
    label: 'NOTES DE CŒUR',
    sub: 'Le caractère du parfum',
    accent: '#C47B8A',
    maxW: '76%',
  },
  {
    key: 'base' as const,
    label: 'NOTES DE FOND',
    sub: 'La signature durable',
    accent: '#A07840',
    maxW: '100%',
  },
]

export default function OlfactivePyramid({ notes, noteImages }: Props) {
  const hasAny =
    notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0
  if (!hasAny) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0c0906' }}>
      {/* Pyramid SVG backdrop */}
      <div className="relative">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="py-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF6B" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#C47B8A" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#A07840" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <polygon points="50%,0 100%,100% 0,100%" fill="url(#py-grad)" />
          <polygon
            points="50%,0 100%,100% 0,100%"
            fill="none"
            stroke="#D4AF6B"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          {/* Horizontal dividers */}
          <line x1="17%" y1="33.3%" x2="83%" y2="33.3%" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          <line x1="8.5%" y1="66.6%" x2="91.5%" y2="66.6%" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
        </svg>

        <div className="relative z-10">
          {LEVELS.map((level, i) => {
            const levelNotes = notes[level.key]
            return (
              <div key={level.key} className="py-6 px-6">
                {/* Label */}
                <div className="flex items-center justify-center gap-2 mb-5">
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: level.accent }} />
                  <div className="text-center">
                    <p className="text-[10px] font-medium tracking-[0.25em]" style={{ color: level.accent }}>
                      {level.label}
                    </p>
                    <p className="text-[10px] text-white/30 tracking-wider mt-0.5">{level.sub}</p>
                  </div>
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: level.accent }} />
                </div>

                {/* Notes centered, constrained to maxW */}
                <div className="flex justify-center">
                  <div
                    className="flex flex-wrap gap-x-5 gap-y-4 justify-center"
                    style={{ maxWidth: level.maxW }}
                  >
                    {levelNotes.length > 0 ? (
                      levelNotes.map((note) => (
                        <NoteCircle key={note} note={note} noteImages={noteImages} />
                      ))
                    ) : (
                      <span className="text-xs text-white/20 italic py-2">—</span>
                    )}
                  </div>
                </div>

                {i < LEVELS.length - 1 && (
                  <div className="mt-6 border-b border-white/5" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
