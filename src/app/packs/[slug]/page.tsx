import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PackClient from './PackClient'
import type { Product } from '@/types'

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
  const { data } = await supabase
    .from('packs')
    .select('slug')
    .eq('is_active', true)
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getPackData(slug: string) {
  const { data } = await supabase
    .from('packs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

async function getPackProducts(productIds: string[]): Promise<Product[]> {
  if (!productIds.length) return []

  const { data } = await supabase
    .from('products')
    .select('id, name, slug, short_description, description, price, original_price, price_by_size, images, sizes, category, stock, is_new, is_bestseller, notes_top, notes_heart, notes_base')
    .in('id', productIds)

  return (data ?? []).map((p: any) => {
    let displayPrice = p.price
    const priceBySize = p.price_by_size || {}
    if (priceBySize && Object.keys(priceBySize).length > 0) {
      const prices = Object.values(priceBySize as Record<string, number>).filter(price => price > 0)
      if (prices.length > 0) displayPrice = Math.min(...prices)
    }
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      shortDescription: p.short_description || '',
      price: displayPrice,
      priceBySize: p.price_by_size || undefined,
      originalPrice: p.original_price || undefined,
      images: p.images || [],
      size: p.sizes || [],
      category: (p.category as 'homme' | 'femme' | 'unisexe' | 'collection') || 'unisexe',
      notes: {
        top: p.notes_top || [],
        heart: p.notes_heart || [],
        base: p.notes_base || [],
      },
      inStock: (p.stock || 0) > 0,
      new: p.is_new ?? false,
      bestseller: p.is_bestseller ?? false,
      featured: p.is_bestseller ?? false,
    }
  })
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pack = await getPackData(slug)

  if (!pack) {
    return {
      title: 'Pack introuvable',
      description: "Ce pack n'est pas disponible pour le moment.",
    }
  }

  const title = pack.name.toLowerCase().startsWith('pack') ? pack.name : `Pack ${pack.name}`
  const description = pack.description
    ? pack.description.substring(0, 160).trim() + (pack.description.length > 160 ? '...' : '')
    : `Découvrez le pack ${pack.name} sur Braza Scent. Une sélection de parfums à prix avantageux. Livraison rapide en France.`

  const image = pack.image || `${SITE_URL}/images/packs-hero.jpg`
  const canonicalUrl = `${SITE_URL}/packs/${slug}`

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
      images: [{ url: image, width: 1200, height: 630, alt: `Pack ${pack.name} - Braza Scent` }],
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

function getSchemas(pack: any) {
  const title = pack.name.toLowerCase().startsWith('pack') ? pack.name : `Pack ${pack.name}`
  const image = pack.image || `${SITE_URL}/images/packs-hero.webp`
  const canonicalUrl = `${SITE_URL}/packs/${pack.slug}`

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      description: pack.description || `Découvrez le ${title} sur Braza Scent.`,
      image,
      brand: { '@type': 'Organization', name: 'Braza Scent' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        price: pack.price,
        availability: 'https://schema.org/InStock',
        url: canonicalUrl,
        seller: { '@type': 'Organization', name: 'Braza Scent' },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Packs', item: `${SITE_URL}/packs` },
        { '@type': 'ListItem', position: 3, name: title, item: canonicalUrl },
      ],
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PackPage({ params }: PageProps) {
  const { slug } = await params
  const pack = await getPackData(slug)

  if (!pack) notFound()

  const [products, schemas] = await Promise.all([
    getPackProducts(pack.product_ids ?? []),
    Promise.resolve(getSchemas(pack)),
  ])

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <PackClient initialPack={pack} initialProducts={products} />
    </>
  )
}
