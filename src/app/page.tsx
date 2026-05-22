import { createClient } from '@supabase/supabase-js'
import HomeClient from './HomeClient'
import { Product } from '@/types'

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

export default async function HomePage() {
  const [bestsellersRes, newProductsRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
      .eq('is_active', true)
      .eq('is_bestseller', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('id, name, slug, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, stock, is_new, is_bestseller, is_promo, display_order')
      .eq('is_active', true)
      .eq('is_new', true)
      .order('display_order', { ascending: true }),
  ])

  const featuredProducts = (bestsellersRes.data || []).map(mapProduct)
  const newProducts = (newProductsRes.data || []).map(mapProduct)

  return <HomeClient featuredProducts={featuredProducts} newProducts={newProducts} />
}
