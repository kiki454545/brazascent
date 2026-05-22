import { Resend } from 'resend'

const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

const buildHeader = () => `
  <tr>
    <td style="background-color: #19110B; padding: 30px 40px; text-align: center;">
      <h1 style="margin: 0; color: #C9A962; font-size: 28px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase;">
        Braza Scent
      </h1>
    </td>
  </tr>
`

const buildFooter = () => `
  <tr>
    <td style="background-color: #19110B; padding: 30px 40px; text-align: center;">
      <p style="margin: 0 0 15px; color: #ffffff; font-size: 12px; letter-spacing: 0.1em;">
        MAISON DE PARFUMERIE D'EXCEPTION
      </p>
      <p style="margin: 0; color: #888888; font-size: 11px;">
        Une question ? Contactez-nous à brazascent@gmail.com
      </p>
      <p style="margin: 15px 0 0; color: #666666; font-size: 10px;">
        © ${new Date().getFullYear()} Braza Scent. Tous droits réservés.
      </p>
    </td>
  </tr>
`

const wrapEmail = (content: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          ${buildHeader()}
          ${content}
          ${buildFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

export async function sendShippingEmail({
  customerEmail,
  customerName,
  orderNumber,
  trackingNumber,
  trackingUrl,
  carrier,
}: {
  customerEmail: string
  customerName: string
  orderNumber: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
}) {
  const resend = getResend()
  if (!resend) return

  const trackingBlock = trackingNumber ? `
    <div style="background-color: #f9f6f1; padding: 20px; border-left: 3px solid #C9A962; margin: 20px 0;">
      <h3 style="margin: 0 0 12px; font-size: 13px; text-transform: uppercase; color: #666; letter-spacing: 0.1em;">Informations de suivi</h3>
      ${carrier ? `<p style="margin: 0 0 6px; color: #19110B;"><strong>Transporteur :</strong> ${carrier}</p>` : ''}
      <p style="margin: 0; color: #19110B;"><strong>Numéro de suivi :</strong> ${trackingNumber}</p>
      ${trackingUrl ? `
      <a href="${trackingUrl}" style="display: inline-block; margin-top: 14px; padding: 10px 20px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
        Suivre mon colis
      </a>` : ''}
    </div>` : ''

  const html = wrapEmail(`
    <tr>
      <td style="padding: 40px; text-align: center;">
        <div style="width: 60px; height: 60px; background-color: #C9A962; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <span style="color: white; font-size: 26px; line-height: 1;">✈</span>
        </div>
        <h2 style="margin: 0 0 10px; color: #19110B; font-size: 24px; font-weight: 400;">
          Votre commande est en route !
        </h2>
        <p style="margin: 0; color: #666; font-size: 16px;">
          Commande n° <strong style="color: #19110B;">${orderNumber}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 30px;">
        <p style="color: #444; font-size: 15px; line-height: 1.7;">Bonjour ${customerName},</p>
        <p style="color: #444; font-size: 15px; line-height: 1.7;">
          Bonne nouvelle ! Votre commande a été expédiée et est en chemin vers vous.
        </p>
        ${trackingBlock}
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px; text-align: center;">
        <a href="https://brazascent.com/compte/commandes" style="display: inline-block; padding: 14px 32px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
          Voir ma commande
        </a>
      </td>
    </tr>
  `)

  try {
    await resend.emails.send({
      from: 'Braza Scent <commandes@brazascent.com>',
      to: customerEmail,
      subject: `Votre commande n° ${orderNumber} a été expédiée !`,
      html,
    })
  } catch (error) {
    console.error('Erreur envoi email expédition:', error)
  }
}

export async function sendAdminOrderNotification({
  orderNumber,
  customerName,
  customerEmail,
  total,
  itemCount,
}: {
  orderNumber: string
  customerName: string
  customerEmail: string
  total: number
  itemCount: number
}) {
  const resend = getResend()
  if (!resend) return

  const adminEmail = process.env.ADMIN_EMAIL || 'brazascent@gmail.com'

  const html = wrapEmail(`
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #19110B; font-size: 24px; font-weight: 400;">
          Nouvelle commande reçue !
        </h2>
        <p style="margin: 0; color: #666; font-size: 16px;">
          Commande n° <strong style="color: #19110B;">${orderNumber}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 30px;">
        <div style="background-color: #f9f6f1; padding: 20px; border-left: 3px solid #C9A962;">
          <p style="margin: 0 0 8px; color: #19110B;"><strong>Client :</strong> ${customerName}</p>
          <p style="margin: 0 0 8px; color: #19110B;"><strong>Email :</strong> ${customerEmail}</p>
          <p style="margin: 0 0 8px; color: #19110B;"><strong>Articles :</strong> ${itemCount}</p>
          <p style="margin: 0; color: #19110B; font-size: 18px;"><strong>Total :</strong> ${total.toFixed(2)} €</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px; text-align: center;">
        <a href="https://brazascent.com/admin/commandes" style="display: inline-block; padding: 14px 32px; background-color: #19110B; color: #C9A962; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
          Gérer la commande
        </a>
      </td>
    </tr>
  `)

  try {
    await resend.emails.send({
      from: 'Braza Scent <commandes@brazascent.com>',
      to: adminEmail,
      subject: `[BrazaScent] Nouvelle commande #${orderNumber} — ${total.toFixed(2)} €`,
      html,
    })
  } catch (error) {
    console.error('Erreur envoi email admin commande:', error)
  }
}

export async function sendTicketReplyEmail({
  customerEmail,
  customerName,
  ticketSubject,
  adminMessage,
}: {
  customerEmail: string
  customerName: string
  ticketSubject: string
  adminMessage: string
}) {
  const resend = getResend()
  if (!resend) return

  const html = wrapEmail(`
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #19110B; font-size: 24px; font-weight: 400;">
          Réponse à votre message
        </h2>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Concernant : <em>${ticketSubject}</em>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 30px;">
        <p style="color: #444; font-size: 15px; line-height: 1.7;">Bonjour ${customerName},</p>
        <p style="color: #444; font-size: 15px; line-height: 1.7;">
          Notre équipe vous a répondu concernant votre demande :
        </p>
        <div style="background-color: #f9f6f1; padding: 20px; border-left: 3px solid #C9A962; margin: 20px 0;">
          <p style="margin: 0; color: #19110B; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${adminMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>
        <p style="color: #444; font-size: 14px; line-height: 1.7;">
          Si vous avez d'autres questions, n'hésitez pas à nous contacter.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px; text-align: center;">
        <a href="https://brazascent.com/contact" style="display: inline-block; padding: 14px 32px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
          Nous contacter
        </a>
      </td>
    </tr>
  `)

  try {
    await resend.emails.send({
      from: 'Braza Scent Support <support@brazascent.com>',
      to: customerEmail,
      subject: `Réponse à votre demande : ${ticketSubject}`,
      html,
    })
  } catch (error) {
    console.error('Erreur envoi email réponse ticket:', error)
  }
}

export async function sendStockAlertEmail({
  email,
  productName,
  productSlug,
  productImage,
}: {
  email: string
  productName: string
  productSlug: string
  productImage?: string
}) {
  const resend = getResend()
  if (!resend) return

  const html = wrapEmail(`
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #19110B; font-size: 24px; font-weight: 400;">
          De retour en stock !
        </h2>
        <p style="margin: 0; color: #666; font-size: 15px; line-height: 1.7;">
          Un produit de votre liste d'alertes est à nouveau disponible.
        </p>
      </td>
    </tr>
    ${productImage ? `
    <tr>
      <td style="padding: 0 40px 20px; text-align: center;">
        <img src="${productImage}" alt="${productName}" style="width: 160px; height: 200px; object-fit: cover;" />
      </td>
    </tr>` : ''}
    <tr>
      <td style="padding: 0 40px 30px; text-align: center;">
        <h3 style="margin: 0 0 20px; color: #19110B; font-size: 20px; font-weight: 300; letter-spacing: 0.1em;">
          ${productName}
        </h3>
        <a href="https://brazascent.com/parfum/${productSlug}" style="display: inline-block; padding: 14px 32px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
          Commander maintenant
        </a>
        <p style="margin: 16px 0 0; color: #999; font-size: 12px;">
          Les stocks sont limités, ne tardez pas !
        </p>
      </td>
    </tr>
  `)

  try {
    await resend.emails.send({
      from: 'Braza Scent <commandes@brazascent.com>',
      to: email,
      subject: `${productName} est de retour en stock !`,
      html,
    })
  } catch (error) {
    console.error('Erreur envoi email alerte stock:', error)
  }
}

export async function sendNewsletterWelcomeEmail(email: string) {
  const resend = getResend()
  if (!resend) return

  const html = wrapEmail(`
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h2 style="margin: 0 0 16px; color: #19110B; font-size: 24px; font-weight: 400;">
          Bienvenue dans l'univers Braza Scent !
        </h2>
        <p style="margin: 0 auto; color: #666; font-size: 15px; line-height: 1.7; max-width: 400px;">
          Vous faites désormais partie de notre communauté de passionnés de parfums d'exception.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 30px;">
        <p style="color: #444; font-size: 15px; line-height: 1.7; text-align: center;">
          En tant qu'abonné, vous serez le premier à découvrir :
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 12px 16px; background-color: #f9f6f1; border-left: 3px solid #C9A962; color: #19110B; font-size: 14px;">
              ✨ <strong>Nos nouveautés</strong> en avant-première
            </td>
          </tr>
          <tr><td style="height: 6px;"></td></tr>
          <tr>
            <td style="padding: 12px 16px; background-color: #f9f6f1; border-left: 3px solid #C9A962; color: #19110B; font-size: 14px;">
              🎁 <strong>Offres exclusives</strong> réservées aux abonnés
            </td>
          </tr>
          <tr><td style="height: 6px;"></td></tr>
          <tr>
            <td style="padding: 12px 16px; background-color: #f9f6f1; border-left: 3px solid #C9A962; color: #19110B; font-size: 14px;">
              🌸 <strong>Conseils olfactifs</strong> de nos experts
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 40px 40px; text-align: center;">
        <a href="https://brazascent.com/parfums" style="display: inline-block; padding: 14px 32px; background-color: #C9A962; color: #19110B; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
          Découvrir nos parfums
        </a>
      </td>
    </tr>
  `)

  try {
    await resend.emails.send({
      from: 'Braza Scent <newsletter@brazascent.com>',
      to: email,
      subject: 'Bienvenue chez Braza Scent !',
      html,
    })
  } catch (error) {
    console.error('Erreur envoi email bienvenue newsletter:', error)
  }
}
