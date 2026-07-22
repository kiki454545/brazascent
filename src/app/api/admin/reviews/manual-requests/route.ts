import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { generateReviewToken, hashToken, hashPhone } from '@/lib/reviews/token'
import { reviewUrlFor } from '@/lib/reviews/review-requests'

const REQUEST_EXPIRY_DAYS = 90

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return null

    const { data: { user }, error } = await adminClient().auth.getUser(token)
    if (error || !user) return null

    const { data: profile } = await adminClient()
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    return profile?.is_admin === true ? user.id : null
  } catch {
    return null
  }
}

const createSchema = z.object({
  productId: z.string().uuid('Produit invalide'),
  firstName: z.string().trim().min(1, 'Le prénom est requis').max(100),
  customerEmail: z.string().trim().email('Email invalide').max(200).optional().nullable(),
  customerPhone: z.string().trim().min(6, 'Téléphone invalide').max(30).optional().nullable(),
  internalNote: z.string().trim().max(1000).optional().nullable(),
  sourceChannel: z.enum(['snapchat', 'instagram', 'tiktok', 'whatsapp', 'autre']).optional().nullable(),
}).refine((d) => !!d.customerEmail || !!d.customerPhone, {
  message: 'Indiquez au moins un email ou un numéro de téléphone',
})

// Liste des demandes manuelles (Lot 6.5) — jamais le token brut (jamais
// stocké), jamais le token_hash (inutile côté client admin).
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('manual_review_requests')
    .select(
      'id, product_id, first_name, customer_email, internal_note, source_channel, expires_at, used_at, disabled_at, review_id, created_at, products(name, slug), product_reviews(status)'
    )
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data || [] })
}

// Création d'une demande d'avis manuelle — génère un token brut renvoyé une
// seule fois dans la réponse (jamais stocké, jamais loggé). Empêche
// plusieurs demandes ACTIVES simultanées pour le même produit + contact
// (une demande expirée/désactivée/utilisée ne bloque jamais une nouvelle
// demande — un client peut légitimement racheter le même produit).
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin(request)
  if (!adminId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Données invalides' },
      { status: 400 }
    )
  }
  const { productId, firstName, customerEmail, customerPhone, internalNote, sourceChannel } = parsed.data

  const supabase = adminClient()

  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle()

  if (!product) {
    return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  }

  const customerPhoneHash = customerPhone ? hashPhone(customerPhone) : null

  // Une seule demande active à la fois pour ce produit + ce contact.
  let activeQuery = supabase
    .from('manual_review_requests')
    .select('id')
    .eq('product_id', productId)
    .is('used_at', null)
    .is('disabled_at', null)
    .gt('expires_at', new Date().toISOString())

  if (customerEmail && customerPhoneHash) {
    activeQuery = activeQuery.or(`customer_email.eq.${customerEmail},customer_phone_hash.eq.${customerPhoneHash}`)
  } else if (customerEmail) {
    activeQuery = activeQuery.eq('customer_email', customerEmail)
  } else if (customerPhoneHash) {
    activeQuery = activeQuery.eq('customer_phone_hash', customerPhoneHash)
  }

  const { data: existingActive } = await activeQuery.limit(1).maybeSingle()
  if (existingActive) {
    return NextResponse.json(
      { error: 'Une demande active existe déjà pour ce produit et ce contact. Régénérez-la ou désactivez-la avant d’en créer une nouvelle.' },
      { status: 409 }
    )
  }

  const rawToken = generateReviewToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: created, error: insertError } = await supabase
    .from('manual_review_requests')
    .insert({
      product_id: productId,
      first_name: firstName,
      customer_email: customerEmail || null,
      customer_phone_hash: customerPhoneHash,
      internal_note: internalNote || null,
      source_channel: sourceChannel || null,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: adminId,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    return NextResponse.json({ error: insertError?.message || 'Erreur de création' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    requestId: created.id,
    reviewUrl: reviewUrlFor(rawToken),
    // Renvoyé uniquement dans cette réponse immédiate, pour permettre à
    // l'admin d'ouvrir WhatsApp directement — jamais loggé, jamais persisté
    // (seul customer_phone_hash est stocké en base).
    whatsappPhone: customerPhone || null,
  })
}
