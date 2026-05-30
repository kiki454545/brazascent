/**
 * update-fragrantica-performance.ts
 *
 * Fetches longevity & sillage data from Fragrantica pages and stores them in Supabase.
 * Run once, or periodically to refresh stale data.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/update-fragrantica-performance.ts
 *
 * Or with dotenv-cli:
 *   npx dotenv -e .env.local -- npx tsx scripts/update-fragrantica-performance.ts
 */

import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Délai entre chaque requête Fragrantica pour ne pas être bloqué
const DELAY_MS = 3000

// ─── Mappings FR ─────────────────────────────────────────────────────────────

const LONGEVITY_MAP: Record<string, string> = {
  'poor':         'faible',
  'weak':         'faible',
  'very weak':    'faible',
  'moderate':     'modérée',
  'long lasting': 'bonne',
  'longlasting':  'bonne',
  'eternal':      'excellente',
}

const SILLAGE_MAP: Record<string, string> = {
  'intimate': 'intime',
  'moderate': 'modéré',
  'strong':   'puissant',
  'enormous': 'très puissant',
}

// ─── HTML Parsing ─────────────────────────────────────────────────────────────

/**
 * Extrait la valeur dominante d'une section de vote Fragrantica.
 * Cherche les catégories connues et le nombre de votes associé.
 */
function findWinner(
  html: string,
  sectionKeyword: string,
  categories: string[],
): string | null {
  const lowerHtml = html.toLowerCase()

  // Trouver le début de la section (ex: "longevity" ou "sillage")
  const sectionIdx = lowerHtml.indexOf(sectionKeyword.toLowerCase())
  if (sectionIdx === -1) return null

  // Prendre un bloc d'environ 4000 chars après le mot-clé
  const chunk = html.substring(sectionIdx, sectionIdx + 4000)
  const lowerChunk = chunk.toLowerCase()

  const votes: Array<{ cat: string; count: number }> = []

  for (const cat of categories) {
    const catIdx = lowerChunk.indexOf(cat.toLowerCase())
    if (catIdx === -1) continue

    // Chercher le premier nombre dans les 300 chars suivants
    const after = chunk.substring(catIdx + cat.length, catIdx + cat.length + 300)

    // Patterns: "123 votes", "123</", ">123<", "(123%)" etc.
    const numMatch = after.match(/(?:^|[\s>(\[])(\d{1,5})(?:\s*vote|<|%|\)|]|\s)/i)
    if (numMatch) {
      const count = parseInt(numMatch[1], 10)
      if (count > 0) {
        votes.push({ cat, count })
        continue
      }
    }

    // Fallback: premier nombre brut après la catégorie
    const anyNum = after.match(/(\d{1,5})/)
    if (anyNum) {
      votes.push({ cat, count: parseInt(anyNum[1], 10) })
    }
  }

  if (votes.length === 0) return null

  // Retourner la catégorie avec le plus de votes
  votes.sort((a, b) => b.count - a.count)
  console.log(`    Votes trouvés pour "${sectionKeyword}":`, votes.slice(0, 5))
  return votes[0].cat
}

/**
 * Stratégie secondaire : cherche des données encodées en JSON dans les <script>.
 * Certaines versions de Fragrantica injectent les votes en JSON.
 */
function extractFromJson(html: string, keyword: 'longevity' | 'sillage'): string | null {
  // Chercher des patterns comme: "longevity":"long lasting" ou "longevity": { ... }
  const patterns = [
    new RegExp(`"${keyword}"\\s*:\\s*"([^"]+)"`, 'i'),
    new RegExp(`'${keyword}'\\s*:\\s*'([^']+)'`, 'i'),
  ]

  for (const pattern of patterns) {
    const m = html.match(pattern)
    if (m) return m[1].toLowerCase()
  }
  return null
}

// ─── Fetch Fragrantica ────────────────────────────────────────────────────────

async function fetchFragrantica(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (res.status === 403 || res.status === 429) {
      console.warn(`    ⚠️  Fragrantica a bloqué la requête (${res.status}). Attente plus longue...`)
      return null
    }

    if (!res.ok) {
      console.warn(`    ⚠️  HTTP ${res.status} pour ${url}`)
      return null
    }

    return await res.text()
  } catch (err) {
    console.warn(`    ⚠️  Erreur fetch: ${err}`)
    return null
  }
}

// ─── Parse one product ────────────────────────────────────────────────────────

async function parsePerformance(url: string): Promise<{
  longevity: string | null
  sillage: string | null
}> {
  const html = await fetchFragrantica(url)
  if (!html) return { longevity: null, sillage: null }

  const longevityCategories = ['poor', 'weak', 'very weak', 'moderate', 'long lasting', 'longlasting', 'eternal']
  const sillageCategories   = ['intimate', 'moderate', 'strong', 'enormous']

  // Stratégie 1 : JSON embarqué
  let longevityRaw = extractFromJson(html, 'longevity')
  let sillageRaw   = extractFromJson(html, 'sillage')

  // Stratégie 2 : parse HTML de la section de votes
  if (!longevityRaw) longevityRaw = findWinner(html, 'longevity', longevityCategories)
  if (!sillageRaw)   sillageRaw   = findWinner(html, 'sillage', sillageCategories)

  const longevity = longevityRaw ? (LONGEVITY_MAP[longevityRaw.trim()] ?? null) : null
  const sillage   = sillageRaw   ? (SILLAGE_MAP[sillageRaw.trim()] ?? null) : null

  return { longevity, sillage }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍  Récupération des produits avec fragrantica_url...')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, fragrantica_url, performance_updated_at')
    .not('fragrantica_url', 'is', null)
    .neq('fragrantica_url', '')

  if (error) {
    console.error('❌  Erreur Supabase:', error.message)
    process.exit(1)
  }

  if (!products || products.length === 0) {
    console.log('ℹ️   Aucun produit avec fragrantica_url. Ajoutez la colonne via l\'admin produit.')
    return
  }

  console.log(`📦  ${products.length} produit(s) trouvé(s)\n`)

  let updated = 0
  let skipped = 0
  let failed  = 0

  for (const product of products) {
    console.log(`→ [${product.id}] ${product.name}`)
    console.log(`   URL: ${product.fragrantica_url}`)

    const { longevity, sillage } = await parsePerformance(product.fragrantica_url)

    if (!longevity && !sillage) {
      console.log('   ❌  Aucune donnée extraite (page bloquée ou structure inconnue)\n')
      failed++
    } else {
      console.log(`   ✅  Tenue: ${longevity ?? '—'} | Sillage: ${sillage ?? '—'}`)

      const { error: updateError } = await supabase
        .from('products')
        .update({
          performance_longevity: longevity,
          performance_sillage:   sillage,
          performance_updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (updateError) {
        console.error(`   ❌  Erreur mise à jour: ${updateError.message}`)
        failed++
      } else {
        console.log('   💾  Sauvegardé en base\n')
        updated++
      }
    }

    // Pause pour ne pas se faire bloquer par Fragrantica
    if (products.indexOf(product) < products.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  console.log('─'.repeat(50))
  console.log(`✅  Mis à jour : ${updated}`)
  console.log(`⏭️   Échecs     : ${failed}`)
  console.log(`⏭️   Ignorés    : ${skipped}`)
}

main().catch(console.error)
