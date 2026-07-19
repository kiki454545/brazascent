import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import MarqueClient from './MarqueClient'
import type { Product } from '@/types'
import { generateBrandSeoText, BRAND_EXTRA_FAQ } from '@/lib/seo-content'
import { getProductReviewStatsMap } from '@/lib/reviews/public'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const { data } = await supabase.from('brands').select('slug')
  return (data ?? []).map((b: { slug: string }) => ({ slug: b.slug }))
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getBrandData(slug: string) {
  const { data } = await supabase
    .from('brands')
    .select('id, name, slug, description, logo')
    .eq('slug', slug)
    .single()
  return data
}

async function getBrandProducts(brandName: string): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, notes_top, notes_heart, notes_base')
    .eq('brand', brandName)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Une seule requête groupée pour les stats d'avis de tous les produits de la marque.
  const statsMap = await getProductReviewStatsMap(supabase, (data || []).map((p: { id: string }) => p.id))

  return (data ?? []).map((p: any) => {
    const priceBySize = typeof p.price_by_size === 'string'
      ? JSON.parse(p.price_by_size)
      : (p.price_by_size || {})
    const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
    const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price
    const rd = statsMap.get(p.id)

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: '',
      shortDescription: p.short_description || '',
      price: displayPrice,
      originalPrice: p.original_price ?? undefined,
      priceBySize,
      images: p.images || [],
      size: p.sizes || [],
      category: p.category || 'unisexe',
      collection: p.collection ?? undefined,
      brand: p.brand ?? undefined,
      notes: {
        top: p.notes_top || [],
        heart: p.notes_heart || [],
        base: p.notes_base || [],
      },
      stock: p.stock ?? 1,
      inStock: (p.stock || 0) > 0,
      new: p.is_new ?? false,
      bestseller: p.is_bestseller ?? false,
      featured: p.is_bestseller ?? false,
      promo: p.is_promo ?? false,
      avgRating: rd?.avgRating,
      reviewCount: rd?.reviewCount,
    }
  })
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrandData(slug)

  if (!brand) {
    return {
      title: 'Marque introuvable',
      description: "Cette marque n'est pas disponible pour le moment.",
    }
  }

  const title = `Parfums ${brand.name} - Décants & échantillons`
  const description = brand.description
    ? brand.description.substring(0, 160).trim() + (brand.description.length > 160 ? '...' : '')
    : `Découvrez la collection ${brand.name} en décants 2ml, 5ml et 10ml sur Braza Scent. Testez les parfums ${brand.name} avant d'investir. Livraison rapide en France.`

  const image = brand.logo || `${SITE_URL}/images/parfums-hero.jpg`
  const canonicalUrl = `${SITE_URL}/marques/${slug}`

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
      images: [{ url: image, width: 1200, height: 630, alt: `Parfums ${brand.name} - Braza Scent` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Braza Scent`,
      description,
      images: [image],
    },
  }
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

type BrandData = NonNullable<Awaited<ReturnType<typeof getBrandData>>>

// FAQ identique à celle affichée dans MarqueClient (même fonction, mêmes données produit)
function getSchemas(brand: BrandData, products: Product[]) {
  const canonicalUrl = `${SITE_URL}/marques/${brand.slug}`

  const seo = generateBrandSeoText({
    brandName: brand.name,
    description: brand.description,
    products: products.map(p => ({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      notes: p.notes,
    })),
  })

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Brand',
      name: brand.name,
      ...(brand.description && { description: brand.description }),
      ...(brand.logo && { logo: brand.logo }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Parfums ${brand.name} en décants`,
      description: `Découvrez les parfums ${brand.name} en décants 2ml, 5ml et 10ml sur Braza Scent.`,
      url: canonicalUrl,
      ...(brand.logo && { image: brand.logo }),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Marques', item: `${SITE_URL}/marques` },
        { '@type': 'ListItem', position: 3, name: brand.name, item: canonicalUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [...seo.faq, BRAND_EXTRA_FAQ].map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MarquePage({ params }: PageProps) {
  const { slug } = await params

  const brand = await getBrandData(slug)
  if (!brand) notFound()

  const products = await getBrandProducts(brand.name)
  const schemas = getSchemas(brand, products)

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <MarqueClient brand={brand} products={products} />
    </>
  )
}
