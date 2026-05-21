import type { Metadata } from 'next'
import FemmeClient from './FemmeClient'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: 'Parfums Femme - Décants & échantillons',
  description: 'Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml. Floraux, fruités, orientaux : testez les grandes maisons avant d\'investir. Livraison rapide en France.',
  alternates: {
    canonical: `${SITE_URL}/femme`,
  },
  openGraph: {
    title: 'Parfums Femme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml. Floraux, fruités, orientaux : testez les grandes maisons avant d\'investir.',
    url: `${SITE_URL}/femme`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [
      {
        url: `${SITE_URL}/images/parfums-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Parfums Femme - Braza Scent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parfums Femme - Décants & échantillons | Braza Scent',
    description: 'Découvrez notre sélection de parfums femme en décants 2ml, 5ml et 10ml.',
    images: [`${SITE_URL}/images/parfums-hero.jpg`],
  },
}

export default function FemmePage() {
  return <FemmeClient />
}