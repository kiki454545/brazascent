import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { z } from 'zod'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const expressCheckoutSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    size: z.string().max(50),
    quantity: z.number().int().min(1).max(99),
  })).min(1),
  billingDetails: z.object({
    name: z.string().max(200).optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(20).optional(),
    address: z.object({
      line1: z.string().max(255).optional(),
      line2: z.string().max(255).optional(),
      city: z.string().max(100).optional(),
      postal_code: z.string().max(20).optional(),
      state: z.string().max(100).optional(),
      country: z.string().max(2).optional(),
    }).optional(),
  }),
  shippingAddress: z.object({
    name: z.string().max(200).optional(),
    address: z.object({
      line1: z.string().max(255).optional(),
      line2: z.string().max(255).optional(),
      city: z.string().max(100).optional(),
      postal_code: z.string().max(20).optional(),
      state: z.string().max(100).optional(),
      country: z.string().max(2).optional(),
    }).optional(),
  }).optional(),
  selectedShippingRateId: z.string().optional(),
  promoCode: z.object({
    id: z.string().uuid(),
    code: z.string(),
    discount: z.number(),
  }).nullable().optional(),
  userId: z.string().uuid().optional(),
})

interface VerifiedPromo {
  id: string
  code: string
  calculatedDiscount: number
}

async function verifyPromoCode(
  promoCodeId: string,
  orderTotal: number,
  userId?: string
): Promise<VerifiedPromo | null> {
  try {
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', promoCodeId)
      .single()

    if (error || !promo || !promo.is_active) return null

    const now = new Date()
    if (new Date(promo.starts_at) > now) return null
    if (promo.expires_at && new Date(promo.expires_at) < now) return null
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) return null

    if (promo.max_uses_per_user !== null) {
      if (!userId) return null
      const { count } = await supabase
        .from('promo_code_usage')
        .select('*', { count: 'exact', head: true })
        .eq('promo_code_id', promo.id)
        .eq('user_id', userId)
      if ((count ?? 0) >= promo.max_uses_per_user) return null
    }

    if (promo.min_order_amount > 0 && orderTotal < promo.min_order_amount) return null

    const calculatedDiscount = promo.discount_type === 'percentage'
      ? Math.round((orderTotal * promo.discount_value) / 100 * 100) / 100
      : Math.min(promo.discount_value, orderTotal)

    return { id: promo.id, code: promo.code, calculatedDiscount }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(`express:${clientIP}`, RATE_LIMITS.CHECKOUT)
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const parsed = expressCheckoutSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { items, billingDetails, shippingAddress, selectedShippingRateId, promoCode, userId } = parsed.data

  // SÉCURITÉ: vérifier prix et stock côté serveur (jamais faire confiance au client)
  const productIds = items.map(i => i.id)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, price, price_by_size, stock, name')
    .in('id', productIds)

  if (productsError || !products) {
    return NextResponse.json({ error: 'Erreur lors de la vérification des produits' }, { status: 500 })
  }

  const productMap = new Map(products.map(p => [p.id, p]))
  const verifiedItems: Array<{ id: string; size: string; quantity: number; serverPrice: number }> = []

  for (const item of items) {
    const p = productMap.get(item.id)
    if (!p) return NextResponse.json({ error: 'Produit introuvable' }, { status: 400 })
    if (p.stock === 0) return NextResponse.json({ error: `"${p.name}" est en rupture de stock` }, { status: 400 })
    if (p.stock !== null && p.stock < item.quantity) {
      return NextResponse.json({ error: `Stock insuffisant pour "${p.name}"` }, { status: 400 })
    }
    const serverPrice: number = (p.price_by_size && p.price_by_size[item.size])
      ? p.price_by_size[item.size]
      : p.price
    verifiedItems.push({ id: item.id, size: item.size, quantity: item.quantity, serverPrice })
  }

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.serverPrice * i.quantity, 0)

  // Trouver les méthodes de livraison activées
  const { data: methods } = await supabase
    .from('shipping_methods')
    .select('id, title, price, free_threshold')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })

  // Méthode domicile : priorité à "domicile" dans le titre (ex: "Livraison à domicile Mondial Relay")
  const homeMethod =
    methods?.find(m => m.title.toLowerCase().includes('domicile')) ??
    methods?.find(m => {
      const t = m.title.toLowerCase()
      return !t.includes('relais') && !t.includes('express') && !t.includes('chrono')
    })

  if (!homeMethod) {
    return NextResponse.json({ error: 'Aucune méthode de livraison domicile disponible' }, { status: 400 })
  }

  const usedMethodId = homeMethod.id
  const usedMethodTitle = homeMethod.title
  const shippingCost =
    homeMethod.free_threshold !== null && subtotal >= homeMethod.free_threshold
      ? 0
      : homeMethod.price

  // SÉCURITÉ: vérifier le code promo côté serveur
  let verifiedPromo: VerifiedPromo | null = null
  if (promoCode?.id) {
    // Vérifier que le panier ne contient pas de packs sans promo
    const { data: packsNoPromo } = await supabase
      .from('packs')
      .select('id')
      .in('id', productIds)
      .eq('promo_allowed', false)

    if (!packsNoPromo || packsNoPromo.length === 0) {
      verifiedPromo = await verifyPromoCode(promoCode.id, subtotal, userId)
    }
  }

  const promoDiscount = verifiedPromo?.calculatedDiscount ?? 0
  const totalAmount = Math.max(50, Math.round((subtotal + shippingCost - promoDiscount) * 100))

  // Formater l'adresse de livraison pour les métadonnées
  const shippingName = (shippingAddress?.name || billingDetails.name || '').trim()
  const shippingPhone = (billingDetails.phone || '').trim()
  const addr = shippingAddress?.address || billingDetails.address
  const formattedAddress = addr
    ? [addr.line1, addr.line2, addr.postal_code, addr.city, addr.country].filter(Boolean).join(', ')
    : ''

  // SÉCURITÉ: nom et téléphone obligatoires pour la livraison, comme pour le checkout classique
  if (!shippingName) {
    return NextResponse.json({ error: 'Nom et prénom requis pour la livraison' }, { status: 400 })
  }
  if (shippingPhone.length < 10) {
    return NextResponse.json({ error: 'Numéro de téléphone requis pour la livraison' }, { status: 400 })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        source: 'express_checkout',
        userId: userId || '',
        shippingMethodId: usedMethodId,
        shippingMethodTitle: usedMethodTitle,
        shippingCost: shippingCost.toString(),
        shipping: JSON.stringify({
          name: shippingName,
          email: billingDetails.email || '',
          phone: shippingPhone,
          address: formattedAddress,
        }),
        items: JSON.stringify(verifiedItems.map(i => ({
          id: i.id,
          s: i.size,
          q: i.quantity,
          p: i.serverPrice,
        }))),
        promoCodeId: verifiedPromo?.id || '',
        promoCodeCode: verifiedPromo?.code || '',
        promoCodeDiscount: verifiedPromo?.calculatedDiscount?.toString() || '',
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: unknown) {
    console.error('Express checkout error:', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
