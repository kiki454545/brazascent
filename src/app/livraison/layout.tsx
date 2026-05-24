import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Livraison — Délais & Tarifs | Braza Scent',
  description: 'Informations sur la livraison Braza Scent : délais, tarifs, livraison offerte selon seuil. Mondial Relay, Chronopost, suivi en ligne.',
  openGraph: {
    title: 'Livraison | Braza Scent',
    url: 'https://brazascent.com/livraison',
  },
}

export default function LivraisonLayout({ children }: { children: React.ReactNode }) {
  return children
}
