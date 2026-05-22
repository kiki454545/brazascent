import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendShippingEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, shipping_address, tracking_number, tracking_url, carrier')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const address = order.shipping_address
    const customerEmail = address?.email
    const customerName = `${address?.firstName || ''} ${address?.lastName || ''}`.trim() || 'Client'

    if (!customerEmail) {
      return NextResponse.json({ error: 'No customer email' }, { status: 400 })
    }

    await sendShippingEmail({
      customerEmail,
      customerName,
      orderNumber: order.order_number,
      trackingNumber: order.tracking_number || undefined,
      trackingUrl: order.tracking_url || undefined,
      carrier: order.carrier || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending shipping email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
