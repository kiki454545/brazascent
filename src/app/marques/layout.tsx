import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Toutes les Marques | Braza Scent',
  description: 'Découvrez toutes les grandes maisons de parfumerie disponibles chez Braza Scent. Creed, Maison Margiela, Xerjoff, Amouage et bien d\'autres.',
  openGraph: {
    title: 'Toutes les Marques de Parfums | Braza Scent',
    description: 'Les plus grandes maisons de parfumerie du monde, réunies chez Braza Scent.',
    url: 'https://brazascent.com/marques',
  },
}

export default function MarquesLayout({ children }: { children: React.ReactNode }) {
  return children
}
