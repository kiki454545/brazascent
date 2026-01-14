import Stripe from 'stripe'

// Client Stripe côté serveur
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
})

// Configuration des produits pour Stripe
export function formatAmountForStripe(amount: number): number {
  // Stripe utilise les centimes
  return Math.round(amount * 100)
}

export function formatAmountFromStripe(amount: number): number {
  // Convertir les centimes en euros
  return amount / 100
}
