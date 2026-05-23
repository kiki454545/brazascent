import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const lookupSchema = z.object({
  orderNumber: z.string().min(1).max(50).trim(),
  email: z.string().email().max(255).trim(),
})

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceRoleKey) return null
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Configuration manquante' }, { status: 503 })
    }

    const body = await request.json()
    const parsed = lookupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { orderNumber, email } = parsed.data

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, status, subtotal, shipping, total, tracking_number, created_at, shipping_address, shipping_method')
      .eq('order_number', orderNumber)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    // Vérifier que l'email correspond à celui de la commande
    const orderEmail = (order.shipping_address as { email?: string })?.email || ''
    if (orderEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    // Récupérer les articles
    const { data: items } = await supabase
      .from('order_items')
      .select('id, product_name, product_image, size, quantity, price')
      .eq('order_id', order.id)

    return NextResponse.json({
      order: {
        order_number: order.order_number,
        status: order.status,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        tracking_number: order.tracking_number,
        created_at: order.created_at,
        shipping_address: {
          firstName: (order.shipping_address as Record<string, string>)?.firstName,
          lastName: (order.shipping_address as Record<string, string>)?.lastName,
          street: (order.shipping_address as Record<string, string>)?.street,
          city: (order.shipping_address as Record<string, string>)?.city,
          postalCode: (order.shipping_address as Record<string, string>)?.postalCode,
          country: (order.shipping_address as Record<string, string>)?.country,
        },
        shipping_method: order.shipping_method,
        items: items || [],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
