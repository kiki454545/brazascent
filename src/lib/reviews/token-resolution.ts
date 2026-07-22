import { SupabaseClient } from '@supabase/supabase-js'

export type TokenKind = 'order' | 'social'
export type TokenState = 'expired' | 'used' | 'disabled' | 'valid'

export interface ResolvedToken {
  kind: TokenKind
  id: string
  productId: string
  state: TokenState
}

function computeState(expiresAt: string, usedAt: string | null, disabledAt: string | null): TokenState {
  if (disabledAt) return 'disabled'
  if (usedAt) return 'used'
  if (new Date(expiresAt) < new Date()) return 'expired'
  return 'valid'
}

/**
 * Détermine si un token_hash appartient à review_tokens (avis vérifié, lié à
 * une commande — Lot 1) ou à manual_review_requests (avis social manuel,
 * Lot 6.5), sans jamais faire confiance à une indication fournie par le
 * client : la détection se fait uniquement en base, côté serveur, avec le
 * client service-role (les deux tables sont verrouillées en RLS pour
 * anon/authenticated). Retourne null si le hash n'existe dans aucune des
 * deux tables.
 */
export async function resolveReviewToken(
  supabase: SupabaseClient,
  tokenHash: string
): Promise<ResolvedToken | null> {
  const { data: orderToken } = await supabase
    .from('review_tokens')
    .select('id, product_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (orderToken) {
    return {
      kind: 'order',
      id: orderToken.id,
      productId: orderToken.product_id,
      state: computeState(orderToken.expires_at, orderToken.used_at, null),
    }
  }

  const { data: socialRequest } = await supabase
    .from('manual_review_requests')
    .select('id, product_id, expires_at, used_at, disabled_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (socialRequest) {
    return {
      kind: 'social',
      id: socialRequest.id,
      productId: socialRequest.product_id,
      state: computeState(socialRequest.expires_at, socialRequest.used_at, socialRequest.disabled_at),
    }
  }

  return null
}

/**
 * Message public générique pour un état de token invalide — ne révèle
 * jamais de quelle table (review_tokens / manual_review_requests) provient
 * le token, ni aucun détail SQL.
 */
export function publicMessageForState(state: TokenState): { status: number; message: string } {
  switch (state) {
    case 'expired':
      return { status: 410, message: 'Ce lien a expiré.' }
    case 'used':
      return { status: 409, message: 'Un avis a déjà été déposé avec ce lien.' }
    case 'disabled':
      return { status: 409, message: "Ce lien n'est plus valide." }
    default:
      return { status: 404, message: "Ce lien d'avis n'est pas valide." }
  }
}
