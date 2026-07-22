import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateReviewToken, hashToken } from '@/lib/reviews/token'
import { reviewUrlFor } from '@/lib/reviews/review-requests'

const REQUEST_EXPIRY_DAYS = 90

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

interface RouteContext {
  params: Promise<{ id: string }>
}

// Régénère le lien d'une demande manuelle : nouveau token brut, ancien lien
// invalidé immédiatement (token_hash remplacé), expiration repoussée à 90
// jours, et réactivation si la demande avait été désactivée. Une demande
// déjà utilisée (avis déjà déposé) n'est jamais régénérable — il faut créer
// une nouvelle demande pour une nouvelle vente du même client.
export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const supabase = adminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('manual_review_requests')
    .select('id, used_at')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }

  if (existing.used_at) {
    return NextResponse.json(
      { error: 'Cette demande a déjà été utilisée. Créez une nouvelle demande pour une nouvelle vente.' },
      { status: 409 }
    )
  }

  const rawToken = generateReviewToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: updateError } = await supabase
    .from('manual_review_requests')
    .update({ token_hash: tokenHash, expires_at: expiresAt, disabled_at: null })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, reviewUrl: reviewUrlFor(rawToken) })
}
