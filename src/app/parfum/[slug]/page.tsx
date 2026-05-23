import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProductClient from './ProductClient'

const SITE_URL = 'https://brazascent.com'

// Client Supabase pour le fetch côté serveur (metadata)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Régénération des metadata toutes les heures
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const { data: product } = await supabase
      .from('products')
      .select('name, brand, description, short_description, images, category, price')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!product) {
      return {
        title: 'Parfum introuvable',
        description: "Ce parfum n'est pas disponible pour le moment.",
      }
    }

    const title = product.brand
      ? `${product.name} - ${product.brand}${product.category ? ` - ${product.category}` : ''}`
      : product.name

    const description =
      product.short_description ||
      (product.description
        ? product.description.substring(0, 160).trim() + '...'
        : `Découvrez ${product.name} sur Braza Scent. Parfum disponible en formats 2ml, 5ml et 10ml. Livraison rapide en France.`)

    const image = Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : `${SITE_URL}/images/parfums-hero.jpg`

    const canonicalUrl = `${SITE_URL}/parfum/${slug}`

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title} | Braza Scent`,
        description,
        url: canonicalUrl,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'Braza Scent',
        images: [
          {
            url: image,
            width: 1200,
            height: 1200,
            alt: product.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Braza Scent`,
        description,
        images: [image],
      },
    }
  } catch (error) {
    console.error('Erreur generateMetadata produit:', error)
    return {
      title: 'Parfum',
      description: 'Découvrez nos parfums sur Braza Scent.',
    }
  }
}

// Génère le JSON-LD structuré (schema.org/Product) pour Google
async function getProductJsonLd(slug: string) {
  try {
    const { data: product } = await supabase
      .from('products')
      .select('id, name, brand, description, short_description, images, price, original_price, stock, slug, sizes, price_by_size')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!product) return null

    // Récupérer les avis approuvés pour AggregateRating
    const { data: reviewsData } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', product.id)
      .eq('is_approved', true)

    const reviewCount = reviewsData?.length ?? 0
    const avgRating = reviewCount > 0
      ? reviewsData!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0

    // Déterminer la disponibilité
    const inStock = product.stock === null || product.stock === undefined || product.stock > 0
    const availability = inStock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock'

    // Déterminer le prix minimum (utile si plusieurs tailles)
    let lowPrice = product.price
    let highPrice = product.price
    try {
      const priceBySize = typeof product.price_by_size === 'string'
        ? JSON.parse(product.price_by_size)
        : product.price_by_size
      if (priceBySize && typeof priceBySize === 'object') {
        const prices = Object.values(priceBySize)
          .map((p) => Number(p))
          .filter((p) => p > 0)
        if (prices.length > 0) {
          lowPrice = Math.min(...prices)
          highPrice = Math.max(...prices)
        }
      }
    } catch {
      // Ignorer les erreurs de parsing
    }

    const image = Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : `${SITE_URL}/images/parfums-hero.jpg`

    const description =
      product.short_description ||
      product.description ||
      `Découvrez ${product.name} sur Braza Scent.`

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image,
      ...(product.brand && {
        brand: {
          '@type': 'Brand',
          name: product.brand,
        },
      }),
      ...(reviewCount > 0 && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Math.round(avgRating * 10) / 10,
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
      offers: lowPrice !== highPrice
        ? {
            '@type': 'AggregateOffer',
            priceCurrency: 'EUR',
            lowPrice,
            highPrice,
            availability,
            url: `${SITE_URL}/parfum/${product.slug}`,
            seller: {
              '@type': 'Organization',
              name: 'Braza Scent',
            },
          }
        : {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: product.price,
            availability,
            url: `${SITE_URL}/parfum/${product.slug}`,
            seller: {
              '@type': 'Organization',
              name: 'Braza Scent',
            },
          },
    }

    return jsonLd
  } catch (error) {
    console.error('Erreur génération JSON-LD:', error)
    return null
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const jsonLd = await getProductJsonLd(slug)

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient />
    </>
  )
}
