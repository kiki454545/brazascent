import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ParfumsClient from './ParfumsClient'
import { Product } from '@/types'
import { getProductReviewStatsMap } from '@/lib/reviews/public'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml',
  description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/parfums`,
  },
  openGraph: {
    title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner.',
    url: `${SITE_URL}/parfums`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums de niche et de luxe - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default async function ParfumsPage() {
  const [productsRes, brandsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order, gender, notes_top, notes_heart, notes_base, main_accords')
      .eq('is_active', true)
      .or('is_promo.eq.false,is_promo.is.null')
      .order('display_order', { ascending: true }),
    supabase
      .from('brands')
      .select('id, name, slug')
      .order('name', { ascending: true }),
  ])

  // Une seule requête groupée pour les stats d'avis de tous les produits de la page.
  const statsMap = await getProductReviewStatsMap(supabase, (productsRes.data || []).map((p: { id: string }) => p.id))

  const initialProducts: Product[] = (productsRes.data || []).map((p: any) => {
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
      avgRating: rd?.avgRating,
      reviewCount: rd?.reviewCount,
    }
  })

  const initialBrands = (brandsRes.data || []) as { id: string; name: string; slug: string }[]

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: "C'est quoi un décant de parfum ?", acceptedAnswer: { '@type': 'Answer', text: "Un décant est un prélèvement effectué directement depuis le flacon d'origine de la marque. Vous recevez le parfum authentique, sans dilution ni reformulation, dans un vaporisateur soigneusement conditionné. C'est le même parfum que le flacon complet, en format découverte." } },
      { '@type': 'Question', name: "Les parfums BrazaScent sont-ils authentiques ?", acceptedAnswer: { '@type': 'Answer', text: "Oui. Chaque décant est préparé à partir de flacons originaux achetés auprès de revendeurs officiels. BrazaScent garantit l'authenticité de chaque produit. Aucune copie, aucun tiers générique." } },
      { '@type': 'Question', name: "Pourquoi choisir un décant plutôt qu'un flacon complet ?", acceptedAnswer: { '@type': 'Answer', text: "Un flacon de parfum de niche représente souvent 150 à 400€ d'investissement. Un décant vous permet de tester un parfum plusieurs semaines sur votre peau, à toutes heures de la journée, avant de vous décider. C'est la méthode la plus intelligente pour construire sa collection." } },
      { '@type': 'Question', name: "Quels formats de décants proposez-vous ?", acceptedAnswer: { '@type': 'Answer', text: "Nos décants sont disponibles en 2ml (≈40 sprays), 5ml (≈100 sprays, 2 à 3 semaines d'usage quotidien) et 10ml (≈200 sprays, environ un mois). Chaque format est soigneusement conditionné dans un vaporisateur en verre." } },
      { '@type': 'Question', name: "BrazaScent est-il affilié aux marques citées ?", acceptedAnswer: { '@type': 'Answer', text: "Non. BrazaScent est un revendeur indépendant. Nous ne sommes pas affiliés, partenaires ou mandataires d'aucune maison de parfumerie. Les noms de marques sont cités uniquement à titre informatif pour identifier les fragrances." } },
    ],
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tous nos parfums — Décants & Échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml.',
    url: `${SITE_URL}/parfums`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, collectionJsonLd]) }} />
      <ParfumsClient initialProducts={initialProducts} initialBrands={initialBrands} />
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">Pourquoi choisir un décant de parfum ?</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>BrazaScent vous donne accès à la parfumerie de niche et de luxe en formats découverte. Nos décants sont prélevés directement depuis le flacon d'origine — aucune dilution, aucune reformulation, la fragrance exacte telle que ses créateurs l'ont conçue. Un parfum authentique, disponible dès 2ml.</p>
            <p>Explorez Dior, Chanel, Maison Francis Kurkdjian, Creed, Tom Ford, Le Labo et des dizaines de maisons en format 2ml, 5ml et 10ml. Chaque échantillon de parfum vous permet de tester sur votre peau, dans votre quotidien, avant tout engagement. C'est la liberté de la découverte parfum sans risque financier.</p>
            <p>Expédition sous 24 à 48h. BrazaScent est indépendant et n'est pas affilié aux marques citées. Les noms sont utilisés uniquement à titre informatif.</p>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes sur les décants</h3>
            <div className="divide-y divide-border">
              {[
                { q: "C'est quoi un décant de parfum ?", a: "Un décant est un prélèvement effectué directement depuis le flacon d'origine de la marque. Vous recevez le parfum authentique, sans dilution ni reformulation, dans un vaporisateur soigneusement conditionné. C'est le même parfum que le flacon complet, en format découverte." },
                { q: "Les parfums BrazaScent sont-ils authentiques ?", a: "Oui. Chaque décant est préparé à partir de flacons originaux achetés auprès de revendeurs officiels. BrazaScent garantit l'authenticité de chaque produit. Aucune copie, aucun tiers générique." },
                { q: "Pourquoi choisir un décant plutôt qu'un flacon complet ?", a: "Un flacon de parfum de niche représente souvent 150 à 400€ d'investissement. Un décant vous permet de tester un parfum plusieurs semaines sur votre peau, à toutes heures de la journée, avant de vous décider. C'est la méthode la plus intelligente pour construire sa collection." },
                { q: "Quels formats de décants proposez-vous ?", a: "Nos décants sont disponibles en 2ml (≈40 sprays), 5ml (≈100 sprays, 2 à 3 semaines d'usage quotidien) et 10ml (≈200 sprays, environ un mois). Chaque format est soigneusement conditionné dans un vaporisateur en verre." },
                { q: "BrazaScent est-il affilié aux marques citées ?", a: "Non. BrazaScent est un revendeur indépendant. Nous ne sommes pas affiliés, partenaires ou mandataires d'aucune maison de parfumerie. Les noms de marques sont cités uniquement à titre informatif pour identifier les fragrances." },
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