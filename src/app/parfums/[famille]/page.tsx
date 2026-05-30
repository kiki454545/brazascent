import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ParfumsClient from '../ParfumsClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 60

const FAMILLES: Record<string, {
  label: string
  emoji: string
  description: string
  keywords: string[]
  seoTitle: string
  seoText: string
  faq: { q: string; a: string }[]
}> = {
  florale: {
    label: 'Florale',
    emoji: '🌸',
    description: 'Parfums floraux en décants — rose, jasmin, pivoine, iris. Les grandes maisons de parfumerie revisitées en format découverte.',
    keywords: ['rose', 'jasmin', 'iris', 'pivoine', 'fleur', 'lis', 'magnolia', 'muguet', 'violette', 'freesia', 'narcisse', 'ylang', 'géranium', 'hibiscus', 'osmanthus'],
    seoTitle: 'La parfumerie florale en décants',
    seoText: 'La famille florale est la plus vaste de la parfumerie. Rose, jasmin, iris, pivoine, muguet — chaque fleur exprime un caractère unique, une époque, une sensibilité. Nos décants de parfums floraux vous permettent d\'explorer ce territoire infini sans contrainte. De Chanel N°5 aux créations de niche les plus délicates, testez chaque fragrance sur votre peau avant tout investissement.\n\nUn échantillon de parfum floral en 5ml vous offre 2 à 3 semaines d\'utilisation — le temps nécessaire pour sentir comment la fragrance évolue avec votre peau, du matin au soir. Chaque décant BrazaScent est authentique, prélevé directement depuis le flacon d\'origine.',
    faq: [
      { q: 'Qu\'est-ce qu\'un parfum de la famille florale ?', a: 'Les parfums floraux sont construits autour de fleurs naturelles ou synthétiques : rose, jasmin, iris, pivoine, muguet. C\'est la famille la plus représentée en parfumerie, déclinée du soliflore pur (une seule fleur) aux bouquets complexes mêlant plusieurs notes florales.' },
      { q: 'Comment tester un parfum floral en décant ?', a: 'Appliquez 2 à 3 projections sur le poignet ou l\'avant-bras. Laissez sécher 10 secondes sans frotter. Sentez après 10 minutes (cœur), puis à nouveau après 2 heures (fond). Un parfum floral révèle souvent sa vraie profondeur après 1 heure sur peau chaude.' },
      { q: 'Les parfums floraux sont-ils réservés aux femmes ?', a: 'Non. La parfumerie contemporaine a profondément remis en question les codes de genre. De nombreuses créations florales — notamment autour du jasmin, de l\'iris ou du vétiver floral — sont portées par tous les genres. La parfumerie de niche excelle dans cette modernité.' },
    ],
  },
  boisee: {
    label: 'Boisée',
    emoji: '🌲',
    description: 'Parfums boisés en décants — cèdre, santal, oud, vétiver. Des fragrances profondes et enveloppantes.',
    keywords: ['cèdre', 'santal', 'vétiver', 'bois', 'oud', 'gaïac', 'patchouli', 'cyprès', 'pin', 'encens', 'genévrier', 'chêne', 'teck', 'bambou'],
    seoTitle: 'Décants de parfums boisés — profondeur et caractère',
    seoText: 'Les parfums boisés incarnent la profondeur, la stabilité, le caractère. Cèdre de l\'Atlas, santal de Mysore, oud agarwood, vétiver fumé — ces matières premières précieuses construisent des fragrances à longue traîne, persistantes et enveloppantes. Un parfum boisé authentique se révèle différemment selon chaque peau.\n\nNos décants de parfums boisés vous permettent d\'explorer ces créations denses et sophistiquées en format découverte. Les grandes maisons de parfumerie de niche — Tom Ford, Initio, Amouage — excellent dans cette famille. Testez sur votre peau avant d\'investir dans un flacon plein.',
    faq: [
      { q: 'Qu\'est-ce qu\'un parfum de la famille boisée ?', a: 'Les parfums boisés sont construits autour de matières ligneuses : cèdre, santal, vétiver, oud, patchouli. Ces notes créent des fragrances profondes, chaleureuses et persistantes. Elles constituent souvent le fond de nombreux parfums, mais dans les créations boisées, elles sont au premier plan.' },
      { q: 'L\'oud est-il difficile à porter ?', a: 'L\'oud (ou agarwood) est une matière première intense, fumée, presque animale dans sa forme pure. Mais en parfumerie moderne, il est souvent adouci par du santal, de la rose ou de la vanille. Un décant vous permet de tester son rendu sur votre peau avant tout engagement.' },
      { q: 'Quelle différence entre un parfum boisé et orientale ?', a: 'Les boisés mettent en avant des matières ligneuses sèches ou crémeuses (cèdre, santal). Les orientaux intègrent davantage d\'épices chaudes, de résines et d\'ambre. Les deux familles peuvent se chevaucher : un boisé oriental ou un oriental boisé sont fréquents en parfumerie de niche.' },
    ],
  },
  orientale: {
    label: 'Orientale',
    emoji: '🪔',
    description: 'Parfums orientaux en décants — ambre, musc, vanille, épices chaudes. Chaleur et sensualité en format découverte.',
    keywords: ['ambre', 'musc', 'vanille', 'benjoin', 'encens', 'résine', 'épice', 'cannelle', 'cardamome', 'poivre', 'safran', 'tonka', 'labdanum', 'myrrhe'],
    seoTitle: 'Parfums orientaux — chaleur, épices et sensualité en décants',
    seoText: 'La famille orientale est celle du voyage, de la chaleur, de la densité sensorielle. Ambre doux, musc chaud, vanille généreuse, épices précieuses — ces parfums enveloppent, persistent, marquent les esprits. Ils sont souvent associés aux soirées et aux saisons froides, mais les interprétations contemporaines ont bouleversé ces codes.\n\nNos décants de parfums orientaux vous permettent de vivre ces fragrances intenses sur votre peau, le temps d\'une semaine. C\'est la seule façon réelle de savoir si une composition aussi riche vous appartient. BrazaScent sélectionne les créations orientales les plus remarquées en parfumerie de niche et de luxe.',
    faq: [
      { q: 'Les parfums orientaux sont-ils lourds à porter ?', a: 'Les orientaux traditionnels peuvent être denses. Mais la parfumerie de niche a produit des orientaux légers, modernes, parfois aériens. La seule façon de le savoir est de tester sur votre peau — ce qu\'un décant rend possible sans contrainte.' },
      { q: 'Quelle saison pour un parfum oriental ?', a: 'Les orientaux riches (ambre, vanille, résines) s\'épanouissent en automne-hiver sur une peau plus froide. En été, cherchez des orientaux épicés-frais ou orientaux-boisés qui évoluent sans saturer. Testez en saison pour une juste appréciation.' },
      { q: 'L\'ambre est-il une note naturelle ?', a: 'En parfumerie, l\'ambre est principalement une note reconstituée à partir de résines et de matières de synthèse — labdanum, benjoin, vanille — créant une chaleur dorée. L\'ambre gris d\'origine animale est rare et coûteux. Les deux forment les bases des orientaux les plus enveloppants.' },
    ],
  },
  fraiche: {
    label: 'Fraîche',
    emoji: '🍃',
    description: 'Parfums frais en décants — agrumes, aromates, aquatiques. Légèreté et vivacité en format découverte.',
    keywords: ['bergamote', 'citron', 'mandarine', 'agrumes', 'pamplemousse', 'menthe', 'basilic', 'thé vert', 'marine', 'aquatique', 'herbe', 'lavande', 'vétiver', 'gingembre'],
    seoTitle: 'Décants de parfums frais — légèreté, agrumes et vivacité',
    seoText: 'Les parfums frais sont les plus quotidiens, les plus universels. Bergamote italienne, citron de Sicile, thé vert, notes aquatiques, herbes aromatiques — ces fragrances accompagnent les journées actives avec légèreté et précision. En parfumerie de niche, la famille fraîche atteint une sophistication rare.\n\nNos décants de parfums frais vous permettent d\'explorer des créations que l\'on croyait connaître, revisitées par des nez indépendants. Testez Acqua di Parma, Atelier Cologne ou les pépites fraiches de créateurs en format 2ml, 5ml et 10ml. Un format 5ml représente 2 à 3 semaines d\'utilisation estivale.',
    faq: [
      { q: 'Les parfums frais durent-ils moins longtemps ?', a: 'Les notes fraîches sont par nature plus volatiles que les boisés ou orientaux. Un parfum agrume pur peut ne durer que 2 à 3h. En parfumerie de niche, les compositions fraîches sont construites avec des fonds (muscs, bois) qui leur donnent de la tenue. Un décant vous permet de tester la longévité sur votre peau.' },
      { q: 'Quelle différence entre un parfum aquatique et floral-frais ?', a: 'Un aquatique évoque l\'eau, la mer, les embruns — notes ozonées, aldéhydes marines. Un floral-frais mêle des notes fleuries (muguet, freesia) à une base légère. Les deux sont dans la grande famille fraîche, mais avec des caractères distincts que le test sur peau révèle mieux que n\'importe quelle description.' },
      { q: 'Les parfums frais conviennent-ils à toutes les saisons ?', a: 'Les fraîches sont surtout portées au printemps et en été. En automne-hiver, certains frais-boisés ou frais-ambrés gardent leur pertinence. Un décant vous permet de tester sans vous tromper de saison.' },
    ],
  },
}

interface PageProps {
  params: Promise<{ famille: string }>
}

export async function generateStaticParams() {
  return Object.keys(FAMILLES).map((famille) => ({ famille }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { famille } = await params
  const info = FAMILLES[famille]
  if (!info) return { title: 'Parfums | Braza Scent' }

  return {
    title: `Parfums ${info.label}s — Décants 2ml, 5ml, 10ml | Braza Scent`,
    description: info.description,
    alternates: { canonical: `${SITE_URL}/parfums/${famille}` },
    openGraph: {
      title: `Parfums ${info.label}s | Braza Scent`,
      description: info.description,
      url: `${SITE_URL}/parfums/${famille}`,
      type: 'website',
      locale: 'fr_FR',
      siteName: 'Braza Scent',
    },
  }
}

function matchesFamille(product: Product, keywords: string[]): boolean {
  const allNotes = [
    ...(product.notes?.top || []),
    ...(product.notes?.heart || []),
    ...(product.notes?.base || []),
    ...((product.mainAccords || []).map((a: any) => typeof a === 'string' ? a : (a.name || ''))),
  ].filter(Boolean).map((n: string) => n.toLowerCase())
  return allNotes.some((note) => keywords.some((kw) => note.includes(kw)))
}

export default async function FamillePage({ params }: PageProps) {
  const { famille } = await params
  const info = FAMILLES[famille]
  if (!info) notFound()

  const [productsRes, brandsRes, ratingsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order, gender, notes_top, notes_heart, notes_base, main_accords')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('brands')
      .select('id, name, slug')
      .order('name', { ascending: true }),
    supabase
      .from('product_reviews')
      .select('product_id, rating')
      .eq('is_approved', true),
  ])

  const ratingsByProduct: Record<string, { sum: number; count: number }> = {}
  for (const r of (ratingsRes.data || [])) {
    if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = { sum: 0, count: 0 }
    ratingsByProduct[r.product_id].sum += r.rating
    ratingsByProduct[r.product_id].count += 1
  }

  const allProducts: Product[] = (productsRes.data || []).map((p: any) => {
    const priceBySize = typeof p.price_by_size === 'string'
      ? JSON.parse(p.price_by_size)
      : (p.price_by_size || {})
    const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
    const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price
    const rd = ratingsByProduct[p.id]
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
      avgRating: rd ? Math.round((rd.sum / rd.count) * 10) / 10 : undefined,
      reviewCount: rd?.count,
    }
  })

  // Filtrer par famille olfactive
  const initialProducts = allProducts.filter((p) => matchesFamille(p, info.keywords))
  const initialBrands = (brandsRes.data || []) as { id: string; name: string; slug: string }[]

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Parfums ${info.label}s — Braza Scent`,
      description: info.description,
      url: `${SITE_URL}/parfums/${famille}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: info.faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ParfumsClient
        initialProducts={initialProducts}
        initialBrands={initialBrands}
        familleFilter={famille}
        familleLabel={`${info.emoji} ${info.label}`}
      />
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">{info.seoTitle}</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            {info.seoText.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {info.faq.map(({ q, a }, i) => (
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
