import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'BRZ' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.slice(7)
  if (!token) return null
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id ?? null
}

// GET — retourne le code de parrainage de l'utilisateur (le génère si absent)
export async function GET(request: NextRequest) {
  const userId = await getUserId(request)
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (profile?.referral_code) {
    return NextResponse.json({ code: profile.referral_code })
  }

  // Générer un code unique
  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()
    if (!existing) break
    code = generateCode()
    attempts++
  }

  await supabaseAdmin
    .from('user_profiles')
    .update({ referral_code: code })
    .eq('id', userId)

  return NextResponse.json({ code })
}
