import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Générer un code promo unique
function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'REVIENS'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Template d'email pour panier abandonné
function generateAbandonedCartEmail(
  firstName: string | null,
  items: Array<{ name: string; size: string; quantity: number; price: number; image?: string }>,
  subtotal: number,
  promoCode: string
): string {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 4px;">` : ''}
          <div>
            <p style="margin: 0; font-weight: 500; color: #19110B;">${item.name}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #666;">Taille: ${item.size} | Qté: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">
        ${(item.price * item.quantity).toFixed(2)} €
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre panier vous attend</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
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
            <td style="padding: 40px; color: #333333;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${greeting}
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Nous avons remarqué que vous avez laissé des articles dans votre panier.
                Ces parfums d'exception n'attendent que vous !
              </p>

              <!-- Promo Code Box -->
              <div style="background: linear-gradient(135deg, #19110B 0%, #2a1d14 100%); padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <p style="color: #C9A962; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 10px;">
                  Offre exclusive - Valable 24h
                </p>
                <p style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 0.2em; margin: 0 0 10px;">
                  ${promoCode}
                </p>
                <p style="color: #ffffff; font-size: 18px; margin: 0;">
                  -10% sur votre commande
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin: 0 0 30px; text-align: center;">
                Ce code expire dans 24 heures. Ne manquez pas cette opportunité !
              </p>
            </td>
          </tr>

          <!-- Cart Items -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="color: #19110B; font-size: 16px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 15px; border-bottom: 2px solid #C9A962; padding-bottom: 10px;">
                Votre panier
              </h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 15px; font-weight: bold; color: #19110B;">
                    Sous-total
                  </td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; color: #C9A962; font-size: 18px;">
                    ${subtotal.toFixed(2)} €
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://brazascent.com/panier" style="display: inline-block; padding: 16px 40px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px;">
                Finaliser ma commande
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
                Besoin d'aide ? Contactez-nous à contact@brazascent.com
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

export async function GET(request: NextRequest) {
  try {
    // Vérifier le secret pour sécuriser le cron (Vercel envoie ce header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // En production, vérifier le secret
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    // Trouver les paniers abandonnés (plus de 24h) qui n'ont pas encore reçu d'email
    const abandonedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: abandonedCarts, error: fetchError } = await supabaseAdmin
      .from('active_carts')
      .select('*')
      .gt('item_count', 0)
      .is('converted_at', null)
      .lt('last_activity', abandonedThreshold)
      .eq('recovery_email_sent', false)
      .not('user_email', 'is', null)
      .limit(50) // Traiter par lots

    if (fetchError) {
      console.error('Error fetching abandoned carts:', fetchError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des paniers' }, { status: 500 })
    }

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun panier abandonné à traiter',
        processed: 0
      })
    }

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[]
    }

    // Vérifier si Resend est configuré
    if (!process.env.RESEND_API_KEY) {
      console.log('[DEV] Resend non configuré - simulation')
      return NextResponse.json({
        success: true,
        message: `[MODE DÉMO] ${abandonedCarts.length} paniers abandonnés détectés. Configurez RESEND_API_KEY pour l'envoi réel.`,
        processed: abandonedCarts.length,
        demo: true
      })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    for (const cart of abandonedCarts) {
      try {
        // Générer un code promo unique
        const promoCode = generatePromoCode()

        // Créer le code promo dans la base de données (valable 24h)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

        const { error: promoError } = await supabaseAdmin
          .from('promo_codes')
          .insert({
            code: promoCode,
            description: `Code de récupération panier abandonné - ${cart.user_email}`,
            discount_type: 'percentage',
            discount_value: 10,
            min_order_amount: 0,
            max_uses: 1,
            current_uses: 0,
            starts_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true
          })

        if (promoError) {
          console.error('Error creating promo code:', promoError)
          results.errors.push(`Erreur création code promo pour ${cart.user_email}`)
          continue
        }

        // Récupérer le prénom de l'utilisateur si disponible
        let firstName: string | null = null
        if (cart.user_email) {
          const { data: userProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('first_name')
            .eq('email', cart.user_email)
            .single()

          firstName = userProfile?.first_name || null
        }

        // Envoyer l'email
        const emailHtml = generateAbandonedCartEmail(
          firstName,
          cart.items || [],
          cart.subtotal || 0,
          promoCode
        )

        const { error: emailError } = await resend.emails.send({
          from: 'Braza Scent <noreply@brazascent.com>',
          to: cart.user_email,
          subject: 'Votre panier vous attend - 10% offerts !',
          html: emailHtml
        })

        if (emailError) {
          console.error('Error sending email:', emailError)
          results.errors.push(`Erreur envoi email pour ${cart.user_email}`)
          continue
        }

        // Marquer le panier comme traité
        await supabaseAdmin
          .from('active_carts')
          .update({
            recovery_email_sent: true,
            recovery_email_sent_at: new Date().toISOString(),
            recovery_promo_code: promoCode,
            abandoned_at: new Date().toISOString()
          })
          .eq('id', cart.id)

        results.emailsSent++
        results.processed++

      } catch (err) {
        console.error('Error processing cart:', err)
        results.errors.push(`Erreur traitement panier ${cart.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.emailsSent} emails envoyés sur ${abandonedCarts.length} paniers abandonnés`,
      ...results
    })

  } catch (error) {
    console.error('Cron abandoned carts error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement des paniers abandonnés' },
      { status: 500 }
    )
  }
}
