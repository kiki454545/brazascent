import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// ─── Mappings ────────────────────────────────────────────────────────────────

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

function findWinner(html: string, sectionKeyword: string, categories: string[]): string | null {
  const lowerHtml = html.toLowerCase()
  const sectionIdx = lowerHtml.indexOf(sectionKeyword.toLowerCase())
  if (sectionIdx === -1) return null

  const chunk = html.substring(sectionIdx, sectionIdx + 4000)
  const lowerChunk = chunk.toLowerCase()
  const votes: Array<{ cat: string; count: number }> = []

  for (const cat of categories) {
    const catIdx = lowerChunk.indexOf(cat.toLowerCase())
    if (catIdx === -1) continue

    const after = chunk.substring(catIdx + cat.length, catIdx + cat.length + 300)
    const numMatch = after.match(/(?:^|[\s>(\[])(\d{1,5})(?:\s*vote|<|%|\)|]|\s)/i)
    if (numMatch) {
      const count = parseInt(numMatch[1], 10)
      if (count > 0) { votes.push({ cat, count }); continue }
    }
    const anyNum = after.match(/(\d{1,5})/)
    if (anyNum) votes.push({ cat, count: parseInt(anyNum[1], 10) })
  }

  if (votes.length === 0) return null
  votes.sort((a, b) => b.count - a.count)
  return votes[0].cat
}

function extractFromJson(html: string, keyword: 'longevity' | 'sillage'): string | null {
  const patterns = [
    new RegExp(`"${keyword}"\\s*:\\s*"([^"]+)"`, 'i'),
    new RegExp(`'${keyword}'\\s*:\\s*'([^']+)'`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p); if (m) return m[1].toLowerCase()
  }
  return null
}

async function fetchFragrantica(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

async function parsePerformance(url: string) {
  const html = await fetchFragrantica(url)
  if (!html) return { longevity: null, sillage: null }

  const longevityCategories = ['poor', 'weak', 'very weak', 'moderate', 'long lasting', 'longlasting', 'eternal']
  const sillageCategories   = ['intimate', 'moderate', 'strong', 'enormous']

  let longevityRaw = extractFromJson(html, 'longevity') ?? findWinner(html, 'longevity', longevityCategories)
  let sillageRaw   = extractFromJson(html, 'sillage')   ?? findWinner(html, 'sillage', sillageCategories)

  return {
    longevity: longevityRaw ? (LONGEVITY_MAP[longevityRaw.trim()] ?? null) : null,
    sillage:   sillageRaw   ? (SILLAGE_MAP[sillageRaw.trim()] ?? null) : null,
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Config manquante' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  // Optionnel : passer un productId spécifique pour mettre à jour un seul produit
  const singleId = body?.productId as string | undefined

  const query = supabase
    .from('products')
    .select('id, name, fragrantica_url')
    .not('fragrantica_url', 'is', null)
    .neq('fragrantica_url', '')

  if (singleId) query.eq('id', singleId)

  const { data: products, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!products?.length) return NextResponse.json({ message: 'Aucun produit avec fragrantica_url', updated: 0 })

  const results: Array<{ id: string; name: string; longevity: string | null; sillage: string | null; ok: boolean }> = []

  for (const product of products) {
    const { longevity, sillage } = await parsePerformance(product.fragrantica_url)

    const { error: updateError } = await supabase
      .from('products')
      .update({
        performance_longevity:  longevity,
        performance_sillage:    sillage,
        performance_updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)

    results.push({ id: product.id, name: product.name, longevity, sillage, ok: !updateError })

    // Pause entre chaque requête Fragrantica
    if (products.indexOf(product) < products.length - 1) {
      await new Promise(r => setTimeout(r, 2500))
    }
  }

  return NextResponse.json({ updated: results.filter(r => r.ok).length, results })
}
