import { NextRequest, NextResponse } from 'next/server'
import { sendNewsletterWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    await sendNewsletterWelcomeEmail(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
