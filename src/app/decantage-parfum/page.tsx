import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import DecantageParfumClient from './DecantageParfumClient'
import { Product } from '@/types'
import { HomePack } from '../page'

const SITE_URL = 'https://brazascent.com'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Décantage Parfum — Testez les Plus Grandes Fragrances en Décant | BrazaScent',
  description:
    'Découvrez le décantage parfum chez BrazaScent : Chanel, Dior, Creed, Tom Ford en 2ml, 5ml, 10ml et 30ml. Décants authentiques, livraison 24/48h en France.',
  keywords: [
    'décantage parfum',
    'decant parfum',
    'parfum en petite quantité',
    'tester un parfum',
    'échantillon parfum de luxe',
    'décant parfum france',
    'parfum decant chanel dior creed',
    'acheter parfum à tester',
    'boutique decant parfum',
    'parfum de luxe pas cher',
    'échantillon parfum niche',
  ],
  alternates: {
    canonical: `${SITE_URL}/decantage-parfum`,
  },
  openGraph: {
    title: 'Décantage Parfum — Testez les Plus Grandes Fragrances | BrazaScent',
    description:
      'Décants authentiques Chanel, Dior, Creed, Tom Ford en 2ml, 5ml, 10ml, 30ml. Livraison rapide en France.',
    url: `${SITE_URL}/decantage-parfum`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/hero-bg.jpg`,
        width: 1200,
        height: 630,
        alt: 'Décantage parfum BrazaScent — Fragrances de luxe en petites quantités',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Décantage Parfum — BrazaScent',
    description:
      'Testez + de 100 fragrances de luxe en décant : 2ml, 5ml, 10ml, 30ml. Livraison 24/48h.',
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function mapProduct(p: Record<string, unknown>): Product {
  const priceBySize =
    typeof p.price_by_size === 'string'
      ? JSON.parse(p.price_by_size)
      : (p.price_by_size as Record<string, number> | null) || {}
  const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
  const displayPrice = prices.length > 0 ? Math.min(...prices) : (p.price as number)
  return {
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    description: (p.description as string) || '',
    shortDescription: (p.short_description as string) || '',
    price: displayPrice,
    originalPrice: p.original_price as number | undefined,
    priceBySize,
    images: (p.images as string[]) || [],
    size: (p.sizes as string[]) || [],
    category: (p.category as string) || 'unisexe',
    collection: p.collection as string | undefined,
    brand: (p.brand as string) || '',
    notes: {
      top: (p.notes_top as string[]) || [],
      heart: (p.notes_heart as string[]) || [],
      base: (p.notes_base as string[]) || [],
    },
    stock: (p.stock as number) ?? 1,
    inStock: ((p.stock as number) || 0) > 0,
    new: p.is_new as boolean | undefined,
    bestseller: p.is_bestseller as boolean | undefined,
    featured: p.is_bestseller as boolean | undefined,
    promo: (p.is_promo as boolean) ?? false,
  }
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/decantage-parfum`,
      url: `${SITE_URL}/decantage-parfum`,
      name: 'Décantage Parfum — Testez les Plus Grandes Fragrances en Décant | BrazaScent',
      description:
        'Boutique de décantage parfum : Chanel, Dior, Creed, Tom Ford en 2ml, 5ml, 10ml, 30ml. Authentique, livraison rapide en France.',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: { '@id': `${SITE_URL}/decantage-parfum#breadcrumb` },
      inLanguage: 'fr-FR',
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/decantage-parfum#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Décantage parfum', item: `${SITE_URL}/decantage-parfum` },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Qu'est-ce que le décantage de parfum ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Le décantage consiste à transférer du parfum depuis le flacon d'origine (Chanel, Dior, Creed…) vers un petit atomiseur. Vous recevez le même parfum qu'en boutique, dans la même concentration, en format 2ml, 5ml, 10ml ou 30ml.",
          },
        },
        {
          '@type': 'Question',
          name: 'Les parfums décantés sont-ils authentiques ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui. Chaque décant est prélevé directement depuis le flacon officiel de la marque. Aucune copie, aucune reformulation, aucune dilution.",
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de sprays y a-t-il dans un décant ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Un décant 2ml ≈ 44 sprays, 5ml ≈ 110 sprays, 10ml ≈ 220 sprays, 30ml ≈ 660 sprays. À 2–3 sprays/jour, un 5ml couvre plusieurs semaines de test.",
          },
        },
        {
          '@type': 'Question',
          name: "Pourquoi acheter un décant plutôt qu'un flacon complet ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Pour tester un parfum à 200–400€ sans investir à l'aveugle. Un décant permet de porter la fragrance sur sa peau pendant plusieurs jours, dans ses conditions réelles, avant de décider.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quelles marques sont disponibles en décantage chez BrazaScent ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Chanel, Dior, Creed, Tom Ford, Maison Margiela, Parfums de Marly, Initio, Kilian, Guerlain et bien d'autres. Le catalogue s'enrichit régulièrement.",
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de temps met la livraison des décants ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Les commandes sont préparées sous 24h et expédiées en 24 à 48h ouvrées. Un numéro de suivi est transmis dès l'envoi.",
          },
        },
        {
          '@type': 'Question',
          name: 'Puis-je offrir un décant en cadeau ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Absolument. Nos packs découverte sont pensés comme des coffrets premium, idéaux pour offrir une expérience olfactive sans se tromper de fragrance.",
          },
        },
        {
          '@type': 'Question',
          name: 'Le parfum décant est-il dilué ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Non. Nos décants sont du parfum pur, sans ajout de solvant ni d'alcool supplémentaire. La concentration (EDT, EDP, Parfum) est identique à celle du flacon d'origine.",
          },
        },
      ],
    },
  ],
}

export default async function DecantageParfumPage() {
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
  const initialVideos =
    videosRes.data && videosRes.data.length > 0
      ? videosRes.data.map((v: { url: string }) => v.url)
      : []

  const lcpImageSrc = featuredProducts[0]?.images?.[0]
  const lcpPreloadUrl = lcpImageSrc?.includes('/storage/v1/object/public/')
    ? lcpImageSrc.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') +
      '?width=828&quality=75&resize=contain'
    : null

  return (
    <>
      <link rel="preload" as="image" href="/images/hero-bg-sm.webp" fetchPriority="high" media="(max-width: 828px)" />
      <link rel="preload" as="image" href="/images/hero-bg.webp" fetchPriority="high" media="(min-width: 829px)" />
      {lcpPreloadUrl && (
        <link rel="preload" as="image" href={lcpPreloadUrl} fetchPriority="high" media="(max-width: 1024px)" />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DecantageParfumClient
        featuredProducts={featuredProducts}
        newProducts={newProducts}
        promoProducts={promoProducts}
        packs={packs}
        orderCount={orderCount}
        initialVideos={initialVideos}
      />
    </>
  )
}
