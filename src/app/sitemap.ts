import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { noteToSlug } from '@/lib/notes'

const SITE_URL = 'https://brazascent.com'

// Client Supabase dédié au sitemap (lecture publique côté serveur)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Le sitemap est régénéré toutes les 24h
export const revalidate = 86400

// Pages statiques sans date de modification fiable en base : `lastModified`
// est volontairement omis plutôt que rempli avec `new Date()`, qui rendrait
// le sitemap différent à chaque régénération même sans changement réel
// (voir audit ISR Write Units — juillet 2026).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/parfums`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/homme`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/femme`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/unisexe`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/marques`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/packs`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/promos`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/livraison`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/retours`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/cgv`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/a-propos`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/quiz`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Pages familles olfactives
    ...(['florale', 'boisee', 'orientale', 'fraiche'] as const).map((famille) => ({
      url: `${SITE_URL}/parfums/${famille}`,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    // Page pilier SEO décantage
    {
      url: `${SITE_URL}/decantage-parfum`,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    // Notes olfactives (index)
    {
      url: `${SITE_URL}/notes`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // 2. Produits dynamiques (depuis Supabase)
  let productPages: MetadataRoute.Sitemap = []
  try {
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (products) {
      productPages = products.map((product) => ({
        url: `${SITE_URL}/parfum/${product.slug}`,
        ...(product.updated_at ? { lastModified: new Date(product.updated_at) } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }))
    }
  } catch (error) {
    console.error('Erreur récupération produits pour sitemap:', error)
  }

  // 3. Marques dynamiques
  let brandPages: MetadataRoute.Sitemap = []
  try {
    const { data: brands } = await supabase
      .from('brands')
      .select('slug')

    if (brands) {
      // Pas de colonne updated_at sur `brands` — aucune date fiable disponible,
      // on omet lastModified plutôt que d'en inventer une.
      brandPages = brands.map((brand) => ({
        url: `${SITE_URL}/marques/${brand.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Erreur récupération marques pour sitemap:', error)
  }

  // 4. Packs dynamiques
  let packPages: MetadataRoute.Sitemap = []
  try {
    const { data: packs } = await supabase
      .from('packs')
      .select('slug')
      .eq('is_active', true)

    if (packs) {
      // Pas de colonne updated_at sur `packs` — même règle que pour les marques.
      packPages = packs.map((pack) => ({
        url: `${SITE_URL}/packs/${pack.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Erreur récupération packs pour sitemap:', error)
  }

  // 5. Articles de blog
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('is_published', true)

    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        ...(post.updated_at ? { lastModified: new Date(post.updated_at) } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Erreur récupération blog pour sitemap:', error)
  }

  // 6. Pages notes olfactives
  let notePages: MetadataRoute.Sitemap = []
  try {
    const { data: noteData } = await supabase
      .from('products')
      .select('notes_top, notes_heart, notes_base')
      .eq('is_active', true)

    if (noteData) {
      const slugSet = new Set<string>()
      for (const p of noteData) {
        for (const note of [
          ...(p.notes_top || []),
          ...(p.notes_heart || []),
          ...(p.notes_base || []),
        ]) {
          if (note) slugSet.add(noteToSlug(note))
        }
      }
      // Slug agrégé depuis plusieurs produits : aucune date de modification
      // unique n'a de sens ici, on omet lastModified.
      notePages = Array.from(slugSet).map((slug) => ({
        url: `${SITE_URL}/notes/${slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Erreur récupération notes pour sitemap:', error)
  }

  // Tri final par URL : garantit une sortie strictement identique d'une
  // génération à l'autre tant que les données sous-jacentes n'ont pas changé,
  // indépendamment de l'ordre retourné par Postgres (non garanti sans ORDER BY).
  const sortByUrl = (a: MetadataRoute.Sitemap[number], b: MetadataRoute.Sitemap[number]) =>
    a.url.localeCompare(b.url)

  return [
    ...staticPages,
    ...[...productPages].sort(sortByUrl),
    ...[...brandPages].sort(sortByUrl),
    ...[...packPages].sort(sortByUrl),
    ...[...blogPages].sort(sortByUrl),
    ...[...notePages].sort(sortByUrl),
  ]
}