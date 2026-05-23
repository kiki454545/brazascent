import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ParfumsClient from './ParfumsClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml',
  description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/parfums`,
  },
  openGraph: {
    title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner.',
    url: `${SITE_URL}/parfums`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums de niche et de luxe - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default async function ParfumsPage() {
  const [productsRes, brandsRes, ratingsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order, gender, notes_top, notes_heart, notes_base, main_accords')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('brands')
      .select('id, name, slug')
      .order('name', { ascending: true }),
    supabase
      .from('product_reviews')
      .select('product_id, rating')
      .eq('is_approved', true),
  ])

  // Calcul de la note moyenne par produit
  const ratingsByProduct: Record<string, { sum: number; count: number }> = {}
  for (const r of (ratingsRes.data || [])) {
    if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = { sum: 0, count: 0 }
    ratingsByProduct[r.product_id].sum += r.rating
    ratingsByProduct[r.product_id].count += 1
  }

  const initialProducts: Product[] = (productsRes.data || []).map((p: any) => {
    const priceBySize = typeof p.price_by_size === 'string'
      ? JSON.parse(p.price_by_size)
      : (p.price_by_size || {})
    const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
    const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price
    const rd = ratingsByProduct[p.id]
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      shortDescription: p.short_description || '',
      price: displayPrice,
      originalPrice: p.original_price,
      priceBySize,
      images: p.images || [],
      size: p.sizes || [],
      category: p.category || 'unisexe',
      collection: p.collection,
      brand: p.brand || '',
      notes: { top: p.notes_top || [], heart: p.notes_heart || [], base: p.notes_base || [] },
      stock: p.stock ?? 1,
      inStock: (p.stock || 0) > 0,
      new: p.is_new,
      bestseller: p.is_bestseller,
      featured: p.is_bestseller,
      promo: p.is_promo ?? false,
      gender: p.gender || 'Unisexe',
      mainAccords: Array.isArray(p.main_accords) ? p.main_accords : [],
      avgRating: rd ? Math.round((rd.sum / rd.count) * 10) / 10 : undefined,
      reviewCount: rd?.count,
    }
  })

  const initialBrands = (brandsRes.data || []) as { id: string; name: string; slug: string }[]

  return <ParfumsClient initialProducts={initialProducts} initialBrands={initialBrands} />
}