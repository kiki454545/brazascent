import Stripe from 'stripe'

// Client Stripe côté serveur
// La clé est optionnelle pour permettre le build sans Stripe configuré
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
      typescript: true,
    })
  : null as unknown as Stripe

// Configuration des produits pour Stripe
export function formatAmountForStripe(amount: number): number {
  // Stripe utilise les centimes
  return Math.round(amount * 100)
}

export function formatAmountFromStripe(amount: number): number {
  // Convertir les centimes en euros
  return amount / 100
}
