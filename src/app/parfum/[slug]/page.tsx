import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProductClient from './ProductClient'
import { generateBrazaScentAnalysis } from '@/lib/brazascent-analysis'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Pré-génère toutes les fiches produit actives au build (SSG)
// ISR toutes les heures pour les mises à jour
export const revalidate = 3600

export async function generateStaticParams() {
  const { data } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
}

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

// ─── Génération meta description 140-160 chars ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMetaDescription(product: Record<string, any>): string {
  const name   = (product.name  as string) || ''
  const brand  = (product.brand as string | null) || ''
  const cat    = (product.category as string | null) || 'Parfum'
  const sizes  = (product.sizes as string[] | null) ?? ['2ml', '5ml', '10ml']

  // Notes : cœur + fond (plus distinctives) puis tête
  const notes: string[] = [
    ...((product.notes_heart as string[] | null) ?? []),
    ...((product.notes_base  as string[] | null) ?? []),
    ...((product.notes_top   as string[] | null) ?? []),
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  // Genre
  const rawGenre = product.performance_genre as string | null
  let genreLabel = ''
  if (rawGenre) {
    if (['Femme','Féminin','Très féminin'].includes(rawGenre))       genreLabel = 'femme'
    else if (['Homme','Masculin','Très masculin'].includes(rawGenre)) genreLabel = 'homme'
    else if (['Unisexe'].includes(rawGenre))                          genreLabel = 'mixte'
  }

  // Moment idéal (depuis performance_time_of_day)
  const tod = product.performance_time_of_day as Record<string, number> | null
  let timeLabel = ''
  if (tod && typeof tod === 'object' && !Array.isArray(tod)) {
    const j = tod['jour'] ?? 0, n = tod['nuit'] ?? 0, total = j + n
    if (total > 0) {
      if (n / total >= 0.60)      timeLabel = 'soirée'
      else if (j / total >= 0.60) timeLabel = 'journée'
    }
  }

  const formatsStr = sizes.join(', ')

  // Assemblage adaptatif : réduit les notes jusqu'à entrer dans 140-160 chars
  for (let n = Math.min(notes.length, 5); n >= 0; n--) {
    const notesStr = n > 0 ? notes.slice(0, n).join(', ') : ''

    let desc = brand ? `${name} de ${brand}` : name
    if (notesStr) desc += ` — ${notesStr}.`
    else          desc += '.'

    const ctx: string[] = [cat]
    if (genreLabel) ctx.push(genreLabel)
    if (timeLabel)  ctx.push(`idéal en ${timeLabel}`)
    desc += ` ${ctx.join(', ')}.`

    desc += ` Décant ${formatsStr} sur BrazaScent. Livraison rapide.`

    if (desc.length >= 140 && desc.length <= 160) return desc
    if (desc.length > 160) continue  // trop long, réduire les notes

    // Trop court : compléter
    for (const add of [' Authentique.', " Testez avant d'acheter.", ' Livraison en France.']) {
      if (desc.length + add.length <= 160) {
        desc += add
        if (desc.length >= 140) return desc
      }
    }
    return desc
  }

  // Fallback
  const fb = brand
    ? `Décant ${name} de ${brand}. ${cat}. Disponible en ${formatsStr} sur BrazaScent. Livraison rapide.`
    : `Décant ${name}. ${cat}. Disponible en ${formatsStr} sur BrazaScent. Livraison rapide.`
  return fb.substring(0, 160)
}

// ─── Titre SEO ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTitle(product: Record<string, any>): string {
  const genre = (() => {
    const g = product.performance_genre as string | null
    if (!g) return null
    if (['Femme','Féminin','Très féminin'].includes(g))       return 'Femme'
    if (['Homme','Masculin','Très masculin'].includes(g))     return 'Homme'
    if (['Unisexe'].includes(g))                              return 'Unisexe'
    return null
  })()
  const genreSuffix = genre ? ` - Parfum ${genre} en Décant` : ' - Décant Parfum'
  return product.brand
    ? `${product.name} - ${product.brand}${genreSuffix}`
    : `${product.name}${genreSuffix}`
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

  const title       = buildTitle(product)
  const description = buildMetaDescription(product)

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

  const description = buildMetaDescription(product)

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

  // Prix minimum pour affichage SEO
  const priceBySize = typeof product.price_by_size === 'string'
    ? JSON.parse(product.price_by_size)
    : (product.price_by_size || {})
  const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price

  const allNotes = [
    ...(product.notes_top ?? []),
    ...(product.notes_heart ?? []),
    ...(product.notes_base ?? []),
  ]

  return (
    <>
      {schemas && schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Contenu SEO en HTML pur — toujours indexable par Google */}
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        <h1>{product.name}{product.brand ? ` — ${product.brand}` : ''}</h1>
        {product.short_description && <p>{product.short_description}</p>}
        {product.description && <p>{product.description}</p>}
        {minPrice > 0 && <p>À partir de {minPrice}€ — disponible en décant 2ml, 5ml, 10ml</p>}
        {product.category && <p>{product.category}</p>}
        {allNotes.length > 0 && <p>Notes olfactives : {allNotes.join(', ')}</p>}
        {analysisText && <p>{analysisText}</p>}
        <p><a href="/parfums">Tous les parfums</a></p>
        {product.brand && <p><a href={`/marques/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}>{product.brand}</a></p>}
      </div>

      <ProductClient
        analysisText={analysisText}
        initialProductData={product}
      />
    </>
  )
}
