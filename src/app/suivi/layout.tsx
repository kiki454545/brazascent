import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suivi de Commande | Braza Scent',
  description: 'Suivez votre commande Braza Scent en temps réel. Entrez votre numéro de commande pour connaître l\'état de votre livraison.',
  robots: { index: false },
}

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return children
}
