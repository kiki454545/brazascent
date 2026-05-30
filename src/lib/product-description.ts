// Génère automatiquement une description enrichie (150-300 mots) quand
// la description manuelle est trop courte (< 150 mots).

export interface ProductDescInput {
  name: string
  brand?: string | null
  category?: string | null
  shortDescription?: string | null
  accords?: Array<{ nom: string; intensite?: number }>
  notes?: { top?: string[]; heart?: string[]; base?: string[] }
  longevity?: string | null
  sillage?: string | null
  seasons?: Record<string, number>
  timeOfDay?: Record<string, number>
  genre?: string | null
  sizes?: string[]
}

// ─── Outils ──────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function h(name: string) {
  return Math.abs(name.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0))
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

function listFr(items: string[], max = 4): string {
  const sl = items.slice(0, max)
  if (sl.length <= 1) return sl[0] ?? ''
  return sl.slice(0, -1).join(', ') + ' et ' + sl[sl.length - 1]
}

function notePrep(n: string): string {
  const v = ['a','e','é','è','ê','i','o','u','y','h']
  return v.includes(n[0]?.toLowerCase() ?? '') ? `d'${n.toLowerCase()}` : `de ${n.toLowerCase()}`
}

// ─── Familles olfactives ──────────────────────────────────────────────────────

function detectFamily(accordNoms: string[]): string {
  const top = accordNoms.slice(0, 3).map(norm).join(' ')
  if (top.includes('oud'))                              return 'Oriental Oudé'
  if (top.includes('vanille') || top.includes('vanilla')) return 'Oriental Vanillé'
  if (top.includes('fume') || top.includes('cuir') || top.includes('leather')) return 'Cuiré Fumé'
  if (top.includes('chypre'))                           return 'Chypré'
  if (top.includes('gourmand'))                         return 'Gourmand'
  if (top.includes('ambre') || top.includes('oriental') || top.includes('baume')) return 'Oriental Ambré'
  if (top.includes('floral') || top.includes('rose') || top.includes('jasmin')) return 'Floral'
  if (top.includes('frais') || top.includes('aquatique') || top.includes('marin')) return 'Frais Aquatique'
  if (top.includes('agrume') || top.includes('citrus') || top.includes('hesperide')) return 'Hespéridé'
  if (top.includes('boise') || top.includes('cedar') || top.includes('santal') || top.includes('vetiver')) return 'Boisé'
  if (top.includes('epice') || top.includes('aromatique')) return 'Aromatique Épicé'
  if (top.includes('poudre') || top.includes('musque') || top.includes('musc')) return 'Poudré Musqué'
  if (top.includes('fruite')) return 'Fruité Floral'
  return 'Contemporain'
}

// ─── Contextes saisonniers / usage ───────────────────────────────────────────

function getSeasonPhrase(seasons: Record<string, number>, seed: number): string {
  const frais = (seasons['hiver'] ?? 0) + (seasons['automne'] ?? 0)
  const chaud = (seasons['été'] ?? 0) + (seasons['printemps'] ?? 0)
  const total = frais + chaud
  if (total === 0) return pick(['toute l\'année', 'toutes les saisons'], seed)
  if (frais / total >= 0.65) return pick(['en automne et en hiver', 'pendant les mois froids', 'lors des soirées fraîches de l\'arrière-saison'], seed)
  if (chaud / total >= 0.65) return pick(['au printemps et en été', 'pendant la saison chaude', 'lors des journées ensoleillées'], seed)
  if (frais / total >= 0.52) return pick(['en automne principalement', 'durant les saisons fraîches'], seed)
  if (chaud / total >= 0.52) return pick(['en été et au printemps', 'pendant les beaux jours'], seed)
  return pick(['toute l\'année', 'en toutes saisons', 'quelle que soit la saison'], seed)
}

function getOccasionPhrase(tod: Record<string, number>, sillage: string, seed: number): string {
  const j = tod['jour'] ?? 0, n = tod['nuit'] ?? 0, total = j + n
  const nuitPct = total > 0 ? n / total : 0.5
  const fort = sillage === 'puissant' || sillage === 'énorme'
  if (nuitPct >= 0.60 && fort) return pick(['les sorties nocturnes et les occasions spéciales', 'les soirées élégantes et les moments marquants', 'les dîners, les soirées et les occasions mémorables'], seed)
  if (nuitPct >= 0.60) return pick(['les soirées et les rendez-vous', 'les moments nocturnes et les instants de séduction', 'les soirées intimes et les occasions romantiques'], seed)
  if (nuitPct <= 0.40 && !fort) return pick(['le quotidien et le bureau', 'les journées actives et le travail', 'les sorties décontractées et le quotidien'], seed)
  return pick(['le quotidien comme les sorties', 'le bureau et les soirées', 'toutes les occasions'], seed)
}

const SILLAGE_DESC: Record<string, string[]> = {
  'discret':  ['proche de la peau, créant une aura intime et personnelle', 'subtil, presque peau contre peau, pour les amateurs de discrétion', 'intime, ne se révélant qu\'aux proches — une signature confidentielle'],
  'modéré':   ['présent sans jamais s\'imposer, laissant une trace élégante', 'équilibré, suffisant pour marquer les esprits sans envahir l\'espace', 'dosé avec précision, respectueux de l\'entourage tout en affirmant sa présence'],
  'puissant': ['affirmé et immédiatement perceptible, il s\'impose avec caractère', 'marquant, il précède son porteur et laisse une empreinte durable', 'généreux, diffusant autour de lui une présence magnétique et assumée'],
  'énorme':   ['audacieux, impossible à ignorer — une présence qui s\'installe et s\'impose', 'explosive, créant une signature olfactive immédiate et mémorable', 'intense, envahissant l\'espace d\'une aura profonde et captivante'],
}

const LONGEVITY_DESC: Record<string, string> = {
  'médiocre':          'légère (moins de 2 heures)',
  'faible':            'discrète (environ 3 heures)',
  'modérée':           'équilibrée (environ 5 heures)',
  'bonne':             'généreuse (environ 8 heures)',
  'longue tenue':      'généreuse (environ 8 heures)',
  'très longue tenue': 'exceptionnelle (plus de 12 heures)',
}

// ─── Générateur principal ─────────────────────────────────────────────────────

export function generateProductDescription(input: ProductDescInput): string | null {
  const {
    name, brand, category, shortDescription,
    accords = [], notes = {}, longevity, sillage,
    seasons = {}, timeOfDay = {}, genre, sizes,
  } = input

  const allNotes = [
    ...(notes.heart ?? []),
    ...(notes.base ?? []),
    ...(notes.top ?? []),
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)

  const topAccords = [...accords]
    .sort((a, b) => (b.intensite ?? 0) - (a.intensite ?? 0))
    .slice(0, 4)

  const accordNoms = topAccords.map(a => a.nom)

  if (accordNoms.length === 0 && allNotes.length === 0) return null

  const seed = h(name)
  const family = detectFamily(accordNoms)
  const formatsStr = (sizes ?? ['2ml', '5ml', '10ml']).slice(0, 3).join(', ')

  // ── Genre label ────────────────────────────────────────────────────────────
  let genreLabel = ''
  if (genre) {
    if (['Femme','Féminin','Très féminin'].includes(genre))       genreLabel = 'féminin'
    else if (['Homme','Masculin','Très masculin'].includes(genre)) genreLabel = 'masculin'
    else if (['Unisexe'].includes(genre))                          genreLabel = 'mixte'
  }

  // ── Paragraphe 1 : Présentation ────────────────────────────────────────────
  const catLabel = (category ?? 'parfum').toLowerCase()
  const accordStr = accordNoms.length >= 2 ? listFr(accordNoms, 3) : (accordNoms[0] ?? '')
  const intro = brand ? `${name} de ${brand}` : name

  const p1Templates = [
    `${intro} est ${catLabel.startsWith('e') || catLabel.startsWith('é') ? 'un' : 'un'} ${catLabel} de la famille ${family}, qui s'impose par une signature à la fois singulière et mémorable. Construit autour ${accordStr.startsWith('a') || accordStr.startsWith('e') || accordStr.startsWith('o') || accordStr.startsWith('u') ? "d'" : 'de '}${accordStr.toLowerCase()}, il déploie une complexité olfactive pensée pour marquer l'espace et les mémoires.`,
    `Avec ${intro}, ${brand ?? 'la maison'} signe ${catLabel.startsWith('e') || catLabel.startsWith('é') ? 'un' : 'un'} ${catLabel} ${family.toLowerCase()} qui ne laisse pas indifférent. Ses accords de ${accordStr.toLowerCase()} tracent une silhouette olfactive immédiatement reconnaissable, quelque part entre tradition et modernité.`,
    `${intro} appartient à la grande famille des parfums ${family.toLowerCase()}. Ce ${catLabel} ${brand ? `de ${brand}` : ''} construit sa signature autour ${accordStr.startsWith('a') || accordStr.startsWith('e') || accordStr.startsWith('o') ? "d'" : 'de '}${accordStr.toLowerCase()}, créant une expérience sensorielle profonde et cohérente.`,
  ]
  const p1 = pick(p1Templates, seed)

  // ── Paragraphe 2 : Notes ───────────────────────────────────────────────────
  let p2 = ''
  const topN  = (notes.top   ?? []).slice(0, 3)
  const heartN = (notes.heart ?? []).slice(0, 3)
  const baseN  = (notes.base  ?? []).slice(0, 3)

  if (topN.length > 0 && (heartN.length > 0 || baseN.length > 0)) {
    const topStr   = listFr(topN, 3)
    const heartStr = heartN.length > 0 ? listFr(heartN, 3) : null
    const baseStr  = baseN.length > 0  ? listFr(baseN, 3)  : null

    const p2Templates = [
      `La composition s'ouvre sur ${listFr(topN.map(n => notePrep(n)), 3)}, offrant une entrée${topN.length === 1 ? ' franche' : ' vive et précise'}. ${heartStr ? `Le cœur révèle ensuite ${listFr(heartN.map(n => notePrep(n)), 3)}, apportant chaleur et complexité.` : ''} ${baseStr ? `Enfin, ${listFr(baseN.map(n => notePrep(n)), 3)} ancrent le sillage dans la durée.` : ''}`,
      `L'ouverture joue sur ${topStr} — ${topN.length === 1 ? 'une note franche et directe' : 'un mélange précis et caractéristique'}. ${heartStr ? `La trame de fond, composée ${listFr(heartN.map(n => notePrep(n)), 3)}, donne au parfum sa profondeur.` : ''} ${baseStr ? `${listFr(baseN.map(n => notePrep(n)), 3)} concluent la composition avec élégance.` : ''}`,
    ]
    p2 = pick(p2Templates, seed + 1).trim()
  } else if (allNotes.length >= 2) {
    const notesStr = listFr(allNotes.slice(0, 4))
    const p2Simple = [
      `Ses notes de ${notesStr} tissent une composition cohérente et expressive, où chaque ingrédient joue un rôle précis dans l'harmonie d'ensemble.`,
      `À travers ${notesStr}, ${name} construit une palette olfactive riche et nuancée qui évolue sur la peau au fil des heures.`,
    ]
    p2 = pick(p2Simple, seed + 1)
  }

  // ── Paragraphe 3 : Saison & occasions ─────────────────────────────────────
  const seasonPhrase = Object.keys(seasons).length > 0
    ? getSeasonPhrase(seasons, seed + 2)
    : pick(['toute l\'année', 'en toutes saisons'], seed + 2)

  const hasTod = Object.keys(timeOfDay).length > 0
  const occasionPhrase = hasTod || sillage
    ? getOccasionPhrase(timeOfDay, sillage ?? '', seed + 3)
    : pick(['les sorties et le quotidien', 'toutes les occasions'], seed + 3)

  const silDesc = sillage && SILLAGE_DESC[sillage]
    ? pick(SILLAGE_DESC[sillage], seed + 4)
    : null

  const lonDesc = longevity ? LONGEVITY_DESC[longevity] : null

  let p3 = `${name} dévoile son plein potentiel ${seasonPhrase}. Il convient particulièrement pour ${occasionPhrase}.`
  if (silDesc) p3 += ` Son sillage est ${silDesc}.`
  if (lonDesc) p3 += ` Sa tenue, ${lonDesc}, en fait un compagnon fiable.`

  // ── Paragraphe 4 : Style olfactif & profil ─────────────────────────────────
  const audienceLabel = genreLabel ? `les amateurs de parfums ${genreLabel}s` : 'les amateurs de parfumerie de qualité'

  const p4Templates = [
    `Dans la famille des parfums ${family.toLowerCase()}, ${name} trouve une place à part : ni consensuel, ni inaccessible, il séduira ${audienceLabel} qui cherchent une fragrance${accordNoms.length > 0 ? ' aux accents ' + accordNoms[0].toLowerCase() : ''} mémorable et affirmée.`,
    `Ce ${catLabel} ${family.toLowerCase()} incarne parfaitement le style de ${brand ?? 'la marque'} : une approche rigoureuse des matières premières, une structure olfactive solide et un caractère distinctif. Il parle à ${audienceLabel} en quête d'une signature forte.`,
    `Le style olfactif ${family.toLowerCase()} de ${name} le positionne parmi les fragrances qui durent dans les mémoires. Il saura séduire ${audienceLabel} qui recherchent${accordNoms.length > 0 ? ' une composition aux notes ' + accordNoms.slice(0, 2).map(n => n.toLowerCase()).join(' et ') : ' un parfum de caractère'}.`,
  ]
  const p4 = pick(p4Templates, seed + 5)

  // ── Paragraphe 5 : Conclusion décant ──────────────────────────────────────
  const p5Templates = [
    `Découvrir ${name} en décant chez BrazaScent, c'est s'offrir l'expérience authentique de cette fragrance en formats ${formatsStr} — le même ${catLabel}, la même concentration, les mêmes matières premières. Une façon intelligente de tester avant d'investir dans un flacon complet.`,
    `BrazaScent propose ${name} en décant authentique — prélevé directement depuis le flacon d'origine — en formats ${formatsStr}. C'est la certitude de vivre la fragrance telle qu'elle a été conçue, sans compromis.`,
    `Avec nos décants ${formatsStr} de ${name}, vivez cette fragrance sur votre peau pendant plusieurs jours avant de vous décider. Chaque décant est prélevé depuis le flacon original de ${brand ?? 'la marque'} : la même qualité, la même authenticité.`,
  ]
  const p5 = pick(p5Templates, seed + 6)

  // ── Assemblage ─────────────────────────────────────────────────────────────
  const paragraphs = [p1, p2, p3, p4, p5].filter(Boolean)
  const full = paragraphs.join('\n\n')

  const wordCount = full.split(/\s+/).length
  if (wordCount < 100) return null

  return full
}

// Compte les mots d'un texte
export function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}
