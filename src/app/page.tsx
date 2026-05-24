import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import HomeClient from './HomeClient'
import { Product } from '@/types'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
  description: "Découvrez et testez les plus grands parfums en décants 2ml, 5ml et 10ml. Dior, Chanel, MFK, Creed, Maison Margiela… Livraison rapide en France.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Découvrez et testez les plus grands parfums en décants 2ml, 5ml et 10ml. Livraison rapide en France.",
    url: SITE_URL,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [{ url: `${SITE_URL}/images/hero-bg.jpg`, width: 1200, height: 630, alt: 'Braza Scent — Décants de parfum' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Testez les plus grands parfums en décants 2ml, 5ml, 10ml. Livraison rapide en France.",
    images: [`${SITE_URL}/images/hero-bg.jpg`],
  },
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const revalidate = 3600

function mapProduct(p: any): Product {
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
  }
}

export interface HomePack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  tag: string | null
}

export default async function HomePage() {
  const [bestsellersRes, newProductsRes, promosRes, packsRes, ordersRes] = await Promise.all([
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
  ])

  const featuredProducts = (bestsellersRes.data || []).map(mapProduct)
  const newProducts = (newProductsRes.data || []).map(mapProduct)
  const promoProducts = (promosRes.data || []).map(mapProduct)
  const packs = (packsRes.data || []) as HomePack[]
  const orderCount = 100 + (ordersRes.count || 0)

  return <HomeClient featuredProducts={featuredProducts} newProducts={newProducts} promoProducts={promoProducts} packs={packs} orderCount={orderCount} />
}
