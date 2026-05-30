import type { Metadata } from 'next'
import { AvisClient } from './AvisClient'

export const metadata: Metadata = {
  title: 'Avis clients | Braza Scent',
  description:
    'Découvrez les avis de nos clients sur nos décants premium. Notes, commentaires et retours d\'expérience sur nos parfums de niche.',
  alternates: { canonical: 'https://brazascent.com/avis' },
  openGraph: {
    title: 'Avis clients | Braza Scent',
    description: 'Ce que nos clients pensent de nos décants premium — notes et commentaires vérifiés.',
    url: 'https://brazascent.com/avis',
    siteName: 'BrazaScent',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function AvisPage() {
  return <AvisClient />
}
