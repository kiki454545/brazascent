import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const POINTS_PER_EURO = 100  // 100 pts = 5€
const MIN_POINTS = 100

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.slice(7)
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id ?? null
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Calculer le solde réel (toutes les entrées, positives et négatives)
    const { data: allPoints } = await supabaseAdmin
      .from('loyalty_points')
      .select('points')
      .eq('user_id', userId)

    const balance = (allPoints || []).reduce((sum, r) => sum + r.points, 0)

    if (balance < MIN_POINTS) {
      return NextResponse.json(
        { error: `Il vous faut au moins ${MIN_POINTS} points pour échanger. Solde actuel : ${balance} pts.` },
        { status: 400 }
      )
    }

    // Points utilisables (multiple de 100)
    const pointsToRedeem = Math.floor(balance / POINTS_PER_EURO) * POINTS_PER_EURO
    const discountEuros = pointsToRedeem / POINTS_PER_EURO * 5

    // Générer un code unique
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const promoCode = `POINTS-${randomPart}`

    // Expiration dans 90 jours
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90)

    // Créer le code promo dans la table
    const { data: newCode, error: codeError } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        code: promoCode,
        description: `Code généré depuis ${pointsToRedeem} points de fidélité`,
        discount_type: 'fixed',
        discount_value: discountEuros,
        min_order_amount: 0,
        max_uses: 1,
        max_uses_per_user: 1,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select('code, discount_value')
      .single()

    if (codeError || !newCode) {
      return NextResponse.json({ error: 'Erreur lors de la création du code' }, { status: 500 })
    }

    // Déduire les points
    const { error: deductError } = await supabaseAdmin
      .from('loyalty_points')
      .insert({
        user_id: userId,
        points: -pointsToRedeem,
        reason: `Échange contre code promo ${promoCode} (${discountEuros}€)`,
        order_id: null,
      })

    if (deductError) {
      // Annuler le code créé si la déduction échoue
      await supabaseAdmin.from('promo_codes').delete().eq('code', promoCode)
      return NextResponse.json({ error: 'Erreur lors de la déduction des points' }, { status: 500 })
    }

    return NextResponse.json({
      code: newCode.code,
      discountEuros,
      pointsUsed: pointsToRedeem,
      newBalance: balance - pointsToRedeem,
    })
  } catch (error) {
    console.error('Error redeeming loyalty points:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
