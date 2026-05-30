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

// ─── Mapping accords → adjectif (facettes …) ────────────────────────────────

const ACCORD_ADJ: Record<string, string> = {
  // Boisé
  'boise': 'boisées', 'woody': 'boisées', 'wood': 'boisées',
  'cedar': 'cèdre', 'cedre': 'cèdre',
  'santal': 'santal', 'sandalwood': 'santal',
  'vetiver': 'vétiver',
  'patchouli': 'patchouli',
  // Musqué / Poudré
  'musque': 'musquées', 'musc': 'musquées', 'musk': 'musquées', 'musky': 'musquées',
  'poudre': 'poudrées', 'powdery': 'poudrées',
  // Vanillé / Gourmand
  'vanille': 'vanillées', 'vanilla': 'vanillées',
  'gourmand': 'gourmandes',
  'sucre': 'sucrées', 'sweet': 'sucrées',
  // Ambré / Oriental / Résine
  'ambre': 'ambrées', 'amber': 'ambrées', 'ambery': 'ambrées',
  'oriental': 'orientales',
  'baume': 'baumées', 'balmy': 'baumées', 'balsamique': 'balsamiques', 'balsamic': 'balsamiques',
  'resine': 'résineuses', 'resinous': 'résineuses',
  // Épicé
  'epice': 'épicées', 'spicy': 'épicées', 'spice': 'épicées',
  'aromatique': 'aromatiques', 'aromatic': 'aromatiques',
  'tabac': 'tabacées', 'tobacco': 'tabacées',
  // Floral
  'floral': 'florales', 'fleuri': 'florales',
  'rose': 'florales', 'jasmin': 'florales', 'iris': 'irisées',
  // Frais / Agrume
  'frais': 'fraîches', 'fresh': 'fraîches',
  'agrume': 'citronnées', 'citrus': 'citronnées', 'hesperide': 'hespéridées',
  'aquatique': 'aquatiques', 'marin': 'aquatiques', 'marine': 'aquatiques', 'aquatic': 'aquatiques',
  // Vert
  'vert': 'végétales', 'vegetal': 'végétales', 'green': 'végétales',
  // Fruité
  'fruite': 'fruitées', 'fruity': 'fruitées',
  // Cuir / Fumé
  'cuir': 'cuirées', 'leather': 'cuirées',
  'fume': 'fumées', 'smoky': 'fumées', 'smoke': 'fumées',
  // Chypré / Fougère
  'chypre': 'chyprées',
  'fougere': 'fougères',
  // Oud
  'oud': 'oudées',
  // Terreux / Aldéhyde
  'terreux': 'terreuses', 'earthy': 'terreuses',
  'aldehy': 'aldéhydées',
}

// Caractère global du parfum (dérivé du premier accord)
const ACCORD_CHAR: Record<string, string> = {
  'boise': 'chaleureux', 'woody': 'chaleureux',
  'cedar': 'sec et élancé', 'cedre': 'sec et élancé',
  'santal': 'soyeux et crémeux', 'sandalwood': 'soyeux et crémeux',
  'vetiver': 'terreux et sophistiqué',
  'patchouli': 'terreux et hypnotique',
  'musque': 'enveloppant', 'musc': 'enveloppant',
  'poudre': 'doux et raffiné',
  'vanille': 'doux et suave',
  'gourmand': 'doux et enveloppant',
  'sucre': 'suave et gourmand',
  'ambre': 'chaleureux et profond', 'amber': 'chaleureux et profond',
  'oriental': 'profond et sensuel',
  'baume': 'chaud et résineux', 'balsamique': 'chaud et résineux',
  'resine': 'chaud et résineux',
  'epice': 'intense et vibrant', 'spicy': 'intense et vibrant',
  'aromatique': 'aromatique et affirmé',
  'tabac': 'sombre et capiteux',
  'floral': 'délicat et élégant', 'rose': 'floral et délicat',
  'iris': 'poudrée et raffiné',
  'frais': 'vif et aérien',
  'agrume': 'vif et énergisant', 'citrus': 'vif et énergisant',
  'aquatique': 'aérien et marin', 'marin': 'aérien et marin',
  'vert': 'frais et végétal',
  'fruite': 'fruité et lumineux',
  'cuir': 'affirmé et caractériel', 'leather': 'affirmé et caractériel',
  'fume': 'sombre et saisissant',
  'chypre': 'élégant et sophistiqué',
  'oud': 'précieux et enveloppant',
}

// ─── Longevity / Sillage ────────────────────────────────────────────────────

const LONGEVITY: Record<string, { adj: string }> = {
  'médiocre':          { adj: 'légère' },
  'faible':            { adj: 'discrète' },
  'modérée':           { adj: 'équilibrée' },
  'bonne':             { adj: 'généreuse' },
  'longue tenue':      { adj: 'généreuse' },
  'très longue tenue': { adj: 'remarquable' },
}

const SILLAGE: Record<string, { adj: string; desc: string }> = {
  'discret':  { adj: 'intime',   desc: 'restant proche de la peau' },
  'modéré':   { adj: 'présent',  desc: 'sans jamais s\'imposer' },
  'puissant': { adj: 'affirmé',  desc: 'qui marque les esprits' },
  'énorme':   { adj: 'puissant', desc: 'impossible à ignorer' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function norm(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// Hash déterministe du nom pour varier les tournures sans aléatoire
function nameHash(name: string): number {
  return Math.abs(name.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0))
}

function accordToAdj(name: string): string | null {
  const n = norm(name)
  for (const [k, v] of Object.entries(ACCORD_ADJ)) {
    if (n === k) return v
  }
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

function pickNotes(allNotes: string[], topAccordNorms: string[]): string[] {
  const generic = new Set(['musc', 'musk', 'ambre', 'amber', 'bois', 'wood', 'muscs blancs', 'white musk', 'base'])
  const overlapsFeaturedAccord = (note: string) =>
    topAccordNorms.some(an => { const n = norm(note); return n.includes(an) || an.includes(n) })

  // Notes intéressantes + pas déjà dans les accords cités
  const interesting = allNotes.filter(note => {
    const n = norm(note)
    if (generic.has(n)) return false
    return !overlapsFeaturedAccord(note)
  })
  // Génériques acceptables si besoin, mais seulement s'ils ne doublonnent pas non plus
  const fallback = allNotes.filter(note => {
    const n = norm(note)
    return generic.has(n) && !overlapsFeaturedAccord(note)
  })
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

// ─── Générateur principal ────────────────────────────────────────────────────

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

  const h = nameHash(name) // pour varier les formulations de façon déterministe

  const allNotes = [
    ...(notes.heart ?? []),
    ...(notes.base ?? []),
    ...(notes.top ?? []),
  ].filter(Boolean)

  const sortedAccords = [...accords]
    .sort((a, b) => (b.intensite ?? 0) - (a.intensite ?? 0))
    .slice(0, 4)

  if (!sortedAccords.length && !allNotes.length && !shortDescription) return null

  const parts: string[] = []

  // ── Phrase 1 : ouverture ─────────────────────────────────────────────────
  const accordAdjs = sortedAccords
    .map(a => accordToAdj(a.nom))
    .filter((v): v is string => v !== null)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3)

  const topAccordNorms = sortedAccords.slice(0, 3).map(a => norm(a.nom))

  if (accordAdjs.length >= 2) {
    const last = accordAdjs[accordAdjs.length - 1]
    const rest = accordAdjs.slice(0, -1)
    const accordStr = rest.join(', ') + ' et ' + last
    const charAdj = accordToChar(sortedAccords[0]?.nom ?? '')

    // 3 tournures d'ouverture en rotation déterministe
    const openings = [
      charAdj
        ? `${name} déploie un caractère ${charAdj}, porté par des facettes ${accordStr}.`
        : `${name} se distingue par des facettes ${accordStr} qui lui confèrent une signature mémorable.`,
      charAdj
        ? `${name} s'affirme par un caractère ${charAdj}, tissé autour de facettes ${accordStr}.`
        : `${name} construit son identité autour de facettes ${accordStr}.`,
      charAdj
        ? `Avec son caractère ${charAdj}, ${name} déploie des facettes ${accordStr} cohérentes et affirmées.`
        : `${name} articule sa personnalité autour de facettes ${accordStr} distinctives.`,
    ]
    parts.push(openings[h % openings.length])

  } else if (accordAdjs.length === 1) {
    parts.push(`${name} s'articule autour d'une signature ${accordAdjs[0]}, affirmant une personnalité distincte.`)
  } else if (shortDescription) {
    parts.push(`${shortDescription.trim().replace(/\.$/, '')}.`)
  }

  // ── Phrase 2 : performance ───────────────────────────────────────────────
  if (longevity && sillage) {
    const lonAdj = LONGEVITY[longevity]?.adj
    const silData = SILLAGE[sillage]
    if (lonAdj && silData) {
      const perfTemplates = [
        `Sa tenue ${lonAdj} et son sillage ${silData.adj} (${silData.desc}) en font une fragrance pensée pour laisser une impression durable.`,
        `Avec une tenue ${lonAdj} et un sillage ${silData.adj}, ${silData.desc}, cette fragrance s'installe avec conviction.`,
        `Sa tenue ${lonAdj} conjuguée à un sillage ${silData.adj} en fait une fragrance que l'on remarque et dont on se souvient.`,
      ]
      parts.push(perfTemplates[(h + 1) % perfTemplates.length])
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

  // ── Phrase 3 : notes ─────────────────────────────────────────────────────
  const selectedNotes = pickNotes(allNotes, topAccordNorms)
  if (selectedNotes.length >= 2) {
    const notesStr = formatNotes(selectedNotes)
    const noteTemplates = [
      `${notesStr} enrichissent la composition, apportant profondeur et complexité à chaque projection.`,
      `${notesStr} traversent la composition avec élégance, révélant sa richesse au fil du temps.`,
      `${notesStr} viennent compléter le tableau olfactif, ajoutant nuance et caractère.`,
    ]
    parts.push(noteTemplates[(h + 2) % noteTemplates.length])
  }

  // ── Phrase 4 : contexte ──────────────────────────────────────────────────
  const timeCtx = getTimeCtx(timeOfDay)
  const seasonCtx = getSeasonCtx(seasons)

  if (timeCtx && seasonCtx) {
    const ctxTemplates = [
      `Cette fragrance s'exprime idéalement ${timeCtx}, ${seasonCtx}, où ses matières premières révèlent toute leur richesse.`,
      `Elle déploie son plein potentiel ${timeCtx}, ${seasonCtx}, au contact d'une peau réchauffée.`,
      `${timeCtx.charAt(0).toUpperCase() + timeCtx.slice(1)} et ${seasonCtx}, cette fragrance trouve son contexte d'expression idéal.`,
    ]
    parts.push(ctxTemplates[(h + 3) % ctxTemplates.length])
  } else if (timeCtx) {
    parts.push(`Elle s'épanouit particulièrement ${timeCtx}, révélant au fil du temps une évolution olfactive subtile.`)
  } else if (seasonCtx) {
    parts.push(`Son caractère prend toute son ampleur ${seasonCtx}, où la matière olfactive se déploie pleinement.`)
  }

  // ── Phrase 5 : closing SEO ───────────────────────────────────────────────
  if (brand) {
    const concLabel =
      category === 'Extrait de Parfum' ? 'extrait de parfum' :
      category === 'Eau de Toilette'   ? 'eau de toilette'   :
      'parfum'
    const article =
      category === 'Eau de Toilette'   ? 'cette' :
      category === 'Extrait de Parfum' ? 'cet'   :
      'ce'
    const closings = [
      `Tester ${article} ${concLabel} ${brand} en décant, c'est s'offrir la pleine expérience de la fragrance, sans l'engagement financier d'un flacon complet.`,
      `Découvrir ${article} ${concLabel} ${brand} via un décant permet d'en saisir toutes les nuances avant de s'engager sur un flacon.`,
      `Un décant de ${article} ${concLabel} ${brand}, c'est la certitude d'un choix éclairé avant l'investissement d'un flacon complet.`,
    ]
    parts.push(closings[(h + 4) % closings.length])
  }

  if (parts.length === 0) return null

  const text = parts.join(' ')
  if (text.split(/\s+/).length < 40) return null

  return text
}
