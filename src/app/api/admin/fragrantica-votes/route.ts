import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const LONGEVITY_MAP: Record<string, string> = {
  'poor': 'médiocre', 'very weak': 'médiocre',
  'weak': 'faible',
  'moderate': 'modérée',
  'long lasting': 'longue tenue', 'longlasting': 'longue tenue',
  'eternal': 'très longue tenue',
}

const SILLAGE_MAP: Record<string, string> = {
  'intimate': 'discret', 'discreet': 'discret',
  'moderate': 'modéré',
  'strong': 'puissant', 'fort': 'puissant',
  'enormous': 'énorme',
}

const SEASON_MAP: Record<string, string> = {
  'winter': 'hiver', 'hiver': 'hiver',
  'spring': 'printemps', 'printemps': 'printemps',
  'summer': 'été', 'été': 'été', 'ete': 'été',
  'fall': 'automne', 'autumn': 'automne', 'automne': 'automne',
}

const TIME_MAP: Record<string, string> = {
  'day': 'jour', 'jour': 'jour',
  'night': 'nuit', 'nuit': 'nuit',
}

function normalize(map: Record<string, string>, raw: string): string | null {
  return map[raw.toLowerCase().trim()] ?? null
}

function votesToScores(votes: Record<string, number>): Record<string, number> {
  const total = Object.values(votes).reduce((a, b) => a + b, 0)
  if (total === 0) return {}
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(votes)) {
    result[k] = Math.round((v / total) * 100)
  }
  return result
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Config manquante' }, { status: 503 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body invalide' }, { status: 400 })

  const { productId, longevity, sillage, seasons, timeOfDay } = body

  if (!productId) return NextResponse.json({ error: 'productId manquant' }, { status: 400 })

  // Longevité : on prend la valeur avec le plus de votes
  let longevityNorm: string | null = null
  if (longevity && typeof longevity === 'object') {
    const winner = Object.entries(longevity as Record<string, number>)
      .sort((a, b) => b[1] - a[1])[0]
    if (winner) longevityNorm = normalize(LONGEVITY_MAP, winner[0])
  }

  // Sillage : idem
  let sillageNorm: string | null = null
  if (sillage && typeof sillage === 'object') {
    const winner = Object.entries(sillage as Record<string, number>)
      .sort((a, b) => b[1] - a[1])[0]
    if (winner) sillageNorm = normalize(SILLAGE_MAP, winner[0])
  }

  // Saisons : votes → scores sur 100%
  const seasonsNorm: Record<string, number> = {}
  if (seasons && typeof seasons === 'object') {
    const rawScores = votesToScores(seasons as Record<string, number>)
    for (const [k, v] of Object.entries(rawScores)) {
      const key = normalize(SEASON_MAP, k)
      if (key) seasonsNorm[key] = v
    }
  }

  // Journée : votes → scores sur 100%
  const timeNorm: Record<string, number> = {}
  if (timeOfDay && typeof timeOfDay === 'object') {
    const rawScores = votesToScores(timeOfDay as Record<string, number>)
    for (const [k, v] of Object.entries(rawScores)) {
      const key = normalize(TIME_MAP, k)
      if (key) timeNorm[key] = v
    }
  }

  const { error } = await supabase.from('products').update({
    performance_longevity:   longevityNorm,
    performance_sillage:     sillageNorm,
    performance_seasons:     seasonsNorm,
    performance_time_of_day: timeNorm,
    performance_updated_at:  new Date().toISOString(),
  }).eq('id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })

  return NextResponse.json({ ok: true, longevity: longevityNorm, sillage: sillageNorm, seasons: seasonsNorm, timeOfDay: timeNorm }, { headers: CORS })
}
