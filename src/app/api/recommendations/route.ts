import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Colonnes réelles de la table products (vérifiées en DB)
const SELECT = 'id, name, slug, brand, category, gender, price, price_by_size, images, sizes, stock, is_bestseller, is_promo, is_new'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      productIds = [] as string[],
      brands = [] as string[],
      categories = [] as string[],
      cartTotal = 0,
      limit = 6,
    } = body as {
      productIds?: string[]
      brands?: string[]
      categories?: string[]
      cartTotal?: number
      limit?: number
    }

    const cartSet = new Set(productIds)

    // Fetch active + in-stock products (200 max, filter cart items in JS)
    const { data: allProducts, error } = await supabaseAdmin
      .from('products')
      .select(SELECT)
      .eq('is_active', true)
      .gt('stock', 0)
      .limit(200)

    if (error) {
      console.error('Recommendations query error:', error.message)
      // Fallback: return bestsellers only
      return NextResponse.json({ recommendations: await getBestsellers(cartSet, limit) })
    }

    const candidates = (allProducts || []).filter(p => !cartSet.has(p.id))

    if (candidates.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Score by relevance
    const scored = candidates.map(product => {
      let score = 0

      if (brands.length > 0 && brands.includes(product.brand)) score += 30
      if (categories.length > 0 && categories.includes(product.category)) score += 20

      if (cartTotal < 40) {
        if (product.price <= 25) score += 15
        else if (product.price <= 40) score += 8
      } else if (cartTotal < 80) {
        if (product.price >= 20 && product.price <= 60) score += 10
      } else {
        if (product.price >= 40) score += 10
      }

      if (product.is_bestseller) score += 8
      if (product.is_promo) score += 5
      if (product.is_new) score += 3

      score += Math.random() * 3

      return { ...product, score }
    })

    scored.sort((a, b) => b.score - a.score)

    const recommendations = scored.slice(0, limit).map(({ score: _score, ...p }) => ({
      ...p,
      // Normalize field names for UpsellBlock
      priceBySize: p.price_by_size ?? undefined,
      size: Array.isArray(p.sizes) ? p.sizes : [],
    }))

    // If no personalized signal (all score = 0 range), fallback to bestsellers
    const hasSignal = brands.length > 0 || categories.length > 0
    if (!hasSignal && recommendations.length === 0) {
      return NextResponse.json({ recommendations: await getBestsellers(cartSet, limit) })
    }

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ recommendations: [] })
  }
}

async function getBestsellers(excludeIds: Set<string>, limit: number) {
  const { data } = await supabaseAdmin
    .from('products')
    .select(SELECT)
    .eq('is_active', true)
    .eq('is_bestseller', true)
    .gt('stock', 0)
    .limit(limit + excludeIds.size)

  return (data || [])
    .filter(p => !excludeIds.has(p.id))
    .slice(0, limit)
    .map(p => ({
      ...p,
      priceBySize: p.price_by_size ?? undefined,
      size: Array.isArray(p.sizes) ? p.sizes : [],
    }))
}
