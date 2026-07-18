import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { hashToken } from '@/lib/reviews/token'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const submitSchema = z.object({
  token: z.string().min(32).max(512),
  rating: z.number().int().min(1, 'Veuillez choisir une note').max(5),
  comment: z.string().trim().min(10, 'Le commentaire doit faire au moins 10 caractères').max(2000),
  userName: z.string().trim().min(1, 'Le prénom est requis').max(100),
  photoPaths: z.array(z.string().min(1).max(500)).max(4, 'Maximum 4 photos').default([]),
  purchasedSize: z.string().max(50).optional().nullable(),
})

// Mappe les codes levés par la fonction SQL submit_verified_review() (Lot 1)
// vers une réponse HTTP et un message clair — aucune insertion directe dans
// product_reviews n'a lieu ici, tout passe par cet unique appel RPC atomique.
const ERROR_MAP: Record<string, { status: number; message: string }> = {
  REVIEW_TOKEN_INVALID:     { status: 404, message: "Ce lien d'avis n'est pas valide." },
  REVIEW_TOKEN_EXPIRED:     { status: 410, message: 'Ce lien a expiré.' },
  REVIEW_TOKEN_USED:        { status: 409, message: 'Un avis a déjà été déposé avec ce lien.' },
  REVIEW_ORDER_NOT_FOUND:   { status: 404, message: 'Commande introuvable.' },
  REVIEW_ORDER_CANCELLED:   { status: 409, message: 'Cette commande a été annulée ou remboursée.' },
  REVIEW_PRODUCT_NOT_FOUND: { status: 404, message: "Ce produit n'est plus disponible." },
  REVIEW_ALREADY_EXISTS:    { status: 409, message: 'Vous avez déjà laissé un avis pour ce produit.' },
  REVIEW_INVALID_RATING:    { status: 400, message: 'Veuillez choisir une note entre 1 et 5.' },
  REVIEW_INVALID_COMMENT:   { status: 400, message: 'Le commentaire doit faire au moins 10 caractères.' },
  REVIEW_TOO_MANY_PHOTOS:   { status: 400, message: 'Maximum 4 photos.' },
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null)

    // Honeypot — vérifié avant toute autre validation. Un bot qui remplit ce
    // champ (invisible pour un humain) reçoit un faux succès silencieux,
    // sans traitement ni indice qu'il a été détecté.
    if (typeof rawBody?.website === 'string' && rawBody.website.trim().length > 0) {
      return NextResponse.json({ success: true, reviewId: null })
    }

    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`reviews-submit:${clientIP}`, RATE_LIMITS.REVIEW_SUBMIT)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const parsed = submitSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }
    const { token, rating, comment, userName, photoPaths, purchasedSize } = parsed.data
    const tokenHash = hashToken(token)

    // Vérifie que les fichiers temporaires référencés existent réellement dans
    // le dossier de CE token — empêche de rattacher des chemins arbitraires ou
    // appartenant à un autre lien.
    if (photoPaths.length > 0) {
      const prefix = `pending/${tokenHash}/`
      const invalidPath = photoPaths.find((p) => !p.startsWith(prefix))
      if (invalidPath) {
        return NextResponse.json({ error: 'Photo invalide.' }, { status: 400 })
      }

      const { data: existingFiles, error: listError } = await supabaseAdmin.storage
        .from('review-uploads')
        .list(`pending/${tokenHash}`)

      if (listError) {
        return NextResponse.json({ error: 'Erreur de vérification des photos.' }, { status: 500 })
      }

      const existingPaths = new Set((existingFiles || []).map((f) => `${prefix}${f.name}`))
      const missing = photoPaths.find((p) => !existingPaths.has(p))
      if (missing) {
        return NextResponse.json({ error: 'Une photo est introuvable, réessayez.' }, { status: 400 })
      }
    }

    const { data: reviewId, error: rpcError } = await supabaseAdmin.rpc('submit_verified_review', {
      p_token_hash: tokenHash,
      p_rating: rating,
      p_comment: comment,
      p_user_name: userName,
      p_photo_paths: photoPaths,
      p_purchased_size: purchasedSize || null,
    })

    if (rpcError) {
      const code = rpcError.message?.trim()
      const mapped = code ? ERROR_MAP[code] : undefined
      if (mapped) {
        return NextResponse.json({ error: mapped.message }, { status: mapped.status })
      }
      console.error('Erreur submit_verified_review non mappée:', rpcError)
      return NextResponse.json(
        { error: 'Une erreur est survenue. Veuillez réessayer.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, reviewId })
  } catch (error) {
    console.error('Erreur /api/reviews/submit:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
