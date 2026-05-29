import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import UnisexeClient from './UnisexeClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Parfums Unisexe - Décants & échantillons',
  description: 'Découvrez notre sélection de parfums unisexe en décants 2ml, 5ml et 10ml. Des fragrances qui transcendent les genres : testez les grandes maisons avant d\'investir. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/unisexe`,
  },
  openGraph: {
    title: 'Parfums Unisexe - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums unisexe en décants 2ml, 5ml et 10ml. Des fragrances qui transcendent les genres : testez les grandes maisons avant d\'investir.',
    url: `${SITE_URL}/unisexe`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums Unisexe - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parfums Unisexe - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums unisexe en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default async function UnisexePage() {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
    .eq('is_active', true)
    .eq('performance_genre', 'Unisexe')
    .order('display_order', { ascending: true })

  const initialProducts: Product[] = (data || []).map((p: any) => {
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
      category: p.category || '',
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
  })

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: "C'est quoi un parfum unisexe ?", acceptedAnswer: { '@type': 'Answer', text: "Un parfum unisexe est une fragrance conçue pour être portée par toutes et tous, sans distinction de genre. Ces créations misent sur des matières premières universelles — bois, musc, ambre, agrumes — qui s'adaptent à toutes les personnalités." } },
      { '@type': 'Question', name: "Pourquoi tester un parfum unisexe en décant ?", acceptedAnswer: { '@type': 'Answer', text: "Un parfum réagit différemment sur chaque peau. Un décant vous permet de porter la fragrance pendant plusieurs jours, dans votre quotidien, avant d'investir dans un flacon complet. La même formule, la même concentration — en format découverte." } },
      { '@type': 'Question', name: "Les parfums unisexe sont-ils authentiques ?", acceptedAnswer: { '@type': 'Answer', text: "Oui. Tous nos décants sont préparés à partir de flacons originaux achetés chez des revendeurs officiels. Vous recevez le parfum authentique de la marque, dans sa concentration originale, sans aucune modification." } },
      { '@type': 'Question', name: "BrazaScent est-il affilié aux marques ?", acceptedAnswer: { '@type': 'Answer', text: "Non. BrazaScent est un revendeur indépendant. Nous proposons des décants de parfums authentiques et ne sommes affiliés à aucune maison de parfumerie. Les noms de marques sont cités uniquement à titre informatif." } },
    ],
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Parfums Unisexe — Décants & Échantillons | Braza Scent',
    description: "Découvrez notre sélection de parfums unisexe en décants 2ml, 5ml et 10ml. Des fragrances qui transcendent les genres.",
    url: `${SITE_URL}/unisexe`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, collectionJsonLd]) }} />
      <UnisexeClient initialProducts={initialProducts} />
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">Découvrir les parfums unisexe en décants</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>La parfumerie unisexe représente l'avant-garde de la création contemporaine. Libérée des codes de genre, elle explore des territoires olfactifs inédits : bois précieux, muscs modernes, résines orientales ou agrumes éclatants. Ces fragrances s'adaptent à toutes les personnalités, à tous les moments de la journée.</p>
            <p>Nos décants de parfums unisexe vous permettent de tester ces créations sur votre peau avant tout investissement. Un 5ml représente environ 100 projections — suffisant pour découvrir toutes les phases d'évolution d'une fragrance. Le Labo, Byredo, Maison Margiela, Diptyque… en formats 2ml, 5ml et 10ml.</p>
            <p>Livraison rapide en France. BrazaScent propose des décants préparés à partir de flacons authentiques et n'est pas affilié aux marques citées.</p>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {[
                { q: "C'est quoi un parfum unisexe ?", a: "Un parfum unisexe est une fragrance conçue pour être portée par toutes et tous, sans distinction de genre. Ces créations misent sur des matières premières universelles — bois, musc, ambre, agrumes — qui s'adaptent à toutes les personnalités." },
                { q: "Pourquoi tester un parfum unisexe en décant ?", a: "Un parfum réagit différemment sur chaque peau. Un décant vous permet de porter la fragrance pendant plusieurs jours, dans votre quotidien, avant d'investir dans un flacon complet. La même formule, la même concentration — en format découverte." },
                { q: "Les parfums unisexe sont-ils authentiques ?", a: "Oui. Tous nos décants sont préparés à partir de flacons originaux achetés chez des revendeurs officiels. Vous recevez le parfum authentique de la marque, dans sa concentration originale, sans aucune modification." },
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
