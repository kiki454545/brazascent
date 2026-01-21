import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, formatAmountForStripe } from '@/lib/stripe'
import { z } from 'zod'

// Client Supabase côté serveur avec service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// =====================================================
// SCHÉMAS DE VALIDATION ZOD
// =====================================================

const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100),
  lastName: z.string().min(1, 'Nom requis').max(100),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone invalide').max(20),
  street: z.string().min(1, 'Adresse requise').max(255),
  city: z.string().min(1, 'Ville requise').max(100),
  postalCode: z.string().min(4, 'Code postal invalide').max(20),
  country: z.string().min(1, 'Pays requis').max(100),
})

const cartItemSchema = z.object({
  product: z.object({
    id: z.string().uuid('ID produit invalide'),
    name: z.string(),
    price: z.number(),
    priceBySize: z.record(z.string(), z.number()).optional(),
    images: z.array(z.string()),
  }),
  selectedSize: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
})

const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Le panier est vide'),
  shippingAddress: shippingAddressSchema,
  shippingMethod: z.enum(['standard', 'express']),
  userId: z.string().uuid().optional(),
  promoCode: z.object({
    id: z.string().uuid(),
    code: z.string(),
    discount: z.number(), // On ignore cette valeur, on recalcule côté serveur
  }).nullable().optional(),
})

// =====================================================
// TYPES
// =====================================================

interface ShippingSettings {
  freeShippingThreshold: number
  standardShippingPrice: number
  expressShippingPrice: number
  enableExpressShipping: boolean
}

interface VerifiedPromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  calculatedDiscount: number
}

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

// Récupérer les paramètres de livraison depuis Supabase
async function getShippingSettings(): Promise<ShippingSettings> {
  const defaultSettings: ShippingSettings = {
    freeShippingThreshold: 150,
    standardShippingPrice: 5,
    expressShippingPrice: 14.90,
    enableExpressShipping: true,
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shipping')
      .single()

    if (error || !data) {
      return defaultSettings
    }

    const shippingValue = data.value as ShippingSettings
    return {
      freeShippingThreshold: shippingValue.freeShippingThreshold ?? defaultSettings.freeShippingThreshold,
      standardShippingPrice: shippingValue.standardShippingPrice ?? defaultSettings.standardShippingPrice,
      expressShippingPrice: shippingValue.expressShippingPrice ?? defaultSettings.expressShippingPrice,
      enableExpressShipping: shippingValue.enableExpressShipping ?? defaultSettings.enableExpressShipping,
    }
  } catch {
    return defaultSettings
  }
}

// SÉCURITÉ: Vérifier et recalculer le code promo côté serveur
async function verifyPromoCode(
  promoCodeId: string,
  orderTotal: number
): Promise<VerifiedPromoCode | null> {
  try {
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', promoCodeId)
      .single()

    if (error || !promoCode) {
      return null
    }

    // Vérifier si le code est actif
    if (!promoCode.is_active) {
      return null
    }

    // Vérifier la date de début
    const now = new Date()
    const startsAt = new Date(promoCode.starts_at)
    if (startsAt > now) {
      return null
    }

    // Vérifier la date d'expiration
    if (promoCode.expires_at) {
      const expiresAt = new Date(promoCode.expires_at)
      if (expiresAt < now) {
        return null
      }
    }

    // Vérifier le nombre d'utilisations
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return null
    }

    // Vérifier le montant minimum de commande
    if (promoCode.min_order_amount > 0 && orderTotal < promoCode.min_order_amount) {
      return null
    }

    // SÉCURITÉ: Recalculer la réduction côté serveur (jamais faire confiance au client)
    let calculatedDiscount = 0
    if (promoCode.discount_type === 'percentage') {
      calculatedDiscount = (orderTotal * promoCode.discount_value) / 100
    } else {
      calculatedDiscount = Math.min(promoCode.discount_value, orderTotal)
    }

    return {
      id: promoCode.id,
      code: promoCode.code,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      min_order_amount: promoCode.min_order_amount,
      calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
    }
  } catch {
    return null
  }
}

// SÉCURITÉ: Vérifier les prix des produits côté serveur
async function verifyProductPrices(
  items: z.infer<typeof cartItemSchema>[]
): Promise<{ valid: boolean; verifiedItems: Array<{ id: string; size: string; quantity: number; serverPrice: number }> }> {
  const productIds = items.map(item => item.product.id)

  const { data: products, error } = await supabase
    .from('products')
    .select('id, price, price_by_size')
    .in('id', productIds)

  if (error || !products) {
    return { valid: false, verifiedItems: [] }
  }

  const productMap = new Map(products.map(p => [p.id, p]))
  const verifiedItems: Array<{ id: string; size: string; quantity: number; serverPrice: number }> = []

  for (const item of items) {
    const serverProduct = productMap.get(item.product.id)
    if (!serverProduct) {
      return { valid: false, verifiedItems: [] }
    }

    // Obtenir le prix serveur pour cette taille
    let serverPrice = serverProduct.price
    if (serverProduct.price_by_size && serverProduct.price_by_size[item.selectedSize]) {
      serverPrice = serverProduct.price_by_size[item.selectedSize]
    }

    verifiedItems.push({
      id: item.product.id,
      size: item.selectedSize,
      quantity: item.quantity,
      serverPrice,
    })
  }

  return { valid: true, verifiedItems }
}

// =====================================================
// ROUTE HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Valider toutes les entrées avec Zod
    const rawBody = await request.json()
    const parseResult = checkoutSchema.safeParse(rawBody)

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(e => e.message).join(', ')
      return NextResponse.json(
        { error: `Données invalides: ${errors}` },
        { status: 400 }
      )
    }

    const { items, shippingAddress, shippingMethod, userId, promoCode } = parseResult.data

    // SÉCURITÉ: Vérifier les prix des produits côté serveur
    const { valid, verifiedItems } = await verifyProductPrices(items)
    if (!valid) {
      return NextResponse.json(
        { error: 'Un ou plusieurs produits sont invalides' },
        { status: 400 }
      )
    }

    // Récupérer les paramètres de livraison depuis l'admin
    const shippingSettings = await getShippingSettings()

    // Vérifier si la livraison express est autorisée
    if (shippingMethod === 'express' && !shippingSettings.enableExpressShipping) {
      return NextResponse.json(
        { error: 'La livraison express n\'est pas disponible' },
        { status: 400 }
      )
    }

    // SÉCURITÉ: Calculer le sous-total avec les prix vérifiés côté serveur
    const subtotal = verifiedItems.reduce((sum, item) => sum + item.serverPrice * item.quantity, 0)
    const shippingCost = shippingMethod === 'express'
      ? shippingSettings.expressShippingPrice
      : (subtotal >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShippingPrice)

    // SÉCURITÉ: Vérifier et recalculer le code promo côté serveur
    let verifiedPromoCode: VerifiedPromoCode | null = null
    if (promoCode?.id) {
      // Vérifier si le panier contient des packs qui n'autorisent pas les codes promo
      const productIds = items.map(item => item.product.id)
      const { data: packsWithoutPromo } = await supabase
        .from('packs')
        .select('id, name')
        .in('id', productIds)
        .eq('promo_allowed', false)

      if (packsWithoutPromo && packsWithoutPromo.length > 0) {
        // Ignorer le code promo si des packs n'autorisent pas les promos
        verifiedPromoCode = null
      } else {
        verifiedPromoCode = await verifyPromoCode(promoCode.id, subtotal)
      }
      // Si le code promo fourni est invalide, on continue sans réduction (pas d'erreur)
    }

    // Créer les line items pour Stripe avec les prix vérifiés
    const lineItems = verifiedItems.map((item, index) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: items[index].product.name,
          description: `Taille: ${item.size}`,
          images: items[index].product.images.slice(0, 1),
        },
        unit_amount: formatAmountForStripe(item.serverPrice),
      },
      quantity: item.quantity,
    }))

    // Ajouter les frais de livraison si nécessaire
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: shippingMethod === 'express' ? 'Livraison Express' : 'Livraison Standard',
            description: shippingMethod === 'express' ? '1-2 jours ouvrés' : '3-5 jours ouvrés',
            images: [],
          },
          unit_amount: formatAmountForStripe(shippingCost),
        },
        quantity: 1,
      })
    }

    // Gérer le code promo avec les coupons Stripe (montant recalculé côté serveur)
    let stripeCouponId: string | undefined
    if (verifiedPromoCode && verifiedPromoCode.calculatedDiscount > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: formatAmountForStripe(verifiedPromoCode.calculatedDiscount),
          currency: 'eur',
          duration: 'once',
          name: `Code promo: ${verifiedPromoCode.code}`,
          max_redemptions: 1,
        })
        stripeCouponId = coupon.id
      } catch (couponError) {
        // Log sans exposer de détails sensibles
        console.error('Erreur création coupon Stripe')
      }
    }

    // Créer la session Stripe Checkout
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
      customer_email: shippingAddress.email,
      metadata: {
        userId: userId || '',
        shippingMethod,
        shipping: JSON.stringify({
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: `${shippingAddress.street}, ${shippingAddress.postalCode} ${shippingAddress.city}, ${shippingAddress.country}`
        }),
        items: JSON.stringify(verifiedItems.map(item => ({
          id: item.id,
          s: item.size,
          q: item.quantity,
          p: item.serverPrice,
        }))),
        promoCodeId: verifiedPromoCode?.id || '',
        promoCodeCode: verifiedPromoCode?.code || '',
        promoCodeDiscount: verifiedPromoCode?.calculatedDiscount?.toString() || '',
      },
      locale: 'fr',
    }

    // Ajouter le coupon si disponible
    if (stripeCouponId) {
      sessionConfig.discounts = [{ coupon: stripeCouponId }]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Enregistrer l'utilisation du code promo
    if (verifiedPromoCode) {
      try {
        await supabase.rpc('increment_promo_code_usage', { code_id: verifiedPromoCode.id })

        await supabase.from('promo_code_usage').insert({
          promo_code_id: verifiedPromoCode.id,
          user_id: userId || null,
          user_email: shippingAddress.email,
          order_id: session.id,
          order_total: subtotal + shippingCost,
          discount_applied: verifiedPromoCode.calculatedDiscount,
        })
      } catch {
        // Ne pas bloquer la commande si l'enregistrement échoue
      }
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: unknown) {
    // SÉCURITÉ: Ne pas exposer les détails d'erreur en production
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Checkout error:', errorMessage)

    // Vérifier si Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Service de paiement temporairement indisponible' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
