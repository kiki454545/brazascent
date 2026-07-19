import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReviewToken, hashToken } from '@/lib/reviews/token'
import { sendManualReviewReminderEmail } from '@/lib/email'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return false

    const { data: { user }, error } = await adminClient().auth.getUser(token)
    if (error || !user) return false

    const { data: profile } = await adminClient()
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    return profile?.is_admin === true
  } catch {
    return false
  }
}

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0] || ''
}

const REVIEW_TOKEN_EXPIRY_DAYS = 90

// review_tokens n'a aucune policy RLS pour anon/authenticated (volontaire,
// Lot 1) — la liste des relances en attente doit donc passer par cette route
// service-role plutôt que par un accès direct depuis le client admin.
export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('review_tokens')
    .select('id, order_id, product_id, customer_email, reminder_count, last_reminder_at, last_reminder_channel, expires_at, created_at, products(name), orders(order_number, customer_name, shipping_address)')
    .is('used_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reminders: data || [] })
}

// Relance manuelle uniquement — jamais déclenchée automatiquement, jamais
// par un cron. Trois actions :
//  - email          : réémet le token (lien valide/non expiré garanti) et envoie l'email tout de suite
//  - prepare_whatsapp : réémet le token et renvoie les infos pour construire le lien wa.me côté client
//  - log_whatsapp    : journalise une relance WhatsApp déjà envoyée manuellement par l'admin
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    reviewTokenId?: string
    action?: 'email' | 'prepare_whatsapp' | 'log_whatsapp'
  } | null

  if (!body?.reviewTokenId || !body.action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = adminClient()

  const { data: reviewToken, error: tokenError } = await supabase
    .from('review_tokens')
    .select('id, order_id, product_id, customer_email, used_at, reminder_count')
    .eq('id', body.reviewTokenId)
    .maybeSingle()

  if (tokenError || !reviewToken) {
    return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 })
  }

  if (reviewToken.used_at) {
    return NextResponse.json({ error: 'Un avis a déjà été déposé — aucune relance possible.' }, { status: 409 })
  }

  if (body.action === 'log_whatsapp') {
    const { error } = await supabase
      .from('review_tokens')
      .update({
        reminder_count: (reviewToken.reminder_count ?? 0) + 1,
        last_reminder_at: new Date().toISOString(),
        last_reminder_channel: 'whatsapp',
      })
      .eq('id', body.reviewTokenId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // email / prepare_whatsapp : réémet un token frais (le lien précédent, s'il a
  // déjà été envoyé, cesse de fonctionner — un seul lien valide à la fois par avis).
  const rawToken = generateReviewToken()
  const newHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + REVIEW_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: reissueError } = await supabase
    .from('review_tokens')
    .update({ token_hash: newHash, expires_at: expiresAt })
    .eq('id', body.reviewTokenId)

  if (reissueError) {
    return NextResponse.json({ error: reissueError.message }, { status: 500 })
  }

  const [{ data: order }, { data: product }] = await Promise.all([
    supabase.from('orders').select('customer_name, shipping_address').eq('id', reviewToken.order_id).maybeSingle(),
    supabase.from('products').select('name').eq('id', reviewToken.product_id).maybeSingle(),
  ])

  const shippingName = (order?.shipping_address as { name?: string; phone?: string } | null)?.name
  const firstName = extractFirstName(order?.customer_name || shippingName)
  const productName = product?.name || 'votre parfum'
  const reviewUrl = `https://brazascent.com/avis/laisser?token=${rawToken}`

  if (body.action === 'email') {
    try {
      await sendManualReviewReminderEmail({
        customerEmail: reviewToken.customer_email,
        firstName,
        productName,
        reviewUrl,
      })
    } catch {
      return NextResponse.json({ error: "Échec de l'envoi de l'email" }, { status: 500 })
    }

    await supabase
      .from('review_tokens')
      .update({
        reminder_count: (reviewToken.reminder_count ?? 0) + 1,
        last_reminder_at: new Date().toISOString(),
        last_reminder_channel: 'email',
      })
      .eq('id', body.reviewTokenId)

    return NextResponse.json({ success: true })
  }

  if (body.action === 'prepare_whatsapp') {
    const phone = (order?.shipping_address as { phone?: string } | null)?.phone || null
    return NextResponse.json({
      success: true,
      firstName,
      productName,
      reviewUrl,
      phone,
    })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
