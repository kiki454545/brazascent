import type { Metadata } from 'next'
import { LinksClient } from './LinksClient'

export const metadata: Metadata = {
  title: 'Liens officiels BrazaScent | Boutique, TikTok & Snapchat',
  description:
    'Retrouvez tous les liens officiels BrazaScent : boutique, packs découverte, TikTok, Snapchat, contact et suivi de commande.',
  alternates: {
    canonical: 'https://brazascent.com/links',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Liens officiels BrazaScent',
    description:
      'Boutique de décants premium, packs découverte, TikTok, Snapchat, contact et suivi commande.',
    url: 'https://brazascent.com/links',
    siteName: 'BrazaScent',
    images: [
      {
        url: '/favicon.png',
        width: 512,
        height: 512,
        alt: 'BrazaScent',
      },
    ],
    type: 'website',
  },
}

export default function LinksPage() {
  return <LinksClient />
}
