import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// Désactive un lien de demande manuelle — invalide immédiatement (le
// résolveur de token vérifie disabled_at). Idempotent.
export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id } = await params
  const supabase = adminClient()

  const { data: existing, error: fetchError } = await supabase
    .from('manual_review_requests')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('manual_review_requests')
    .update({ disabled_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
