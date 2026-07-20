import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { noteToSlug } from '@/lib/notes'
import { generateNoteSeoText } from '@/lib/seo-content'
import type { Product } from '@/types'
import { getProductReviewStatsMap } from '@/lib/reviews/public'

const SITE_URL = 'https://brazascent.com'

// Nombre minimum de produits actifs pour qu'une note soit préconstruite au
// build. Les notes en dessous restent accessibles (dynamicParams reste true
// par défaut) mais se génèrent à la première visite plutôt qu'à chaque
// déploiement — voir audit ISR Write Units, juillet 2026.
const MIN_PRODUCTS_FOR_STATIC_NOTE = 2

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 604800

export async function generateStaticParams() {
  const { data } = await supabase
    .from('products')
    .select('notes_top, notes_heart, notes_base')
    .eq('is_active', true)

  // Compte les produits DISTINCTS par note (pas les occurrences) : une note
  // présente à la fois en tête et en cœur d'un même produit ne doit compter
  // que pour 1 produit.
  const noteProductCounts = new Map<string, number>()
  for (const p of data ?? []) {
    const slugsForThisProduct = new Set<string>()
    for (const note of [
      ...((p.notes_top as string[]) ?? []),
      ...((p.notes_heart as string[]) ?? []),
      ...((p.notes_base as string[]) ?? []),
    ]) {
      if (note) slugsForThisProduct.add(noteToSlug(note))
    }
    for (const slug of slugsForThisProduct) {
      noteProductCounts.set(slug, (noteProductCounts.get(slug) ?? 0) + 1)
    }
  }

  return [...noteProductCounts.entries()]
    .filter(([, count]) => count >= MIN_PRODUCTS_FOR_STATIC_NOTE)
    .map(([note]) => ({ note }))
}

// Explicite : les notes non préconstruites (< MIN_PRODUCTS_FOR_STATIC_NOTE
// produits) restent accessibles et se génèrent à la demande au premier accès,
// puis sont mises en cache normalement (comportement par défaut de Next.js).
export const dynamicParams = true

interface PageProps {
  params: Promise<{ note: string }>
}

interface ProductRow {
  id: string
  name: string
  slug: string
  short_description: string | null
  price: number
  original_price: number | null
  price_by_size: Record<string, number> | string | null
  images: string[] | null
  sizes: string[] | null
  category: string | null
  collection: string | null
  brand: string | null
  stock: number | null
  is_new: boolean | null
  is_bestseller: boolean | null
  is_promo: boolean | null
  notes_top: string[] | null
  notes_heart: string[] | null
  notes_base: string[] | null
}

function findNoteName(data: ProductRow[], noteSlug: string): string | null {
  for (const p of data) {
    for (const note of [
      ...(p.notes_top || []),
      ...(p.notes_heart || []),
      ...(p.notes_base || []),
    ]) {
      if (note && noteToSlug(note) === noteSlug) return note
    }
  }
  return null
}

// Mémoïsé par React pour la durée d'un même rendu (cache() se réinitialise à
// chaque requête) : generateMetadata et la page appellent cette fonction avec
// les mêmes arguments (aucun), la requête Supabase ne part donc qu'une seule
// fois au lieu de deux. Pas de persistance entre requêtes — volontairement
// pas d'unstable_cache ici.
const getActiveProductsWithNotes = cache(async (): Promise<ProductRow[]> => {
  const { data } = await supabase
    .from('products')
    .select(
      'id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, notes_top, notes_heart, notes_base'
    )
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  return (data || []) as ProductRow[]
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { note: noteSlug } = await params
  const rows = await getActiveProductsWithNotes()

  const noteName = findNoteName(rows, noteSlug)
  if (!noteName) return { title: 'Note introuvable | Braza Scent' }

  return {
    title: `Décants parfum note ${noteName} | Braza Scent`,
    description: `Découvrez nos décants de parfums contenant des notes de ${noteName.toLowerCase()}. Testez des parfums authentiques en formats découverte 2ml, 5ml, 10ml.`,
    alternates: { canonical: `${SITE_URL}/notes/${noteSlug}` },
    openGraph: {
      title: `Décants parfum note ${noteName} | Braza Scent`,
      description: `Découvrez nos décants de parfums contenant des notes de ${noteName.toLowerCase()}.`,
      url: `${SITE_URL}/notes/${noteSlug}`,
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Braza Scent',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Décants parfum note ${noteName} | Braza Scent`,
      description: `Découvrez nos décants de parfums contenant des notes de ${noteName.toLowerCase()}.`,
    },
  }
}

export default async function NotePage({ params }: PageProps) {
  const { note: noteSlug } = await params

  const rows = await getActiveProductsWithNotes()
  const noteName = findNoteName(rows, noteSlug)
  if (!noteName) notFound()

  const filteredRows = rows.filter((p) =>
    [...(p.notes_top || []), ...(p.notes_heart || []), ...(p.notes_base || [])].some(
      (n) => n && noteToSlug(n) === noteSlug
    )
  )

  // Une seule requête groupée pour les stats d'avis des produits de cette note.
  const statsMap = await getProductReviewStatsMap(supabase, filteredRows.map((p) => p.id))

  const products: Product[] = filteredRows.map((p) => {
    const rd = statsMap.get(p.id)
    const priceBySize =
      typeof p.price_by_size === 'string'
        ? JSON.parse(p.price_by_size)
        : (p.price_by_size || {})
    const prices = Object.values(priceBySize).filter(
      (v): v is number => typeof v === 'number' && v > 0
    )
    const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price
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

  const noteSeo = generateNoteSeoText({
    noteName,
    products: products.map(p => ({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      notes: p.notes,
    })),
  })

  const faq = [
    {
      q: `Quels parfums contiennent des notes de ${noteName.toLowerCase()} ?`,
      a: `BrazaScent propose ${products.length} décant${products.length > 1 ? 's' : ''} contenant des notes de ${noteName.toLowerCase()}. Ces fragrances utilisent cette note en tête, en cœur ou en fond. Chaque décant est authentique, prélevé depuis le flacon d'origine.`,
    },
    {
      q: 'Pourquoi tester une note olfactive en décant ?',
      a: "Tester une note en décant permet de comprendre comment elle se comporte sur votre peau spécifiquement. Une même note s'exprime différemment selon le parfum, la concentration et les autres ingrédients. Un décant de 5ml vous offre 2 à 3 semaines de test pour une décision éclairée.",
    },
    {
      q: 'Les parfums BrazaScent sont-ils authentiques ?',
      a: 'Oui. Tous nos décants sont préparés à partir de flacons originaux achetés auprès de revendeurs officiels. Vous recevez le parfum authentique de la marque, dans sa concentration originale, sans aucune modification.',
    },
  ]

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Notes olfactives',
          item: `${SITE_URL}/notes`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: noteName,
          item: `${SITE_URL}/notes/${noteSlug}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Décants parfum note ${noteName} — Braza Scent`,
      description: `Découvrez nos décants de parfums contenant des notes de ${noteName.toLowerCase()}.`,
      url: `${SITE_URL}/notes/${noteSlug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Parfums note ${noteName}`,
      itemListElement: products.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: `${SITE_URL}/parfum/${p.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative h-[28vh] sm:h-[32vh] min-h-[200px] overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-black" />
          <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
            <div className="max-w-3xl animate-fade-in-up">
              <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
                Note olfactive
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase">
                {noteName}
              </h1>
            </div>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="bg-muted border-b border-border">
          <div className="px-6 sm:px-10 lg:px-20 py-4">
            <nav className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
              <Link href="/" className="text-muted-foreground hover:text-primary">
                Accueil
              </Link>
              <span className="text-muted-foreground/50">/</span>
              <Link href="/notes" className="text-muted-foreground hover:text-primary">
                Notes olfactives
              </Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-foreground truncate">{noteName}</span>
            </nav>
          </div>
        </div>

        {/* Intro SEO */}
        <div className="px-6 sm:px-10 lg:px-20 py-10 bg-background">
          <div className="max-w-3xl">
            <p className="text-muted-foreground leading-relaxed">
              La note de <strong>{noteName.toLowerCase()}</strong> est présente dans{' '}
              {products.length} de nos décants. Chaque fragrance l&apos;exprime différemment selon
              son accord global, sa concentration et les autres notes qui l&apos;accompagnent.
              Testez ces parfums en décant 2ml, 5ml ou 10ml avant d&apos;investir dans un flacon
              complet.
            </p>
          </div>
        </div>

        {/* Products */}
        <section className="py-8 lg:py-12 bg-background">
          <div className="px-6 sm:px-10 lg:px-20">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
              <p className="text-sm text-muted-foreground">
                {products.length} parfum{products.length > 1 ? 's' : ''} avec note{' '}
                <span className="text-foreground font-medium">{noteName}</span>
              </p>
              <Link
                href="/notes"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Toutes les notes
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-20">
                Aucun parfum disponible pour cette note pour le moment.
              </p>
            )}
          </div>
        </section>

        {/* SEO section — contenu généré dynamiquement côté serveur */}
        <section className="py-16 lg:py-20 bg-cream">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
            <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-8">
              {noteSeo.heading}
            </h2>

            <div className="text-muted-foreground leading-relaxed space-y-5 text-sm sm:text-base">
              <p>{noteSeo.explication}</p>
              <p>{noteSeo.sensations}</p>
              <p>{noteSeo.familles}</p>
              <p>{noteSeo.surLeSite}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/parfums"
                className="text-sm border border-border px-4 py-2 hover:border-primary hover:text-primary transition-colors"
              >
                Tous les parfums
              </Link>
              <Link
                href="/packs"
                className="text-sm border border-border px-4 py-2 hover:border-primary hover:text-primary transition-colors"
              >
                Packs découverte
              </Link>
              <Link
                href="/marques"
                className="text-sm border border-border px-4 py-2 hover:border-primary hover:text-primary transition-colors"
              >
                Explorer les marques
              </Link>
              <Link
                href="/notes"
                className="text-sm border border-border px-4 py-2 hover:border-primary hover:text-primary transition-colors"
              >
                Autres notes
              </Link>
            </div>

            {/* FAQ */}
            <div className="mt-12">
              <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">
                Questions fréquentes
              </h3>
              <div className="divide-y divide-border">
                {faq.map(({ q, a }, i) => (
                  <details key={i} className="group py-5">
                    <summary className="flex items-center justify-between cursor-pointer font-medium text-foreground [&::-webkit-details-marker]:hidden">
                      <span>{q}</span>
                      <span className="text-primary ml-4 flex-shrink-0 text-xl leading-none group-open:rotate-45 transition-transform inline-block">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </div>

            <p className="mt-12 text-xs text-muted-foreground/70 italic">
              BrazaScent propose des décants préparés à partir de flacons authentiques. BrazaScent
              n&apos;est pas affilié aux marques citées. Les noms de marques sont utilisés
              uniquement à titre informatif.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
