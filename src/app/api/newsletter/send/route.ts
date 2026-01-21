import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// SÉCURITÉ: Validation stricte des entrées
const newsletterSchema = z.object({
  subject: z.string().min(1, 'Sujet requis').max(255, 'Sujet trop long'),
  content: z.string().min(1, 'Contenu requis').max(50000, 'Contenu trop long'),
  recipients: z.array(z.string().email('Email invalide')).min(1, 'Au moins un destinataire').max(1000, 'Maximum 1000 destinataires par envoi'),
})

// Créer un client Supabase avec la clé service pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Vérifier l'authentification admin AVANT tout traitement
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non autorisé - Token manquant' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé - Token invalide' },
        { status: 401 }
      )
    }

    // Vérifier le rôle admin dans user_profiles
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Accès refusé - Droits administrateur requis' },
        { status: 403 }
      )
    }

    // SÉCURITÉ: Validation Zod des entrées
    const body = await request.json()
    const parseResult = newsletterSchema.safeParse(body)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Données invalides'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    const { subject, content, recipients } = parseResult.data

    // Option 1: Utiliser Resend (recommandé)
    // Si vous avez une clé API Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Envoyer par lots de 50 pour éviter les limites
      const batchSize = 50
      const batches = []

      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize))
      }

      const results = []
      for (const batch of batches) {
        const { data, error } = await resend.batch.send(
          batch.map((email: string) => ({
            from: 'Braza Scent <newsletter@brazascent.com>',
            to: email,
            subject: subject,
            html: generateEmailTemplate(subject, content)
          }))
        )

        if (error) {
          console.error('Resend error:', error)
          results.push({ success: false, error })
        } else {
          results.push({ success: true, data })
        }
      }

      const successCount = results.filter(r => r.success).length * batchSize

      return NextResponse.json({
        success: true,
        message: `Email envoyé à ${Math.min(successCount, recipients.length)} destinataires`,
        sent: recipients.length
      })
    }

    // Option 2: Simulation pour le développement (sans vrai envoi)
    // En production, configurez RESEND_API_KEY
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV] Newsletter simulation:', recipients.length, 'destinataires')
    }

    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      message: `[MODE DÉMO] Email simulé pour ${recipients.length} destinataires. Configurez RESEND_API_KEY pour l'envoi réel.`,
      sent: recipients.length,
      demo: true
    })

  } catch (error) {
    // SÉCURITÉ: Ne pas exposer les détails d'erreur
    console.error('Newsletter error')
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi' },
      { status: 500 }
    )
  }
}

// Template d'email HTML professionnel
function generateEmailTemplate(subject: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background-color: #19110B; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #C9A962; font-size: 28px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase;">
                Braza Scent
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: #333333; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://brazascent.com" style="display: inline-block; padding: 14px 32px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
                Découvrir la boutique
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #19110B; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px; color: #ffffff; font-size: 12px; letter-spacing: 0.1em;">
                MAISON DE PARFUMERIE D'EXCEPTION
              </p>
              <p style="margin: 0; color: #888888; font-size: 11px;">
                Vous recevez cet email car vous êtes inscrit à notre newsletter.<br>
                <a href="https://brazascent.com/unsubscribe" style="color: #C9A962; text-decoration: underline;">Se désinscrire</a>
              </p>
              <p style="margin: 15px 0 0; color: #666666; font-size: 10px;">
                © ${new Date().getFullYear()} Braza Scent. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
