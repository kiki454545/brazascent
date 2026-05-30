import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BASE_URL = 'https://brazascent.com'

// ── Token helpers ────────────────────────────────────────────────────────────

function generateRecoveryToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  const hash = createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'REVIENS'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ── Email templates ──────────────────────────────────────────────────────────

type CartItem = { name: string; size: string; quantity: number; price: number; image?: string }

function emailWrapper(body: string, year: number) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f5f5f5;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.05);">
<tr><td style="background:#19110B;padding:30px 40px;text-align:center;">
  <h1 style="margin:0;color:#C9A962;font-size:28px;font-weight:300;letter-spacing:.2em;text-transform:uppercase;">Braza Scent</h1>
</td></tr>
${body}
<tr><td style="background:#19110B;padding:30px 40px;text-align:center;">
  <p style="margin:0 0 8px;color:#fff;font-size:12px;letter-spacing:.1em;">MAISON DE PARFUMERIE D'EXCEPTION</p>
  <p style="margin:0 0 8px;color:#888;font-size:11px;">Besoin d'aide ? <a href="mailto:contact@brazascent.com" style="color:#C9A962;">contact@brazascent.com</a></p>
  <p style="margin:0;color:#555;font-size:10px;">© ${year} Braza Scent. <a href="${BASE_URL}/rgpd" style="color:#555;">Se désabonner</a></p>
</td></tr>
</table></td></tr></table></body></html>`
}

function itemsHtml(items: CartItem[]) {
  return items.map(item => `
    <tr>
      <td style="padding:12px 15px;border-bottom:1px solid #eee;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" width="50" height="50" style="object-fit:cover;border-radius:4px;">` : ''}
          <div>
            <p style="margin:0;font-weight:500;color:#19110B;">${item.name}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#666;">${item.size} × ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 15px;border-bottom:1px solid #eee;text-align:right;font-weight:500;">
        ${(item.price * item.quantity).toFixed(2)} €
      </td>
    </tr>`).join('')
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;padding:15px 38px;background:#C9A962;color:#19110B;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;border-radius:4px;">${label}</a>`
}

// Rappel 1 — doux, 1h après abandon
function emailReminder1(firstName: string | null, items: CartItem[], subtotal: number, recoveryUrl: string) {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'
  const body = `
<tr><td style="padding:36px 40px;color:#333;">
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
    Vous avez laissé quelques merveilles dans votre panier. Elles vous attendent patiemment.
  </p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${itemsHtml(items)}
    <tr>
      <td style="padding:12px 15px;font-weight:700;color:#19110B;">Sous-total</td>
      <td style="padding:12px 15px;text-align:right;font-weight:700;color:#C9A962;font-size:17px;">${subtotal.toFixed(2)} €</td>
    </tr>
  </table>
  <div style="text-align:center;margin:30px 0;">
    ${ctaButton(recoveryUrl, 'Reprendre mon panier')}
  </div>
</td></tr>`
  return { subject: 'Votre panier vous attend ✨', html: emailWrapper(body, new Date().getFullYear()) }
}

// Rappel 2 — conversion, 24h après abandon
function emailReminder2(firstName: string | null, items: CartItem[], subtotal: number, recoveryUrl: string) {
  const greeting = firstName ? `${firstName},` : 'Bonjour,'
  const body = `
<tr><td style="padding:36px 40px;color:#333;">
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 8px;">
    Vos parfums sont encore dans votre panier, mais les stocks ne sont pas garantis.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#555;">
    Ne laissez pas ces fragrances d'exception partir sans vous.
  </p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${itemsHtml(items)}
    <tr>
      <td style="padding:12px 15px;font-weight:700;color:#19110B;">Sous-total</td>
      <td style="padding:12px 15px;text-align:right;font-weight:700;color:#C9A962;font-size:17px;">${subtotal.toFixed(2)} €</td>
    </tr>
  </table>
  <div style="text-align:center;margin:30px 0;">
    ${ctaButton(recoveryUrl, 'Finaliser ma commande')}
  </div>
</td></tr>`
  return { subject: 'Vos parfums partent bientôt 🕐', html: emailWrapper(body, new Date().getFullYear()) }
}

// Rappel 3 — incentive avec code promo, 48h après abandon
function emailReminder3(firstName: string | null, items: CartItem[], subtotal: number, recoveryUrl: string, promoCode: string) {
  const greeting = firstName ? `${firstName},` : 'Bonjour,'
  const body = `
<tr><td style="padding:36px 40px;color:#333;">
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
    Dernier rappel — nous vous offrons <strong>10% de réduction</strong> pour finaliser votre commande aujourd'hui.
  </p>
  <div style="background:linear-gradient(135deg,#19110B 0%,#2a1d14 100%);padding:24px;border-radius:8px;text-align:center;margin:0 0 24px;">
    <p style="color:#C9A962;font-size:13px;letter-spacing:.15em;text-transform:uppercase;margin:0 0 8px;">Offre exclusive — 24h seulement</p>
    <p style="color:#fff;font-size:26px;font-weight:700;letter-spacing:.2em;margin:0 0 8px;">${promoCode}</p>
    <p style="color:#fff;font-size:16px;margin:0;">−10% sur votre commande</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${itemsHtml(items)}
    <tr>
      <td style="padding:12px 15px;font-weight:700;color:#19110B;">Sous-total</td>
      <td style="padding:12px 15px;text-align:right;font-weight:700;color:#C9A962;font-size:17px;">${subtotal.toFixed(2)} €</td>
    </tr>
  </table>
  <div style="text-align:center;margin:30px 0;">
    ${ctaButton(recoveryUrl, 'Profiter de mon offre')}
  </div>
  <p style="font-size:12px;color:#999;text-align:center;margin:0;">Code applicable au prochain écran · Expire dans 24h</p>
</td></tr>`
  return { subject: '−10% pour vous 🎁 Votre panier vous attend encore', html: emailWrapper(body, new Date().getFullYear()) }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    // Call mark_abandoned_carts() to keep status in sync
    await supabaseAdmin.rpc('mark_abandoned_carts')

    const now = Date.now()
    const results = { r1Sent: 0, r2Sent: 0, r3Sent: 0, errors: [] as string[] }

    if (!process.env.RESEND_API_KEY) {
      // Count what would be sent without Resend
      const { count: r1 } = await supabaseAdmin.from('active_carts').select('id', { count: 'exact', head: true })
        .eq('status', 'abandoned').is('reminder_1_sent_at', null).not('user_email', 'is', null).gt('item_count', 0)
      return NextResponse.json({
        success: true,
        message: `[MODE DÉMO] Resend non configuré. ${r1 ?? 0} paniers prêts pour rappel 1.`,
        demo: true,
      })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    // ── Reminder 1: 1h after abandoned, not yet reminded ─────────────────
    const r1Threshold = new Date(now - 60 * 60 * 1000).toISOString()

    const { data: r1Carts } = await supabaseAdmin
      .from('active_carts')
      .select('*')
      .eq('status', 'abandoned')
      .is('reminder_1_sent_at', null)
      .is('converted_at', null)
      .not('user_email', 'is', null)
      .gt('item_count', 0)
      .lt('abandoned_at', r1Threshold)
      .limit(50)

    for (const cart of r1Carts || []) {
      try {
        const { token, hash } = generateRecoveryToken()
        const tokenExpiry = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
        const recoveryUrl = `${BASE_URL}/cart/recover/${token}`

        const firstName = await getFirstName(cart.user_email)
        const { subject, html } = emailReminder1(firstName, cart.items || [], cart.subtotal || 0, recoveryUrl)

        const { error: sendErr } = await resend.emails.send({
          from: 'Braza Scent <noreply@brazascent.com>',
          to: cart.user_email,
          subject,
          html,
        })
        if (sendErr) { results.errors.push(`R1 ${cart.user_email}: ${sendErr.message}`); continue }

        await supabaseAdmin.from('active_carts').update({
          status: 'reminded',
          reminder_1_sent_at: new Date().toISOString(),
          recovery_token_hash: hash,
          recovery_token_expires_at: tokenExpiry,
        }).eq('id', cart.id)

        results.r1Sent++
      } catch (err) {
        results.errors.push(`R1 cart ${cart.id}: ${String(err)}`)
      }
    }

    // ── Reminder 2: 24h after abandoned, reminder_1 sent, not reminder_2 ─
    const r2Threshold = new Date(now - 24 * 60 * 60 * 1000).toISOString()

    const { data: r2Carts } = await supabaseAdmin
      .from('active_carts')
      .select('*')
      .in('status', ['abandoned', 'reminded'])
      .not('reminder_1_sent_at', 'is', null)
      .is('reminder_2_sent_at', null)
      .is('converted_at', null)
      .not('user_email', 'is', null)
      .gt('item_count', 0)
      .lt('abandoned_at', r2Threshold)
      .limit(50)

    for (const cart of r2Carts || []) {
      try {
        // Reuse or create recovery token
        let recoveryToken: string
        if (cart.recovery_token_hash && cart.recovery_token_expires_at && new Date(cart.recovery_token_expires_at) > new Date()) {
          // Can't reverse hash — issue a fresh token
          const { token, hash } = generateRecoveryToken()
          recoveryToken = token
          await supabaseAdmin.from('active_carts').update({
            recovery_token_hash: hash,
            recovery_token_expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq('id', cart.id)
        } else {
          const { token, hash } = generateRecoveryToken()
          recoveryToken = token
          await supabaseAdmin.from('active_carts').update({
            recovery_token_hash: hash,
            recovery_token_expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq('id', cart.id)
        }

        const recoveryUrl = `${BASE_URL}/cart/recover/${recoveryToken}`
        const firstName = await getFirstName(cart.user_email)
        const { subject, html } = emailReminder2(firstName, cart.items || [], cart.subtotal || 0, recoveryUrl)

        const { error: sendErr } = await resend.emails.send({
          from: 'Braza Scent <noreply@brazascent.com>',
          to: cart.user_email,
          subject,
          html,
        })
        if (sendErr) { results.errors.push(`R2 ${cart.user_email}: ${sendErr.message}`); continue }

        await supabaseAdmin.from('active_carts').update({
          status: 'reminded',
          reminder_2_sent_at: new Date().toISOString(),
        }).eq('id', cart.id)

        results.r2Sent++
      } catch (err) {
        results.errors.push(`R2 cart ${cart.id}: ${String(err)}`)
      }
    }

    // ── Reminder 3: 48h after abandoned, reminder_2 sent, not reminder_3 ─
    const r3Threshold = new Date(now - 48 * 60 * 60 * 1000).toISOString()

    const { data: r3Carts } = await supabaseAdmin
      .from('active_carts')
      .select('*')
      .in('status', ['abandoned', 'reminded'])
      .not('reminder_2_sent_at', 'is', null)
      .is('reminder_3_sent_at', null)
      .is('converted_at', null)
      .not('user_email', 'is', null)
      .gt('item_count', 0)
      .lt('abandoned_at', r3Threshold)
      .limit(50)

    for (const cart of r3Carts || []) {
      try {
        const promoCode = generatePromoCode()
        const promoExpiry = new Date(now + 24 * 60 * 60 * 1000)

        await supabaseAdmin.from('promo_codes').insert({
          code: promoCode,
          description: `Rappel panier abandonné — ${cart.user_email}`,
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 0,
          max_uses: 1,
          current_uses: 0,
          starts_at: new Date().toISOString(),
          expires_at: promoExpiry.toISOString(),
          is_active: true,
        })

        const { token, hash } = generateRecoveryToken()
        const recoveryUrl = `${BASE_URL}/cart/recover/${token}`

        const firstName = await getFirstName(cart.user_email)
        const { subject, html } = emailReminder3(firstName, cart.items || [], cart.subtotal || 0, recoveryUrl, promoCode)

        const { error: sendErr } = await resend.emails.send({
          from: 'Braza Scent <noreply@brazascent.com>',
          to: cart.user_email,
          subject,
          html,
        })
        if (sendErr) { results.errors.push(`R3 ${cart.user_email}: ${sendErr.message}`); continue }

        await supabaseAdmin.from('active_carts').update({
          status: 'reminded',
          reminder_3_sent_at: new Date().toISOString(),
          recovery_token_hash: hash,
          recovery_token_expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
          recovery_email_sent: true,
          recovery_email_sent_at: new Date().toISOString(),
          recovery_promo_code: promoCode,
        }).eq('id', cart.id)

        results.r3Sent++
      } catch (err) {
        results.errors.push(`R3 cart ${cart.id}: ${String(err)}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rappels envoyés — R1: ${results.r1Sent}, R2: ${results.r2Sent}, R3: ${results.r3Sent}`,
      ...results,
    })
  } catch (error) {
    console.error('Cron abandoned carts error:', error)
    return NextResponse.json({ error: 'Erreur cron paniers abandonnés' }, { status: 500 })
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getFirstName(email: string | null): Promise<string | null> {
  if (!email) return null
  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('first_name')
    .eq('email', email)
    .maybeSingle()
  return data?.first_name || null
}
