import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ParfumsClient from '../ParfumsClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

const FAMILLES: Record<string, {
  label: string
  emoji: string
  description: string
  keywords: string[]
}> = {
  florale: {
    label: 'Florale',
    emoji: '🌸',
    description: 'Parfums floraux en décants — rose, jasmin, pivoine, iris. Les grandes maisons revisitées en format découverte.',
    keywords: ['rose', 'jasmin', 'iris', 'pivoine', 'fleur', 'lis', 'magnolia', 'muguet', 'violette', 'freesia', 'narcisse', 'ylang', 'géranium', 'hibiscus', 'osmanthus'],
  },
  boisee: {
    label: 'Boisée',
    emoji: '🌲',
    description: 'Parfums boisés en décants — cèdre, santal, oud, vétiver. Des fragrances profondes et enveloppantes.',
    keywords: ['cèdre', 'santal', 'vétiver', 'bois', 'oud', 'gaïac', 'patchouli', 'cyprès', 'pin', 'encens', 'genévrier', 'chêne', 'teck', 'bambou'],
  },
  orientale: {
    label: 'Orientale',
    emoji: '🪔',
    description: 'Parfums orientaux en décants — ambre, musc, vanille, épices chaudes. Chaleur et sensualité garanties.',
    keywords: ['ambre', 'musc', 'vanille', 'benjoin', 'encens', 'résine', 'épice', 'cannelle', 'cardamome', 'poivre', 'safran', 'tonka', 'labdanum', 'myrrhe'],
  },
  fraiche: {
    label: 'Fraîche',
    emoji: '🍃',
    description: 'Parfums frais en décants — agrumes, aromates, aquatiques. Légèreté et vivacité pour le quotidien.',
    keywords: ['bergamote', 'citron', 'mandarine', 'agrumes', 'pamplemousse', 'menthe', 'basilic', 'thé vert', 'marine', 'aquatique', 'herbe', 'lavande', 'vétiver', 'gingembre'],
  },
}

interface PageProps {
  params: Promise<{ famille: string }>
}

export async function generateStaticParams() {
  return Object.keys(FAMILLES).map((famille) => ({ famille }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { famille } = await params
  const info = FAMILLES[famille]
  if (!info) return { title: 'Parfums | Braza Scent' }

  return {
    title: `Parfums ${info.label}s — Décants 2ml, 5ml, 10ml | Braza Scent`,
    description: info.description,
    alternates: { canonical: `${SITE_URL}/parfums/${famille}` },
    openGraph: {
      title: `Parfums ${info.label}s | Braza Scent`,
      description: info.description,
      url: `${SITE_URL}/parfums/${famille}`,
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Braza Scent',
    },
  }
}

function matchesFamille(product: Product, keywords: string[]): boolean {
  const allNotes = [
    ...(product.notes?.top || []),
    ...(product.notes?.heart || []),
    ...(product.notes?.base || []),
    ...((product.mainAccords || []).map((a: any) => typeof a === 'string' ? a : (a.name || ''))),
  ].filter(Boolean).map((n: string) => n.toLowerCase())
  return allNotes.some((note) => keywords.some((kw) => note.includes(kw)))
}

export default async function FamillePage({ params }: PageProps) {
  const { famille } = await params
  const info = FAMILLES[famille]
  if (!info) notFound()

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

  const ratingsByProduct: Record<string, { sum: number; count: number }> = {}
  for (const r of (ratingsRes.data || [])) {
    if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = { sum: 0, count: 0 }
    ratingsByProduct[r.product_id].sum += r.rating
    ratingsByProduct[r.product_id].count += 1
  }

  const allProducts: Product[] = (productsRes.data || []).map((p: any) => {
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

  // Filtrer par famille olfactive
  const initialProducts = allProducts.filter((p) => matchesFamille(p, info.keywords))
  const initialBrands = (brandsRes.data || []) as { id: string; name: string; slug: string }[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Parfums ${info.label}s — Braza Scent`,
    description: info.description,
    url: `${SITE_URL}/parfums/${famille}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ParfumsClient
        initialProducts={initialProducts}
        initialBrands={initialBrands}
        familleFilter={famille}
        familleLabel={`${info.emoji} ${info.label}`}
      />
    </>
  )
}
