import { NextRequest, NextResponse } from 'next/server'
import { sendTicketReplyEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { customerEmail, customerName, ticketSubject, adminMessage } = await request.json()

    if (!customerEmail || !adminMessage) {
      return NextResponse.json({ error: 'customerEmail and adminMessage required' }, { status: 400 })
    }

    await sendTicketReplyEmail({
      customerEmail,
      customerName: customerName || 'Client',
      ticketSubject: ticketSubject || 'Votre demande',
      adminMessage,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending ticket reply email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
