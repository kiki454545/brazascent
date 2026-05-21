import type { Metadata } from 'next'
import HommeClient from './HommeClient'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: 'Parfums Homme - Décants & échantillons',
  description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml. Boisés, frais, orientaux : testez les grandes maisons avant d\'investir. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/homme`,
  },
  openGraph: {
    title: 'Parfums Homme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml. Boisés, frais, orientaux : testez les grandes maisons avant d\'investir.',
    url: `${SITE_URL}/homme`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums Homme - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parfums Homme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums homme en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default function HommePage() {
  return <HommeClient />
}