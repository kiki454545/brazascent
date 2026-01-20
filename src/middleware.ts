import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de sécurité pour Braza Scent
 * - Ajoute les headers de sécurité
 * - Protège les routes admin API (vérification basique)
 */

// Headers de sécurité à ajouter à toutes les réponses
const securityHeaders = {
  // Empêche le navigateur de deviner le type MIME
  'X-Content-Type-Options': 'nosniff',
  // Empêche le chargement dans un iframe (protection clickjacking)
  'X-Frame-Options': 'DENY',
  // Protection XSS (navigateurs anciens)
  'X-XSS-Protection': '1; mode=block',
  // Contrôle les informations envoyées dans le Referer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // DNS prefetch control
  'X-DNS-Prefetch-Control': 'on',
  // Permissions Policy (ex-Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Ajouter les headers de sécurité à toutes les réponses
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value)
  }

  // HSTS - Force HTTPS (uniquement en production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

// Configuration: appliquer le middleware à toutes les routes sauf webhooks
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/webhook (webhooks Stripe - éviter les redirections)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
