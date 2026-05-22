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
    .eq('category', 'homme')
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

  return <HommeClient initialProducts={initialProducts} />
}