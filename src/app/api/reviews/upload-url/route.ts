import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { hashToken } from '@/lib/reviews/token'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 Mo
const MAX_FILES = 4

const fileSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, 'Fichier trop volumineux (4 Mo max)'),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
})

const uploadUrlSchema = z.object({
  token: z.string().min(32).max(512),
  files: z.array(fileSchema).min(1).max(MAX_FILES, 'Maximum 4 photos'),
})

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
    case 'image/webp': return 'webp'
    default: return 'bin'
  }
}

// Émet des URL d'upload signées vers le bucket privé review-uploads — le client
// n'a jamais d'accès direct/libre au bucket, seuls ces chemins précis et
// temporaires sont autorisés à recevoir un fichier.
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimit = checkRateLimit(`reviews-upload-url:${clientIP}`, RATE_LIMITS.REVIEW_UPLOAD)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = uploadUrlSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }
    const { token, files } = parsed.data
    const tokenHash = hashToken(token)

    const { data: reviewToken, error: tokenError } = await supabaseAdmin
      .from('review_tokens')
      .select('id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (tokenError || !reviewToken) {
      return NextResponse.json({ error: "Ce lien d'avis n'est pas valide." }, { status: 404 })
    }
    if (new Date(reviewToken.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Ce lien a expiré.' }, { status: 410 })
    }
    if (reviewToken.used_at) {
      return NextResponse.json({ error: 'Un avis a déjà été déposé avec ce lien.' }, { status: 409 })
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const path = `pending/${tokenHash}/${randomUUID()}.${extensionFor(file.mimeType)}`
        const { data, error } = await supabaseAdmin.storage
          .from('review-uploads')
          .createSignedUploadUrl(path)

        if (error || !data) {
          throw new Error(`Impossible de préparer l'upload pour ${file.fileName}`)
        }

        return { path: data.path, token: data.token, mimeType: file.mimeType }
      })
    )

    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('Erreur /api/reviews/upload-url:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
