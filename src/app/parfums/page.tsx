import type { Metadata } from 'next'
import ParfumsClient from './ParfumsClient'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml',
  description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/parfums`,
  },
  openGraph: {
    title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner.',
    url: `${SITE_URL}/parfums`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums de niche et de luxe - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tous nos parfums - Décants 2ml, 5ml, 10ml | Braza Scent',
    description: 'Découvrez notre sélection de parfums de niche et de luxe en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default function ParfumsPage() {
  return <ParfumsClient />
}