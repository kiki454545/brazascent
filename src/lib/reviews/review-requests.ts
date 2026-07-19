import { SupabaseClient } from '@supabase/supabase-js'
import { generateReviewToken, hashToken, hashPhone } from './token'

const REVIEW_TOKEN_EXPIRY_DAYS = 90

// Domaines utilisés pour les données de test créées lors des validations Preview
// (Lots 2/3) — filet de sécurité pour ne jamais solliciter un avis sur une commande
// de test qui aurait échappé au nettoyage.
const TEST_EMAIL_SUFFIXES = ['@brazascent-internal.test']

export function isValidCustomerEmail(email: string | null | undefined): email is string {
  if (!email) return false
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return false
  if (TEST_EMAIL_SUFFIXES.some((suffix) => trimmed.endsWith(suffix))) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export interface ProductNeedingReview {
  productId: string
  productName: string
  productSlug: string
}

/**
 * Produits d'une commande n'ayant encore aucun avis (statut peu importe —
 * un avis refusé compte comme "déjà déposé", on ne redemande pas). Toujours
 * recalculé à la demande (jamais mis en cache) : c'est la seule source de
 * vérité, y compris pour la seconde relance qui doit exclure les produits
 * notés entre-temps.
 */
export async function getProductsNeedingReview(
  supabase: SupabaseClient,
  orderId: string
): Promise<ProductNeedingReview[]> {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_name')
    .eq('order_id', orderId)

  if (!items || items.length === 0) return []

  const productIds = [...new Set(items.map((i) => i.product_id).filter((id): id is string => !!id))]
  if (productIds.length === 0) return []

  const [{ data: existingReviews }, { data: products }] = await Promise.all([
    supabase.from('product_reviews').select('product_id').eq('order_id', orderId).in('product_id', productIds),
    supabase.from('products').select('id, slug').in('id', productIds),
  ])

  const reviewedProductIds = new Set((existingReviews || []).map((r) => r.product_id))
  const slugByProductId = new Map((products || []).map((p) => [p.id, p.slug]))

  const seen = new Set<string>()
  const result: ProductNeedingReview[] = []
  for (const item of items) {
    if (!item.product_id || reviewedProductIds.has(item.product_id) || seen.has(item.product_id)) continue
    const slug = slugByProductId.get(item.product_id)
    if (!slug) continue // produit introuvable/supprimé — pas de lien constructible, on l'ignore silencieusement
    seen.add(item.product_id)
    result.push({ productId: item.product_id, productName: item.product_name || 'Parfum', productSlug: slug })
  }
  return result
}

/**
 * Crée ou réutilise (upsert sur order_id+product_id+customer_email, la
 * contrainte unique du Lot 1) le token de review d'un produit. Le hash brut
 * n'est jamais persisté : chaque appel régénère un token brut frais et fait
 * pivoter le hash stocké, qu'une ligne existe déjà ou non. Comme un token
 * déjà utilisé implique forcément un avis déjà déposé (et donc un produit
 * déjà exclu par getProductsNeedingReview en amont), cette rotation ne peut
 * jamais écraser un token réellement utilisé.
 */
export async function issueReviewToken(
  supabase: SupabaseClient,
  params: { orderId: string; productId: string; customerEmail: string; customerPhone: string | null }
): Promise<string> {
  const rawToken = generateReviewToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + REVIEW_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const customerPhoneHash = hashPhone(params.customerPhone)

  const { error } = await supabase.from('review_tokens').upsert(
    {
      order_id: params.orderId,
      product_id: params.productId,
      customer_email: params.customerEmail,
      customer_phone_hash: customerPhoneHash,
      token_hash: tokenHash,
      expires_at: expiresAt,
    },
    { onConflict: 'order_id,product_id,customer_email' }
  )

  if (error) throw error
  return rawToken
}

export function extractOrderPhone(order: { shipping_address?: unknown } | null | undefined): string | null {
  const address = order?.shipping_address as { phone?: string } | null | undefined
  return address?.phone?.trim() || null
}

export function reviewUrlFor(rawToken: string): string {
  return `https://brazascent.com/avis/laisser?token=${rawToken}`
}
