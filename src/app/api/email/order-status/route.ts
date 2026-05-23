import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendProcessingEmail, sendDeliveredEmail } from '@/lib/email'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
    }

    if (!['processing', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, shipping_address')
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

    if (status === 'processing') {
      await sendProcessingEmail({ customerEmail, customerName, orderNumber: order.order_number })
    } else {
      await sendDeliveredEmail({ customerEmail, customerName, orderNumber: order.order_number })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending order status email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
