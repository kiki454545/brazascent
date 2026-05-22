import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendStockAlertEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId requis' }, { status: 400 })
    }

    // Récupérer le produit
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id, name, slug, images')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    }

    // Récupérer les alertes non encore notifiées pour ce produit
    const { data: alerts } = await supabaseAdmin
      .from('stock_alerts')
      .select('id, email')
      .eq('product_id', productId)
      .is('notified_at', null)

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ success: true, notified: 0 })
    }

    // Envoyer les emails en parallèle
    await Promise.allSettled(
      alerts.map(alert =>
        sendStockAlertEmail({
          email: alert.email,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images?.[0],
        })
      )
    )

    // Marquer comme notifiées
    const alertIds = alerts.map(a => a.id)
    await supabaseAdmin
      .from('stock_alerts')
      .update({ notified_at: new Date().toISOString() })
      .in('id', alertIds)

    return NextResponse.json({ success: true, notified: alerts.length })
  } catch (error) {
    console.error('Error sending stock alerts:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
