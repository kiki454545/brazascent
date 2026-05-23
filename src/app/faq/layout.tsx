import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — Questions Fréquentes | Braza Scent',
  description: 'Toutes les réponses à vos questions sur les commandes, la livraison, les retours et les parfums Braza Scent.',
  openGraph: {
    title: 'Questions Fréquentes | Braza Scent',
    url: 'https://brazascent.com/faq',
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
