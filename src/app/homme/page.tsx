import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import HommeClient from './HommeClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Parfums Homme - Décants & échantillons',
  description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml. Boisés, frais, orientaux : testez les grandes maisons avant d\'investir. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/homme`,
  },
  openGraph: {
    title: 'Parfums Homme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml. Boisés, frais, orientaux : testez les grandes maisons avant d\'investir.',
    url: `${SITE_URL}/homme`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums Homme - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parfums Homme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default async function HommePage() {
  const { data } = await supabase
    .from('products')
    .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
    .eq('is_active', true)
    .in('performance_genre', ['Homme', 'Masculin', 'Très masculin'])
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
      category: p.category || 'homme',
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
      { '@type': 'Question', name: "C'est quoi un décant de parfum homme ?", acceptedAnswer: { '@type': 'Answer', text: "Un décant est un prélèvement du parfum original effectué directement depuis le flacon de la marque. Vous recevez la même fragrance que le flacon plein — sans dilution — dans un format de 2ml, 5ml ou 10ml. Idéal pour tester avant d'acheter." } },
      { '@type': 'Question', name: "Combien dure un décant 5ml au quotidien ?", acceptedAnswer: { '@type': 'Answer', text: "Un 5ml représente environ 100 à 110 projections, soit 2 à 3 semaines d'usage quotidien (2 à 3 sprays par jour). C'est suffisant pour découvrir toutes les phases d'évolution d'une fragrance sur votre peau." } },
      { '@type': 'Question', name: "Pourquoi choisir un décant plutôt qu'un flacon ?", acceptedAnswer: { '@type': 'Answer', text: "Un flacon de parfum représente souvent 100 à 350€. Un décant vous permet de le tester sur votre peau pendant plusieurs semaines. La décision d'achat d'un flacon devient alors une certitude, pas un pari." } },
      { '@type': 'Question', name: "Les parfums sont-ils les mêmes qu'en boutique ?", acceptedAnswer: { '@type': 'Answer', text: "Oui. Nos décants sont préparés à partir de flacons originaux des marques. Vous recevez exactement le même parfum qu'en boutique, dans la même concentration, sans aucune modification." } },
    ],
  }

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Parfums Homme — Décants & Échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml. Boisés, frais, orientaux : testez les grandes maisons avant d\'investir.',
    url: `${SITE_URL}/homme`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([faqJsonLd, collectionJsonLd]) }} />
      <HommeClient initialProducts={initialProducts} />
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">Découvrir les parfums homme en décants</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>La parfumerie masculine revisitée en formats découverte. Nos décants de parfum homme vous permettent d'explorer des créations boisées, orientales ou fraîches avant d'investir dans un flacon. De Dior Sauvage aux pépites de niche les plus recherchées — testez un parfum homme authentique dès 2ml.</p>
            <p>Un décant 5ml représente environ 100 projections, soit 2 à 3 semaines d'utilisation quotidienne. Idéal pour découvrir si une fragrance s'accorde avec votre peau, votre style, votre quotidien. BrazaScent sélectionne des fragrances de caractère : masculines, affirmées, mais aussi les incontournables unisexes qui traversent les genres.</p>
            <p>Livraison rapide en France. BrazaScent propose des décants préparés à partir de flacons authentiques et n'est pas affilié aux marques citées.</p>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {[
                { q: "C'est quoi un décant de parfum homme ?", a: "Un décant est un prélèvement du parfum original effectué directement depuis le flacon de la marque. Vous recevez la même fragrance que le flacon plein — sans dilution — dans un format de 2ml, 5ml ou 10ml. Idéal pour tester avant d'acheter." },
                { q: "Combien dure un décant 5ml au quotidien ?", a: "Un 5ml représente environ 100 à 110 projections, soit 2 à 3 semaines d'usage quotidien (2 à 3 sprays par jour). C'est suffisant pour découvrir toutes les phases d'évolution d'une fragrance sur votre peau." },
                { q: "Pourquoi choisir un décant plutôt qu'un flacon ?", a: "Un flacon de parfum représente souvent 100 à 350€. Un décant vous permet de le tester sur votre peau pendant plusieurs semaines. La décision d'achat d'un flacon devient alors une certitude, pas un pari." },
                { q: "Les parfums sont-ils les mêmes qu'en boutique ?", a: "Oui. Nos décants sont préparés à partir de flacons originaux des marques. Vous recevez exactement le même parfum qu'en boutique, dans la même concentration, sans aucune modification." },
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