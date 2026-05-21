import type { Metadata } from 'next'
import PromosClient from './PromosClient'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: 'Promos & Soldes - Parfums à prix réduits',
  description: 'Découvrez nos parfums de luxe et de niche en promotion. Décants 2ml, 5ml et 10ml à prix cassés. Offres limitées sur les plus grandes maisons de parfumerie.',
  alternates: {
    canonical: `${SITE_URL}/promos`,
  },
  openGraph: {
    title: 'Promos & Soldes - Parfums à prix réduits | Braza Scent',
    description: 'Découvrez nos parfums de luxe et de niche en promotion. Décants 2ml, 5ml et 10ml à prix cassés.',
    url: `${SITE_URL}/promos`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Promos Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Promos & Soldes - Parfums à prix réduits | Braza Scent',
    description: 'Découvrez nos parfums de luxe et de niche en promotion à prix cassés.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default function PromosPage() {
  return <PromosClient />
}