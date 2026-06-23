import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import HomeClient from './HomeClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
  description: "Découvrez et testez les plus grands parfums en décants 2ml, 5ml, 10ml et 30ml. Dior, Chanel, MFK, Creed, Maison Margiela… Livraison rapide en France.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Découvrez et testez les plus grands parfums en décants 2ml, 5ml, 10ml et 30ml. Livraison rapide en France.",
    url: SITE_URL,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [{ url: `${SITE_URL}/images/hero-bg.jpg`, width: 1200, height: 630, alt: 'Braza Scent — Décants de parfum' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Testez les plus grands parfums en décants 2ml, 5ml, 10ml et 30ml. Livraison rapide en France.",
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

function mapProduct(p: any): Product {
  const priceBySize = typeof p.price_by_size === 'string'
    ? JSON.parse(p.price_by_size)
    : (p.price_by_size || {})
  const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
  const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price
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
  }
}

export interface HomePack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  tag: string | null
}

export default async function HomePage() {
  const [bestsellersRes, newProductsRes, promosRes, packsRes, ordersRes, videosRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
      .eq('is_active', true)
      .eq('is_bestseller', true)
      .or('is_promo.eq.false,is_promo.is.null')
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
      .eq('is_active', true)
      .eq('is_new', true)
      .or('is_promo.eq.false,is_promo.is.null')
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
      .eq('is_active', true)
      .eq('is_promo', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('packs')
      .select('id, name, slug, description, price, original_price, image, tag')
      .eq('is_active', true)
      .limit(3),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'paid'),
    supabase
      .from('home_videos')
      .select('url, order_index')
      .eq('active', true)
      .order('order_index'),
  ])

  const featuredProducts = (bestsellersRes.data || []).map(mapProduct)
  const newProducts = (newProductsRes.data || []).map(mapProduct)
  const promoProducts = (promosRes.data || []).map(mapProduct)
  const packs = (packsRes.data || []) as HomePack[]
  const orderCount = 100 + (ordersRes.count || 0)
  const initialVideos = (videosRes.data && videosRes.data.length > 0)
    ? videosRes.data.map((v: { url: string }) => v.url)
    : []

  // Preload de l'image LCP réelle : le premier produit du slider hero (Supabase CDN).
  // Le custom loader désactive le preload automatique de Next.js → on le génère manuellement.
  const lcpImageSrc = featuredProducts[0]?.images?.[0]
  const lcpPreloadUrl = lcpImageSrc?.includes('/storage/v1/object/public/')
    ? lcpImageSrc.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      + '?width=828&quality=75&resize=contain'
    : null

  const homeFaqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Les parfums sont-ils authentiques ?', acceptedAnswer: { '@type': 'Answer', text: "Chaque décant est prélevé directement depuis le flacon original de la marque. Aucune copie, aucune reformulation. Ce que vous recevez, c'est le parfum tel qu'il a été créé." } },
      { '@type': 'Question', name: 'Le parfum est-il dilué ?', acceptedAnswer: { '@type': 'Answer', text: "Non. Nos décants sont du parfum pur, sans ajout de solvant ni d'alcool supplémentaire. La concentration est identique à celle du flacon d'origine." } },
      { '@type': 'Question', name: 'Combien de temps dure un format ?', acceptedAnswer: { '@type': 'Answer', text: "Un 5ml représente environ 100 à 110 projections — soit 2 à 3 semaines d'utilisation quotidienne. Largement suffisant pour découvrir une fragrance dans toutes ses dimensions." } },
      { '@type': 'Question', name: 'Les flacons fuient-ils pendant le transport ?', acceptedAnswer: { '@type': 'Answer', text: "Nos contenants sont soigneusement sélectionnés et testés. Chaque commande est conditionnée de façon sécurisée. Votre décant arrive intact, prêt à être découvert." } },
      { '@type': 'Question', name: 'Pourquoi acheter un décant ?', acceptedAnswer: { '@type': 'Answer', text: "Pour tester un parfum à 300€ sans investir à l'aveugle. Pour explorer des fragrances rares inaccessibles en boutique. Pour construire votre sillage sans compromis." } },
      { '@type': 'Question', name: 'Proposez-vous des marques de niche ?', acceptedAnswer: { '@type': 'Answer', text: "Notre sélection est construite autour de la parfumerie de niche et des créateurs indépendants. Des fragrances rarement disponibles à l'échantillon, accessibles en format découverte." } },
      { '@type': 'Question', name: 'Quand vais-je recevoir ma commande ?', acceptedAnswer: { '@type': 'Answer', text: "Chaque commande est préparée sous 24h et expédiée en 24 à 48h ouvrées. Un numéro de suivi vous est transmis dès l'envoi." } },
      { '@type': 'Question', name: 'Puis-je offrir un décant ?', acceptedAnswer: { '@type': 'Answer', text: "Absolument. Nos packs découverte sont pensés comme des coffrets premium — idéaux pour offrir une expérience olfactive sans se tromper de fragrance." } },
    ],
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Braza Scent',
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description: "Boutique en ligne de décants et échantillons de parfum. Testez les plus grands parfums en 2ml, 5ml, 10ml et 30ml.",
    sameAs: ['https://www.instagram.com/brazascent/'],
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Braza Scent',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/parfums?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      {/* Préchargement du hero — deux liens séparés avec media query car Next.js/React
          ignore le href quand imageSrcSet est présent, cassant la précharge. */}
      <link rel="preload" as="image" href="/images/hero-bg-sm.webp" fetchPriority="high" media="(max-width: 828px)" />
      <link rel="preload" as="image" href="/images/hero-bg.webp" fetchPriority="high" media="(min-width: 829px)" />
      {/* Preload du vrai LCP mobile : premier produit bestseller dans le slider hero.
          Sur mobile, cette image Supabase est le plus grand élément visible. */}
      {lcpPreloadUrl && (
        <link rel="preload" as="image" href={lcpPreloadUrl} fetchPriority="high" media="(max-width: 1024px)" />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <HomeClient featuredProducts={featuredProducts} newProducts={newProducts} promoProducts={promoProducts} packs={packs} orderCount={orderCount} initialVideos={initialVideos} />
    </>
  )
}
