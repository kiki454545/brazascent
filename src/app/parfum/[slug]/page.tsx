import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProductClient from './ProductClient'
import { generateBrazaScentAnalysis } from '@/lib/brazascent-analysis'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ISR : régénère toutes les heures
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

// ─── Fetch unique partagé par toutes les fonctions ───────────────────────────

async function getProductData(slug: string) {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

async function getReviews(productId: string) {
  const { data } = await supabase
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true)
  return data ?? []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductData(slug)

  if (!product) {
    return {
      title: 'Parfum introuvable',
      description: "Ce parfum n'est pas disponible pour le moment.",
    }
  }

  const normalizeGenre = (g: string | null) => {
    if (!g) return null
    if (['Femme','Féminin','Très féminin'].includes(g)) return 'Femme'
    if (['Homme','Masculin','Très masculin'].includes(g)) return 'Homme'
    if (['Unisexe'].includes(g)) return 'Unisexe'
    return null
  }
  const genre = normalizeGenre(product.performance_genre)
  const genreSuffix = genre ? ` - Parfum ${genre} en Décant` : ' - Décant Parfum'

  const title = product.brand
    ? `${product.name} - ${product.brand}${genreSuffix}`
    : `${product.name}${genreSuffix}`

  // Description riche : priorité à la description complète, sinon construction automatique
  const notesPreview = [
    ...(product.notes_top ?? []),
    ...(product.notes_heart ?? []),
    ...(product.notes_base ?? []),
  ].slice(0, 5).join(', ')

  const description = product.short_description && product.short_description.length > 30
    ? `${product.short_description} — Décant authentique disponible en 2ml, 5ml et 10ml. ${notesPreview ? `Notes : ${notesPreview}.` : ''} Livraison rapide en France.`.slice(0, 160)
    : product.description
    ? product.description.substring(0, 155).trim() + '…'
    : `Découvrez ${product.name}${product.brand ? ` de ${product.brand}` : ''}${genre ? ` - Parfum ${genre}` : ''} en décant sur BrazaScent. Formats 2ml, 5ml, 10ml. Livraison rapide.`

  const image = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : `${SITE_URL}/images/parfums-hero.jpg`

  const canonicalUrl = `${SITE_URL}/parfum/${slug}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | Braza Scent`,
      description,
      url: canonicalUrl,
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Braza Scent',
      images: [{ url: image, width: 1200, height: 1200, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Braza Scent`,
      description,
      images: [image],
    },
  }
}

// ─── JSON-LD Product + Breadcrumb ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getProductJsonLd(product: Record<string, any>, reviews: Array<{ rating: number }>) {
  if (!product) return null

  const reviewCount = reviews.length
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0

  const inStock = (product.stock as number | null) === null || (product.stock as number | null) === undefined || (product.stock as number) > 0
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  let lowPrice = product.price as number
  let highPrice = product.price as number
  try {
    const priceBySize = typeof product.price_by_size === 'string'
      ? JSON.parse(product.price_by_size as string)
      : product.price_by_size
    if (priceBySize && typeof priceBySize === 'object') {
      const prices = Object.values(priceBySize).map(Number).filter(p => p > 0)
      if (prices.length > 0) { lowPrice = Math.min(...prices); highPrice = Math.max(...prices) }
    }
  } catch { /* ignore */ }

  const image = Array.isArray(product.images) && (product.images as string[]).length > 0
    ? (product.images as string[])[0]
    : `${SITE_URL}/images/parfums-hero.jpg`

  const description = (product.short_description as string)
    || (product.description as string)
    || `Découvrez ${product.name} sur Braza Scent.`

  // Notes pour le schéma
  const allNotes = [
    ...((product.notes_top as string[]) ?? []),
    ...((product.notes_heart as string[]) ?? []),
    ...((product.notes_base as string[]) ?? []),
  ]

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image,
    sku: product.slug,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(allNotes.length > 0 ? { additionalProperty: allNotes.map((n: string) => ({ '@type': 'PropertyValue', name: 'Note olfactive', value: n })) } : {}),
    ...(reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(avgRating * 10) / 10,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    offers: lowPrice !== highPrice
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'EUR',
          lowPrice,
          highPrice,
          availability,
          url: `${SITE_URL}/parfum/${product.slug}`,
          seller: { '@type': 'Organization', name: 'Braza Scent' },
        }
      : {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: product.price,
          availability,
          url: `${SITE_URL}/parfum/${product.slug}`,
          seller: { '@type': 'Organization', name: 'Braza Scent' },
        },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Parfums', item: `${SITE_URL}/parfums` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}/parfum/${product.slug}` },
    ],
  }

  return [jsonLd, breadcrumbJsonLd]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params

  // Un seul fetch Supabase pour tout
  const product = await getProductData(slug)

  if (!product) {
    return <ProductClient analysisText={null} initialProductData={null} />
  }

  // Reviews + analyse en parallèle
  const [reviews, analysisText] = await Promise.all([
    getReviews(product.id),
    Promise.resolve(generateBrazaScentAnalysis({
      name: product.name,
      brand: product.brand,
      shortDescription: product.short_description,
      accords: product.accords ?? [],
      notes: {
        top:   product.notes_top   ?? [],
        heart: product.notes_heart ?? [],
        base:  product.notes_base  ?? [],
      },
      longevity: product.performance_longevity,
      sillage:   product.performance_sillage,
      seasons:   (() => { const s = product.performance_seasons; if (!s || typeof s !== 'object' || Array.isArray(s)) return {}; return s })(),
      timeOfDay: (() => { const t = product.performance_time_of_day; if (!t || typeof t !== 'object' || Array.isArray(t)) return {}; return t })(),
      category:  product.category,
    })),
  ])

  const schemas = await getProductJsonLd(product, reviews)

  return (
    <>
      {schemas && schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ProductClient
        analysisText={analysisText}
        initialProductData={product}
      />
    </>
  )
}
