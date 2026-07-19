import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import FemmeClient from './FemmeClient'
import { Product } from '@/types'
import { getProductReviewStatsMap } from '@/lib/reviews/public'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Parfums Femme - Décants & échantillons',
  description: 'Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml. Floraux, fruités, orientaux : testez les grandes maisons avant d\'investir. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/femme`,
  },
  openGraph: {
    title: 'Parfums Femme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml. Floraux, fruités, orientaux : testez les grandes maisons avant d\'investir.',
    url: `${SITE_URL}/femme`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums Femme - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parfums Femme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default async function FemmePage() {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
    .eq('is_active', true)
    .in('performance_genre', ['Femme', 'Féminin', 'Très féminin'])
    .order('display_order', { ascending: true })

  // Une seule requête groupée pour les stats d'avis de tous les produits de la page.
  const statsMap = await getProductReviewStatsMap(supabase, (data || []).map((p: { id: string }) => p.id))

  const initialProducts: Product[] = (data || []).map((p: any) => {
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
      description: p.description || '',
      shortDescription: p.short_description || '',
      price: displayPrice,
      originalPrice: p.original_price,
      priceBySize,
      images: p.images || [],
      size: p.sizes || [],
      category: p.category || 'femme',
      collection: p.collection,
      brand: p.brand || '',
      notes: { top: p.notes_top || [], heart: p.notes_heart || [], base: p.notes_base || [] },
      stock: p.stock ?? 1,
      inStock: (p.stock || 0) > 0,
      new: p.is_new,
      bestseller: p.is_bestseller,
      featured: p.is_bestseller,
      promo: p.is_promo ?? false,
      avgRating: rd?.avgRating,
      reviewCount: rd?.reviewCount,
    }
  })

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: "Comment choisir un parfum femme sans le tester ?", acceptedAnswer: { '@type': 'Answer', text: "Difficile de choisir un parfum uniquement sur description. Nos décants vous permettent de tester chaque fragrance sur votre peau pendant plusieurs jours. Un parfum réagit différemment selon la chimie corporelle — seul le test réel permet de trancher." } },
      { '@type': 'Question', name: "Quelle différence entre un décant 2ml et 5ml ?", acceptedAnswer: { '@type': 'Answer', text: "Le 2ml (environ 40 projections) est idéal pour une première découverte. Le 5ml (environ 100 projections) vous permet de vivre le parfum sur une à deux semaines, dans toutes les situations du quotidien — matin, soir, après sport." } },
      { '@type': 'Question', name: "Vos parfums féminins sont-ils authentiques ?", acceptedAnswer: { '@type': 'Answer', text: "Oui. Tous nos décants sont préparés à partir de flacons originaux achetés chez des revendeurs officiels. Vous recevez le parfum authentique de la marque, dans sa concentration originale, sans aucune modification." } },
      { '@type': 'Question', name: "BrazaScent est-il affilié aux marques ?", acceptedAnswer: { '@type': 'Answer', text: "Non. BrazaScent est un revendeur indépendant. Nous proposons des décants de parfums authentiques et ne sommes affiliés à aucune maison de parfumerie. Les noms de marques sont cités uniquement à titre informatif." } },
    ],
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Parfums Femme — Décants & Échantillons | Braza Scent',
    description: "Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml. Floraux, fruités, orientaux : testez les grandes maisons avant d'investir.",
    url: `${SITE_URL}/femme`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, collectionJsonLd]) }} />
      <FemmeClient initialProducts={initialProducts} />
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">Explorer la parfumerie féminine en décants</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>De la rose de Grasse au musc blanc, la parfumerie féminine offre un territoire d'exploration infini. Nos échantillons de parfum femme vous permettent de tester chaque fragrance sur votre peau avant de vous décider. Un parfum vit différemment selon la chaleur du corps — c'est toute la promesse du décant.</p>
            <p>Floraux délicats, orientaux enveloppants, frais et sophistiqués : BrazaScent sélectionne les créations féminines les plus recherchées en parfumerie de niche. Chanel, Dior, Le Labo, Byredo, Diptyque… en formats 2ml, 5ml et 10ml. Chaque décant est authentique, préparé à partir du flacon d'origine, sans dilution.</p>
            <p>Livraison soignée sous 24 à 48h. BrazaScent est indépendant et n'est pas affilié aux marques citées.</p>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {[
                { q: "Comment choisir un parfum femme sans le tester ?", a: "Difficile de choisir un parfum uniquement sur description. Nos décants vous permettent de tester chaque fragrance sur votre peau pendant plusieurs jours. Un parfum réagit différemment selon la chimie corporelle — seul le test réel permet de trancher." },
                { q: "Quelle différence entre un décant 2ml et 5ml ?", a: "Le 2ml (environ 40 projections) est idéal pour une première découverte. Le 5ml (environ 100 projections) vous permet de vivre le parfum sur une à deux semaines, dans toutes les situations du quotidien — matin, soir, après sport." },
                { q: "Vos parfums féminins sont-ils authentiques ?", a: "Oui. Tous nos décants sont préparés à partir de flacons originaux achetés chez des revendeurs officiels. Vous recevez le parfum authentique de la marque, dans sa concentration originale, sans aucune modification." },
                { q: "BrazaScent est-il affilié aux marques ?", a: "Non. BrazaScent est un revendeur indépendant. Nous proposons des décants de parfums authentiques et ne sommes affiliés à aucune maison de parfumerie. Les noms de marques sont cités uniquement à titre informatif." },
              ].map(({ q, a }, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="text-primary ml-4 flex-shrink-0 text-xl leading-none group-open:rotate-45 transition-transform inline-block">+</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}