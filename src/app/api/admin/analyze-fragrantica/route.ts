import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ─── Mapping complet EN + FR → valeur stockée ────────────────────────────────

function pickWinner(raw: unknown, keyMap: Record<string, string>): string | null {
  if (!raw) return null
  // Format votes object → pick highest
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
    if (entries.length === 0) return null
    return keyMap[entries[0][0].toLowerCase().trim()] ?? null
  }
  // Fallback: string value (ancien format)
  if (typeof raw === 'string') {
    return keyMap[raw.toLowerCase().trim()] ?? null
  }
  return null
}

function normalizeLongevity(raw: unknown): string | null {
  return pickWinner(raw, {
    'médiocre': 'médiocre', 'mediocre': 'médiocre', 'very weak': 'médiocre', 'poor': 'médiocre',
    'faible': 'faible', 'weak': 'faible',
    'modérée': 'modérée', 'moderee': 'modérée', 'moderate': 'modérée',
    'longue tenue': 'longue tenue', 'bonne': 'longue tenue', 'long lasting': 'longue tenue', 'longlasting': 'longue tenue',
    'très longue tenue': 'très longue tenue', 'tres longue tenue': 'très longue tenue', 'excellente': 'très longue tenue', 'eternal': 'très longue tenue',
  })
}

function normalizeSillage(raw: unknown): string | null {
  return pickWinner(raw, {
    'discret': 'discret', 'discrete': 'discret', 'intime': 'discret', 'intimate': 'discret',
    'modéré': 'modéré', 'modere': 'modéré', 'moderate': 'modéré',
    'puissant': 'puissant', 'fort': 'puissant', 'strong': 'puissant',
    'énorme': 'énorme', 'enorme': 'énorme', 'enormous': 'énorme', 'très puissant': 'énorme', 'tres puissant': 'énorme',
  })
}

function votesToPct(raw: unknown, keyMap: Record<string, string>): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const mapped: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = keyMap[k.toLowerCase().trim()]
    if (key && typeof v === 'number' && v > 0) mapped[key] = v
  }
  const total = Object.values(mapped).reduce((a, b) => a + b, 0)
  if (total === 0) return {}
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(mapped)) {
    result[k] = Math.round(v / total * 100)
  }
  return result
}

function normalizeSeasons(raw: unknown): Record<string, number> {
  return votesToPct(raw, {
    'hiver': 'hiver', 'winter': 'hiver',
    'printemps': 'printemps', 'spring': 'printemps',
    'été': 'été', 'ete': 'été', 'summer': 'été',
    'automne': 'automne', 'fall': 'automne', 'autumn': 'automne',
  })
}

function normalizeTimeOfDay(raw: unknown): Record<string, number> {
  return votesToPct(raw, {
    'jour': 'jour', 'day': 'jour',
    'nuit': 'nuit', 'night': 'nuit',
  })
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const PROMPT = `Regarde cette image Fragrantica. Réponds UNIQUEMENT avec ce JSON exact, sans aucun texte autour :

{"longevity":{"médiocre":50,"faible":200,"modérée":800,"longue tenue":2400,"très longue tenue":1200},"sillage":{"discret":100,"modéré":600,"puissant":1800,"énorme":400},"seasons":{"hiver":665,"printemps":2400,"été":2400,"automne":1300},"time_of_day":{"jour":2200,"nuit":1000},"genre":{"très féminin":200,"féminin":800,"unisexe":1200,"masculin":600,"très masculin":100}}

Instructions — pour chaque section, lis le NOMBRE DE VOTES affiché sous chaque catégorie et retourne le nombre brut ("2.4k"→2400, "1.3k"→1300, "665"→665) :
1. longevity : votes pour médiocre/poor, faible/weak, modérée/moderate, longue tenue/long lasting, très longue tenue/eternal. Clés FR : "médiocre","faible","modérée","longue tenue","très longue tenue".
2. sillage : votes pour discret/intimate, modéré/moderate, puissant/strong, énorme/enormous. Clés FR : "discret","modéré","puissant","énorme".
3. seasons : votes sous ❄️hiver, 🌸printemps, ☀️été, 🍂automne. Clés : "hiver","printemps","été","automne".
4. time_of_day : votes sous ☀️jour et 🌙nuit. Clés : "jour","nuit".
5. genre : votes pour très féminin/very feminine, féminin/female, unisexe/unisex, masculin/male, très masculin/very masculine. Clés FR : "très féminin","féminin","unisexe","masculin","très masculin".
6. Si une section n'est pas visible → {}.`

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Config Supabase manquante' }, { status: 503 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant' }, { status: 503 })

  const formData = await request.formData()
  const file      = formData.get('image') as File | null
  const productId = formData.get('productId') as string | null
  const type      = (formData.get('type') as string | null) ?? 'all'

  if (!file) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })

  // Lire l'image en base64
  const arrayBuffer = await file.arrayBuffer()
  const base64      = Buffer.from(arrayBuffer).toString('base64')
  const mediaType   = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  // Prompts focalisés par type
  const PROMPTS: Record<string, string> = {
    longevity: `Lis le nombre de votes pour chaque niveau de TENUE/LONGÉVITÉ dans cette image. Réponds UNIQUEMENT avec ce JSON : {"médiocre":0,"faible":0,"modérée":0,"longue tenue":0,"très longue tenue":0}. Remplace les 0 par les vrais nombres ("2.4k"→2400, "1.3k"→1300). Clés anglaises acceptées : poor/weak/moderate/long lasting/eternal.`,
    sillage:   `Lis le nombre de votes pour chaque niveau de SILLAGE dans cette image. Réponds UNIQUEMENT avec ce JSON : {"discret":0,"modéré":0,"puissant":0,"énorme":0}. Remplace les 0 par les vrais nombres ("2.4k"→2400). Clés anglaises acceptées : intimate/moderate/strong/enormous.`,
    seasons:   `Lis le nombre de votes sous chaque SAISON dans cette image. Réponds UNIQUEMENT avec ce JSON : {"hiver":0,"printemps":0,"été":0,"automne":0}. Remplace les 0 par les vrais nombres ("2.4k"→2400). Clés anglaises : winter/spring/summer/fall.`,
    timeOfDay: `Lis le nombre de votes pour JOUR et NUIT dans cette image. Réponds UNIQUEMENT avec ce JSON : {"jour":0,"nuit":0}. Remplace les 0 par les vrais nombres ("2.4k"→2400). Clés anglaises : day/night.`,
    genre:     `Lis le nombre de votes pour chaque catégorie de GENRE dans cette image. Réponds UNIQUEMENT avec ce JSON : {"très féminin":0,"féminin":0,"unisexe":0,"masculin":0,"très masculin":0}. Remplace les 0 par les vrais nombres. Clés anglaises : very feminine/female/unisex/male/very masculine.`,
    all:       PROMPT,
  }

  const prompt = PROMPTS[type] ?? PROMPT

  // Appel Claude vision
  const anthropic = new Anthropic({ apiKey })
  let rawText = ''
  let parsed: Record<string, unknown>

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt },
        ],
      }],
    })

    rawText = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`Pas de JSON trouvé dans: ${rawText}`)
    parsed = JSON.parse(jsonMatch[0])
  } catch (err) {
    return NextResponse.json({ error: `Erreur Claude: ${err}`, raw: rawText }, { status: 500 })
  }

  // Genre : garder uniquement le gagnant
  function extractGenre(raw: unknown): string | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
    const entries = Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'number' && (v as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
    if (entries.length === 0) return null
    const GENRE_MAP: Record<string, string> = {
      'très féminin': 'Femme', 'tres feminin': 'Femme', 'very feminine': 'Femme',
      'féminin': 'Femme', 'feminin': 'Femme', 'feminine': 'Femme', 'female': 'Femme',
      'unisexe': 'Unisexe', 'unisex': 'Unisexe',
      'masculin': 'Homme', 'masculine': 'Homme', 'male': 'Homme',
      'très masculin': 'Homme', 'tres masculin': 'Homme', 'very masculine': 'Homme',
    }
    return GENRE_MAP[entries[0][0].toLowerCase().trim()] ?? entries[0][0]
  }

  // Résultat selon le type demandé
  const dbUpdate: Record<string, unknown> = { performance_updated_at: new Date().toISOString() }
  const result: Record<string, unknown> = { raw_claude: rawText }

  if (type === 'longevity' || type === 'all') {
    result.longevity = normalizeLongevity(type === 'longevity' ? parsed : parsed.longevity)
    dbUpdate.performance_longevity = result.longevity
  }
  if (type === 'sillage' || type === 'all') {
    result.sillage = normalizeSillage(type === 'sillage' ? parsed : parsed.sillage)
    dbUpdate.performance_sillage = result.sillage
  }
  if (type === 'seasons' || type === 'all') {
    result.seasons = normalizeSeasons(type === 'seasons' ? parsed : parsed.seasons)
    dbUpdate.performance_seasons = result.seasons
  }
  if (type === 'timeOfDay' || type === 'all') {
    result.time_of_day = normalizeTimeOfDay(type === 'timeOfDay' ? parsed : parsed.time_of_day)
    dbUpdate.performance_time_of_day = result.time_of_day
  }
  if (type === 'genre' || type === 'all') {
    result.genre = extractGenre(type === 'genre' ? parsed : parsed.genre)
    dbUpdate.performance_genre = result.genre
  }

  if (productId) {
    await supabase.from('products').update(dbUpdate).eq('id', productId)
  }

  return NextResponse.json({ ok: true, ...result })
}
