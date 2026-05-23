import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendReviewNotificationEmail } from '@/lib/email'

const schema = z.object({
  productName: z.string().min(1).max(200),
  productSlug: z.string().min(1).max(200),
  userName: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    await sendReviewNotificationEmail(parsed.data)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
