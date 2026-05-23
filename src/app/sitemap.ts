import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://brazascent.com'

// Client Supabase dédié au sitemap (lecture publique côté serveur)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Le sitemap est régénéré toutes les heures
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/parfums`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/homme`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/femme`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/marques`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/packs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/promos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/livraison`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/retours`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/cgv`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/confidentialite`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/a-propos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Pages familles olfactives
    ...(['florale', 'boisee', 'orientale', 'fraiche'] as const).map((famille) => ({
      url: `${SITE_URL}/parfums/${famille}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
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
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
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
      brandPages = brands.map((brand) => ({
        url: `${SITE_URL}/marques/${brand.slug}`,
        lastModified: new Date(),
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
      packPages = packs.map((pack) => ({
        url: `${SITE_URL}/packs/${pack.slug}`,
        lastModified: new Date(),
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
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Erreur récupération blog pour sitemap:', error)
  }

  return [...staticPages, ...productPages, ...brandPages, ...packPages, ...blogPages]
}