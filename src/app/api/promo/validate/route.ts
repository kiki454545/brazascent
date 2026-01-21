import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

// Créer un client Supabase avec la clé service pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Schéma de validation Zod
const validatePromoSchema = z.object({
  code: z.string().min(1, 'Code promo requis').max(50),
  orderTotal: z.number().min(0).optional(),
  productIds: z.array(z.string()).optional(), // IDs des produits pour vérifier les packs sans promo
})

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Rate limiting pour éviter le brute force
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`promo:${clientIP}`, RATE_LIMITS.PROMO_VALIDATE)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rateLimit.resetIn} secondes.` },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.resetIn.toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    // SÉCURITÉ: Validation des entrées avec Zod
    const rawBody = await request.json()
    const parseResult = validatePromoSchema.safeParse(rawBody)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Code promo requis' },
        { status: 400 }
      )
    }

    const { code, orderTotal, productIds } = parseResult.data

    // Vérifier si le panier contient des packs qui n'autorisent pas les codes promo
    if (productIds && productIds.length > 0) {
      const { data: packs } = await supabaseAdmin
        .from('packs')
        .select('id, name, promo_allowed')
        .in('id', productIds)
        .eq('promo_allowed', false)

      if (packs && packs.length > 0) {
        const packNames = packs.map(p => p.name).join(', ')
        return NextResponse.json(
          { error: `Les codes promo ne sont pas utilisables sur : ${packNames}` },
          { status: 400 }
        )
      }
    }

    // Rechercher le code promo
    const { data: promoCode, error: fetchError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single()

    if (fetchError || !promoCode) {
      return NextResponse.json(
        { error: 'Code promo invalide' },
        { status: 400 }
      )
    }

    // Vérifier si le code est actif
    if (!promoCode.is_active) {
      return NextResponse.json(
        { error: 'Ce code promo n\'est plus actif' },
        { status: 400 }
      )
    }

    // Vérifier la date de début
    const now = new Date()
    const startsAt = new Date(promoCode.starts_at)
    if (startsAt > now) {
      return NextResponse.json(
        { error: 'Ce code promo n\'est pas encore valide' },
        { status: 400 }
      )
    }

    // Vérifier la date d'expiration
    if (promoCode.expires_at) {
      const expiresAt = new Date(promoCode.expires_at)
      if (expiresAt < now) {
        return NextResponse.json(
          { error: 'Ce code promo a expiré' },
          { status: 400 }
        )
      }
    }

    // Vérifier le nombre d'utilisations
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json(
        { error: 'Ce code promo a atteint sa limite d\'utilisation' },
        { status: 400 }
      )
    }

    // Vérifier le montant minimum de commande
    if (orderTotal && promoCode.min_order_amount > 0 && orderTotal < promoCode.min_order_amount) {
      return NextResponse.json(
        { error: `Montant minimum de commande: ${promoCode.min_order_amount} €` },
        { status: 400 }
      )
    }

    // Calculer la réduction
    let discountAmount = 0
    if (orderTotal) {
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (orderTotal * promoCode.discount_value) / 100
      } else {
        discountAmount = Math.min(promoCode.discount_value, orderTotal)
      }
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value,
        min_order_amount: promoCode.min_order_amount,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation du code promo' },
      { status: 500 }
    )
  }
}
