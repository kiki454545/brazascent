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
      .from('user_profiles').select('is_admin').eq('id', user.id).single()
    return profile?.is_admin === true
  } catch { return false }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const supabase = adminClient()
  const { data: emails, error } = await supabase
    .from('post_purchase_emails')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ emails: emails || [] })
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { id, action } = await request.json() as { id: string; action: string }
  const supabase = adminClient()

  if (action === 'retry') {
    const { error } = await supabase
      .from('post_purchase_emails')
      .update({ status: 'pending', error_message: null })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'skip') {
    const { error } = await supabase
      .from('post_purchase_emails')
      .update({ status: 'skipped', sent_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
