/**
 * Rate Limiting simple en mémoire pour les API routes
 * Note: En production avec plusieurs instances, utilisez Redis (Upstash)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store en mémoire (pour une instance unique)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Nettoyer les entrées expirées toutes les minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

interface RateLimitConfig {
  /** Nombre maximum de requêtes */
  limit: number
  /** Fenêtre de temps en secondes */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

/**
 * Vérifie si une requête est autorisée selon le rate limit
 * @param identifier - Identifiant unique (IP, userId, etc.)
 * @param config - Configuration du rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  // Nouvelle entrée ou entrée expirée
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    })
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    }
  }

  // Incrémenter le compteur
  entry.count++

  // Vérifier si la limite est dépassée
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  }
}

/**
 * Obtient l'IP du client depuis les headers
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Real IP header
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return 'unknown'
}

// Configurations prédéfinies pour différents types d'endpoints
export const RATE_LIMITS = {
  // API de validation de code promo: 10 tentatives par minute
  PROMO_VALIDATE: { limit: 10, windowSeconds: 60 },

  // Checkout: 5 tentatives par minute
  CHECKOUT: { limit: 5, windowSeconds: 60 },

  // Création de tickets: 3 par minute
  TICKETS: { limit: 3, windowSeconds: 60 },

  // Newsletter send (admin): 2 par minute
  NEWSLETTER: { limit: 2, windowSeconds: 60 },

  // API générale: 100 requêtes par minute
  GENERAL: { limit: 100, windowSeconds: 60 },
}
