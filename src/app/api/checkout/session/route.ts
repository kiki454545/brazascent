import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

// SÉCURITÉ: Validation du format session_id Stripe
const sessionIdSchema = z.string()
  .min(1, 'Session ID requis')
  .regex(/^cs_/, 'Format de session ID invalide')

export async function GET(request: NextRequest) {
  try {
    const sessionIdParam = request.nextUrl.searchParams.get('session_id')

    // SÉCURITÉ: Validation stricte du session_id
    const parseResult = sessionIdSchema.safeParse(sessionIdParam)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Session ID invalide' },
        { status: 400 }
      )
    }

    const sessionId = parseResult.data

    // SÉCURITÉ: Try-catch spécifique pour Stripe
    let session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch {
      // Ne pas exposer les détails d'erreur Stripe
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    // SÉCURITÉ: Ne retourner que les données nécessaires (pas d'email complet)
    // L'email est masqué partiellement pour éviter l'énumération
    const maskedEmail = session.customer_email
      ? `${session.customer_email.slice(0, 3)}***@***`
      : null

    return NextResponse.json({
      session: {
        payment_status: session.payment_status,
        status: session.status,
        // Ne pas exposer amount_total ni email complet pour éviter l'énumération
        success: session.payment_status === 'paid',
        email_hint: maskedEmail,
      }
    })
  } catch (error) {
    console.error('Error retrieving session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la session' },
      { status: 500 }
    )
  }
}
