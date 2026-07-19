import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getProductsNeedingReview, isValidCustomerEmail } from '@/lib/reviews/review-requests'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Lot 4 : planificateur ────────────────────────────────────────────────────
// Ce cron ne fait plus qu'une chose : décider quelles commandes doivent
// recevoir une demande d'avis (1re demande ou relance) et créer LA ligne
// correspondante dans post_purchase_emails (source de vérité unique). Il
// n'envoie plus aucun email lui-même — c'est le rôle exclusif du cron
// /api/cron/post-purchase-emails (l'expéditeur). Les tokens de review ne sont
// créés qu'au moment de l'envoi réel (voir issueReviewToken), jamais ici.
//
// Chaque commande éligible reçoit AU PLUS une ligne par vague
// (reminder_number 1 puis 2, jamais 3) : la présence d'une ligne existante
// (quel que soit son statut) suffit à exclure la commande de cette vague,
// ce qui protège contre la double planification même en cas d'exécutions
// concurrentes — le filet de sécurité définitif contre le double envoi
// reste néanmoins côté expéditeur (voir post-purchase-emails).

const FIRST_REQUEST_DELIVERED_DAYS = 5
const FIRST_REQUEST_PAID_FALLBACK_DAYS = 10
const REMINDER_DELAY_AFTER_SENT_DAYS = 7
const MAX_ORDERS_PER_RUN = 100

interface CandidateOrder {
  id: string
  status: string
  payment_status: string | null
  customer_email: string | null
  delivered_at: string | null
  created_at: string
}

function requireCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // aucun secret configuré — comportement historique conservé
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    if (!requireCronSecret(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const scheduledFirst = await scheduleFirstRequests()
    const scheduledReminders = await scheduleReminders()

    return NextResponse.json({
      success: true,
      firstRequests: scheduledFirst,
      reminders: scheduledReminders,
    })
  } catch (error) {
    console.error('Cron review-requests (planificateur) error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function scheduleFirstRequests() {
  const now = Date.now()
  const deliveredThreshold = new Date(now - FIRST_REQUEST_DELIVERED_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const paidThreshold = new Date(now - FIRST_REQUEST_PAID_FALLBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const SELECT = 'id, status, payment_status, customer_email, delivered_at, created_at'

  const { data: deliveredOrders } = await supabaseAdmin
    .from('orders')
    .select(SELECT)
    .eq('status', 'completed')
    .not('delivered_at', 'is', null)
    .lte('delivered_at', deliveredThreshold)
    .limit(MAX_ORDERS_PER_RUN)

  const { data: fallbackOrders } = await supabaseAdmin
    .from('orders')
    .select(SELECT)
    .is('delivered_at', null)
    .eq('payment_status', 'completed')
    .not('status', 'in', '("cancelled","refunded")')
    .lte('created_at', paidThreshold)
    .limit(MAX_ORDERS_PER_RUN)

  const seen = new Set<string>()
  const candidates: CandidateOrder[] = [...(deliveredOrders || []), ...(fallbackOrders || [])].filter((o) => {
    if (seen.has(o.id)) return false
    seen.add(o.id)
    return !['cancelled', 'refunded'].includes(o.status)
  })

  return scheduleWave(candidates, 1)
}

async function scheduleReminders() {
  const cutoff = new Date(Date.now() - REMINDER_DELAY_AFTER_SENT_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: sentFirstRequests } = await supabaseAdmin
    .from('post_purchase_emails')
    .select('order_id')
    .eq('email_type', 'review_request')
    .eq('reminder_number', 1)
    .eq('status', 'sent')
    .lte('sent_at', cutoff)
    .limit(MAX_ORDERS_PER_RUN)

  const orderIds = [...new Set((sentFirstRequests || []).map((r) => r.order_id))]
  if (orderIds.length === 0) return { scheduled: 0, skipped: 0 }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status, customer_email, delivered_at, created_at')
    .in('id', orderIds)

  const candidates = (orders || []).filter((o) => !['cancelled', 'refunded'].includes(o.status))

  return scheduleWave(candidates, 2)
}

async function scheduleWave(candidates: CandidateOrder[], reminderNumber: 1 | 2) {
  if (candidates.length === 0) return { scheduled: 0, skipped: 0 }

  const candidateIds = candidates.map((c) => c.id)

  // Exclut les commandes ayant déjà une ligne pour cette vague, quel qu'en soit le statut.
  const { data: existingRows } = await supabaseAdmin
    .from('post_purchase_emails')
    .select('order_id')
    .eq('email_type', 'review_request')
    .eq('reminder_number', reminderNumber)
    .in('order_id', candidateIds)

  const alreadyScheduled = new Set((existingRows || []).map((r) => r.order_id))
  const toSchedule = candidates.filter((o) => !alreadyScheduled.has(o.id))

  let scheduled = 0
  let skipped = 0

  for (const order of toSchedule) {
    if (!isValidCustomerEmail(order.customer_email)) {
      if (await insertRow(order, reminderNumber, 'skipped', 'invalid_or_missing_email')) skipped++
      continue
    }

    const productsNeedingReview = await getProductsNeedingReview(supabaseAdmin, order.id)
    if (productsNeedingReview.length === 0) {
      if (await insertRow(order, reminderNumber, 'skipped', 'no_products_remaining')) skipped++
      continue
    }

    if (await insertRow(order, reminderNumber, 'pending', null)) scheduled++
  }

  return { scheduled, skipped }
}

// email est NOT NULL en base : une commande sans email valide doit tout de
// même produire une ligne 'skipped' traçable, donc on retombe sur une chaîne
// vide plutôt que null dans ce cas précis (jamais utilisée pour un envoi,
// le statut 'skipped' empêche tout traitement par l'expéditeur).
async function insertRow(
  order: CandidateOrder,
  reminderNumber: 1 | 2,
  status: 'pending' | 'skipped',
  errorMessage: string | null
): Promise<boolean> {
  const { error } = await supabaseAdmin.from('post_purchase_emails').insert({
    order_id: order.id,
    email_type: 'review_request',
    email: order.customer_email || '',
    reminder_number: reminderNumber,
    channel: 'email',
    scheduled_for: new Date().toISOString(),
    status,
    sent_at: status === 'skipped' ? new Date().toISOString() : null,
    error_message: errorMessage,
  })

  if (error) {
    console.error(`Error scheduling review request for order ${order.id.slice(0, 8)}…:`, error.message)
    return false
  }
  return true
}
