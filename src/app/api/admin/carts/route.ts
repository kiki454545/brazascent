import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    return profile?.is_admin === true
  } catch {
    return false
  }
}

// PATCH /api/admin/carts  body: { id, action: 'ignore' | 'recover' | 'remind' }
export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const { id, action } = body as { id: string; action: string }

  if (!id || !action) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = adminClient()

  if (action === 'ignore') {
    const { error } = await supabase
      .from('active_carts')
      .update({ status: 'ignored', ignored_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'recover') {
    const { error } = await supabase
      .from('active_carts')
      .update({ status: 'recovered', recovered_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'remind') {
    // Manually trigger a reminder email via the cron endpoint
    const cronSecret = process.env.CRON_SECRET
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://brazascent.com'}/api/cron/abandoned-carts`,
      {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      }
    )
    const data = await res.json()
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
