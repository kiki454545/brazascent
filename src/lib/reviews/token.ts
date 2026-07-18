import { randomBytes, createHash, createHmac } from 'crypto'

/**
 * Génère un token brut pour un lien d'avis vérifié — 32 octets aléatoires en
 * hexadécimal, même format que le token de récupération de panier abandonné
 * (src/app/api/cron/abandoned-carts/route.ts).
 */
export function generateReviewToken(): string {
  return randomBytes(32).toString('hex')
}

/** SHA-256 du token brut. C'est ce hash qui est stocké en base — jamais le token lui-même. */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/**
 * Normalise un numéro de téléphone français pour comparaison stable.
 * Même logique que la relance WhatsApp existante (admin/paniers/page.tsx) :
 * retire espaces/tirets/parenthèses/points, retire un "+" initial, puis 0X → 33X.
 */
export function normalizePhone(raw: string): string {
  let p = raw.replace(/[\s\-().]/g, '').replace(/^\+/, '')
  if (p.startsWith('0')) p = '33' + p.slice(1)
  return p
}

/**
 * Hash HMAC-SHA256 du téléphone normalisé, avec un secret serveur (PHONE_HASH_SECRET).
 * Un SHA-256 nu serait réversible par force brute sur l'espace réduit des numéros
 * français (~10^9 combinaisons) — le HMAC avec secret l'empêche même en cas d'accès
 * complet à la base. Retourne null si aucun téléphone n'est fourni.
 */
export function hashPhone(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  const secret = process.env.PHONE_HASH_SECRET
  if (!secret) {
    throw new Error(
      'PHONE_HASH_SECRET manquant — impossible de hasher un numéro de téléphone sans ce secret.'
    )
  }

  return createHmac('sha256', secret).update(normalizePhone(trimmed)).digest('hex')
}
