import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  if (!token || token.length < 32) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
  }

  const supabaseAdmin = getAdmin()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data: cart, error } = await supabaseAdmin
    .from('active_carts')
    .select('id, items, subtotal, item_count, status, recovery_token_expires_at, user_email')
    .eq('recovery_token_hash', tokenHash)
    .gt('recovery_token_expires_at', new Date().toISOString())
    .not('status', 'in', '("recovered","expired","ignored")')
    .maybeSingle()

  if (error || !cart) {
    return NextResponse.json(
      { error: 'Lien expiré ou déjà utilisé' },
      { status: 404 }
    )
  }

  const items: Array<{ product_id: string; name: string; size: string; quantity: number; price: number; image?: string }> = cart.items || []

  if (items.length === 0) {
    return NextResponse.json({ error: 'Panier vide' }, { status: 404 })
  }

  // Fetch full product data for each item
  const productIds = [...new Set(items.map(i => i.product_id))]
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, description, price, images, category, brand, size, stock, is_active, priceBySize:price_by_size, gender')
    .in('id', productIds)
    .eq('is_active', true)

  const productMap = new Map((products || []).map(p => [p.id, p]))

  // Build cart items with full product data
  const cartItems = items
    .map(item => {
      const product = productMap.get(item.product_id)
      if (!product) return null
      return {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          shortDescription: '',
          price: product.price,
          priceBySize: product.priceBySize || {},
          images: product.images || [],
          category: product.category || '',
          brand: product.brand || '',
          notes: { top: [], heart: [], base: [] },
          size: product.size || [],
          inStock: (product.stock ?? 0) > 0,
          gender: product.gender,
        },
        quantity: item.quantity,
        selectedSize: item.size,
      }
    })
    .filter(Boolean)

  if (cartItems.length === 0) {
    return NextResponse.json({ error: 'Produits introuvables' }, { status: 404 })
  }

  // Mark as recovered
  await supabaseAdmin
    .from('active_carts')
    .update({
      status: 'recovered',
      recovered_at: new Date().toISOString(),
    })
    .eq('id', cart.id)

  return NextResponse.json({ items: cartItems })
}
