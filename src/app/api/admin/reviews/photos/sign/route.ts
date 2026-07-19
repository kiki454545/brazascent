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

// review-uploads est un bucket privé sans policy cliente — seul ce endpoint,
// réservé aux admins, peut générer une URL signée pour prévisualiser une
// photo encore en attente de modération.
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as { paths?: string[] } | null
  if (!body?.paths || body.paths.length === 0) {
    return NextResponse.json({ urls: {} })
  }

  const supabase = adminClient()
  const urls: Record<string, string | null> = {}

  await Promise.all(
    body.paths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from('review-uploads')
        .createSignedUrl(path, 600) // 10 minutes, suffisant pour une session de modération
      urls[path] = error ? null : data?.signedUrl ?? null
    })
  )

  return NextResponse.json({ urls })
}
