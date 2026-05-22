import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { productId, email } = await request.json()

    if (!productId || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'productId et email valide requis' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('stock_alerts')
      .insert({ product_id: productId, email: email.toLowerCase().trim() })

    if (error) {
      if (error.code === '23505') {
        // Déjà inscrit — on considère ça comme un succès silencieux
        return NextResponse.json({ success: true, already: true })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error subscribing to stock alert:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
