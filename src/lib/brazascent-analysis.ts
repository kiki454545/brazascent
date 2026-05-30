export interface AnalysisInput {
  name: string
  brand?: string | null
  shortDescription?: string | null
  accords?: Array<{ nom: string; intensite?: number }>
  notes?: { top?: string[]; heart?: string[]; base?: string[] }
  longevity?: string | null
  sillage?: string | null
  seasons?: Record<string, number>
  timeOfDay?: Record<string, number>
  category?: string | null
}

// ─── Mapping accords → adjectif ──────────────────────────────────────────────

const ACCORD_ADJ: Record<string, string> = {
  'boise': 'boisées', 'woody': 'boisées', 'wood': 'boisées', 'cedar': 'cèdre', 'cedre': 'cèdre',
  'musque': 'musquées', 'musc': 'musquées', 'musk': 'musquées', 'musky': 'musquées',
  'vanille': 'vanillées', 'vanilla': 'vanillées',
  'ambre': 'ambrées', 'amber': 'ambrées', 'ambery': 'ambrées',
  'epice': 'épicées', 'spicy': 'épicées', 'spice': 'épicées',
  'floral': 'florales', 'fleuri': 'florales', 'rose': 'florales',
  'frais': 'fraîches', 'fresh': 'fraîches',
  'oriental': 'orientales',
  'agrume': 'citronnées', 'citrus': 'citronnées',
  'aquatique': 'aquatiques', 'marin': 'aquatiques', 'marine': 'aquatiques', 'aquatic': 'aquatiques',
  'poudre': 'poudrées', 'powdery': 'poudrées',
  'vert': 'végétales', 'vegetal': 'végétales', 'green': 'végétales',
  'gourmand': 'gourmandes',
  'chypre': 'chyprées',
  'cuir': 'cuirées', 'leather': 'cuirées',
  'fume': 'fumées', 'smoky': 'fumées', 'smoke': 'fumées',
  'sucre': 'sucrées', 'sweet': 'sucrées',
  'terreux': 'terreuses', 'earthy': 'terreuses',
  'oud': 'oudées',
  'patchouli': 'patchouli',
  'vetiver': 'vétiver',
  'santal': 'santal', 'sandalwood': 'santal',
  'fougere': 'fougères',
  'baume': 'baumées', 'balmy': 'baumées',
}

const ACCORD_CHAR: Record<string, string> = {
  'boise': 'chaleureux', 'woody': 'chaleureux', 'cedar': 'sec et élancé', 'cedre': 'sec et élancé',
  'musque': 'enveloppant', 'musc': 'enveloppant',
  'vanille': 'doux et suave',
  'ambre': 'chaleureux et profond', 'amber': 'chaleureux et profond',
  'epice': 'intense et vibrant', 'spicy': 'intense et vibrant',
  'floral': 'délicat et élégant',
  'frais': 'vif et aérien',
  'oriental': 'profond et sensuel',
  'agrume': 'vif et énergisant', 'citrus': 'vif et énergisant',
  'aquatique': 'aérien et marin', 'marin': 'aérien et marin',
  'poudre': 'doux et raffiné',
  'vert': 'frais et végétal',
  'gourmand': 'doux et enveloppant',
  'chypre': 'élégant et sophistiqué',
  'cuir': 'affirmé et caractériel', 'leather': 'affirmé et caractériel',
  'fume': 'sombre et saisissant',
  'oud': 'précieux et profond',
  'patchouli': 'terreux et hypnotique',
}

// ─── Longevity / Sillage ──────────────────────────────────────────────────────

const LONGEVITY: Record<string, { adj: string }> = {
  'médiocre':          { adj: 'légère' },
  'faible':            { adj: 'discrète' },
  'modérée':           { adj: 'équilibrée' },
  'bonne':             { adj: 'généreuse' },
  'longue tenue':      { adj: 'généreuse' },
  'très longue tenue': { adj: 'remarquable' },
}

const SILLAGE: Record<string, { adj: string; desc: string }> = {
  'discret':  { adj: 'intime',    desc: 'restant proche de la peau' },
  'modéré':   { adj: 'présent',   desc: 'sans jamais s\'imposer' },
  'puissant': { adj: 'affirmé',   desc: 'qui marque les esprits' },
  'énorme':   { adj: 'puissant',  desc: 'audacieux, impossible à ignorer' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function norm(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function accordToAdj(name: string): string | null {
  const n = norm(name)
  // Exact match first
  for (const [k, v] of Object.entries(ACCORD_ADJ)) {
    if (n === k) return v
  }
  // Partial : l'accord contient la clé (ex: "épicé chaud" contient "epice")
  for (const [k, v] of Object.entries(ACCORD_ADJ)) {
    if (k.length >= 4 && n.includes(k)) return v
  }
  return null
}

function accordToChar(name: string): string | null {
  const n = norm(name)
  for (const [k, v] of Object.entries(ACCORD_CHAR)) {
    if (n === k) return v
  }
  for (const [k, v] of Object.entries(ACCORD_CHAR)) {
    if (k.length >= 4 && n.includes(k)) return v
  }
  return null
}

function notePrep(note: string): string {
  const vowels = ['a', 'e', 'é', 'è', 'ê', 'i', 'o', 'u', 'y', 'h']
  const first = note[0]?.toLowerCase() ?? ''
  return vowels.includes(first) ? `d'${note.toLowerCase()}` : `de ${note.toLowerCase()}`
}

function formatNotes(notes: string[]): string {
  if (notes.length === 0) return ''
  if (notes.length === 1) return `La note ${notePrep(notes[0])}`
  const last = notes[notes.length - 1]
  const rest = notes.slice(0, -1)
  return `Les notes ${rest.map(notePrep).join(', ')} et ${notePrep(last)}`
}

function pickNotes(allNotes: string[]): string[] {
  const generic = new Set(['musc', 'musk', 'ambre', 'amber', 'bois', 'wood', 'muscs blancs', 'white musk'])
  const interesting = allNotes.filter(n => !generic.has(n.toLowerCase()))
  const fallback = allNotes.filter(n => generic.has(n.toLowerCase()))
  return [...interesting, ...fallback].filter(Boolean).slice(0, 3)
}

function getSeasonCtx(seasons: Record<string, number>): string | null {
  const frais = (seasons['hiver'] ?? 0) + (seasons['automne'] ?? 0)
  const chaud = (seasons['été'] ?? 0) + (seasons['printemps'] ?? 0)
  const total = frais + chaud
  if (total === 0) return null
  if (frais / total >= 0.65) return 'durant les saisons fraîches'
  if (chaud / total >= 0.65) return 'durant les saisons chaudes'
  if (frais / total >= 0.55) return 'en automne et en hiver'
  if (chaud / total >= 0.55) return 'au printemps et en été'
  return null
}

function getTimeCtx(timeOfDay: Record<string, number>): string | null {
  const jour = timeOfDay['jour'] ?? 0
  const nuit = timeOfDay['nuit'] ?? 0
  const total = jour + nuit
  if (total === 0) return null
  if (nuit / total >= 0.65) return 'en soirée'
  if (jour / total >= 0.65) return 'en journée'
  if (nuit / total >= 0.55) return 'en soirée, mais aussi en journée'
  return null
}

// ─── Générateur principal ─────────────────────────────────────────────────────

export function generateBrazaScentAnalysis(input: AnalysisInput): string | null {
  const {
    name,
    brand,
    shortDescription,
    accords = [],
    notes = {},
    longevity,
    sillage,
    seasons = {},
    timeOfDay = {},
    category,
  } = input

  const allNotes = [
    ...(notes.heart ?? []),
    ...(notes.base ?? []),
    ...(notes.top ?? []),
  ].filter(Boolean)

  const sortedAccords = [...accords]
    .sort((a, b) => (b.intensite ?? 0) - (a.intensite ?? 0))
    .slice(0, 4)

  const hasAccords = sortedAccords.length >= 1
  const hasNotes = allNotes.length >= 2
  const hasPerf = !!(longevity || sillage)
  const hasContext = Object.keys(seasons).length > 0 || Object.keys(timeOfDay).length > 0

  if (!hasAccords && !hasNotes && !shortDescription) return null

  const parts: string[] = []

  // ── Phrase 1 : ouverture (accords ou description) ─────────────────────────
  const accordAdjs = sortedAccords
    .map(a => accordToAdj(a.nom))
    .filter((v): v is string => v !== null)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3)

  if (accordAdjs.length >= 2) {
    const last = accordAdjs[accordAdjs.length - 1]
    const rest = accordAdjs.slice(0, -1)
    const accordStr = rest.join(', ') + ' et ' + last
    const charAdj = accordToChar(sortedAccords[0]?.nom ?? '')
    if (charAdj) {
      parts.push(`${name} déploie un caractère ${charAdj}, porté par des facettes ${accordStr}.`)
    } else {
      parts.push(`${name} se distingue par des facettes ${accordStr} qui lui confèrent un caractère singulier et mémorable.`)
    }
  } else if (accordAdjs.length === 1) {
    parts.push(`${name} s'articule autour d'une signature ${accordAdjs[0]}, affirmant une personnalité distincte.`)
  } else if (shortDescription) {
    const desc = shortDescription.trim().replace(/\.$/, '')
    parts.push(`${desc}.`)
  }

  // ── Phrase 2 : performance (tenue + sillage) ──────────────────────────────
  if (longevity && sillage) {
    const lonAdj = LONGEVITY[longevity]?.adj
    const silData = SILLAGE[sillage]
    if (lonAdj && silData) {
      parts.push(`Sa tenue ${lonAdj} et son sillage ${silData.adj} (${silData.desc}) en font une fragrance pensée pour laisser une impression durable.`)
    }
  } else if (longevity) {
    const lonAdj = LONGEVITY[longevity]?.adj
    if (lonAdj) {
      parts.push(`Sa tenue ${lonAdj} lui confère une présence mesurée, adaptée aux contextes où la subtilité prime.`)
    }
  } else if (sillage) {
    const silData = SILLAGE[sillage]
    if (silData) {
      parts.push(`Son sillage ${silData.adj} (${silData.desc}) lui assure une présence distincte et cohérente.`)
    }
  }

  // ── Phrase 3 : notes ──────────────────────────────────────────────────────
  const selectedNotes = pickNotes(allNotes)
  if (selectedNotes.length >= 2) {
    const notesStr = formatNotes(selectedNotes)
    parts.push(`${notesStr} enrichissent la composition, apportant profondeur et complexité à chaque projection.`)
  }

  // ── Phrase 4 : contexte d'usage ───────────────────────────────────────────
  const timeCtx = getTimeCtx(timeOfDay)
  const seasonCtx = getSeasonCtx(seasons)

  if (timeCtx && seasonCtx) {
    parts.push(`Cette fragrance s'exprime idéalement ${timeCtx}, ${seasonCtx}, où ses matières premières révèlent toute leur richesse.`)
  } else if (timeCtx) {
    parts.push(`Elle s'épanouit particulièrement ${timeCtx}, révélant au fil du temps une évolution olfactive subtile.`)
  } else if (seasonCtx) {
    parts.push(`Son caractère prend toute son ampleur ${seasonCtx}, où la matière olfactive se déploie pleinement.`)
  }

  // ── Phrase 5 : closing SEO ────────────────────────────────────────────────
  if (brand) {
    const concLabel =
      category === 'Extrait de Parfum' ? 'extrait de parfum' :
      category === 'Eau de Toilette'   ? 'eau de toilette'   :
      'parfum'
    // "ce" → "cet" devant voyelle, "cette" pour EDT (féminin)
    const article =
      category === 'Eau de Toilette'   ? 'cette' :
      category === 'Extrait de Parfum' ? 'cet'   :
      'ce'
    parts.push(`Tester ${article} ${concLabel} ${brand} en décant, c'est s'offrir la pleine expérience de la fragrance, sans l'engagement financier d'un flacon complet.`)
  }

  if (parts.length === 0) return null

  const text = parts.join(' ')
  if (text.split(/\s+/).length < 40) return null

  return text
}
