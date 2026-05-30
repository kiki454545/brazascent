import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Packs Décants Parfum Premium | Braza Scent',
  description: "Découvrez nos packs de décants parfum premium — sélections curatées de fragrances en 2ml, 5ml, 10ml. Dior, Chanel, MFK, Creed… Livraison rapide en France.",
  alternates: { canonical: 'https://brazascent.com/packs' },
  openGraph: {
    title: 'Packs Décants Parfum Premium | Braza Scent',
    description: "Découvrez nos packs de décants parfum premium — sélections curatées de fragrances en 2ml, 5ml, 10ml.",
    url: 'https://brazascent.com/packs',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
    images: [{ url: 'https://brazascent.com/images/packs-hero.webp', width: 1200, height: 630, alt: 'Packs Décants Parfum — Braza Scent' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Packs Décants Parfum Premium | Braza Scent',
    description: "Découvrez nos packs de décants parfum premium — sélections curatées de fragrances en 2ml, 5ml, 10ml.",
    images: ['https://brazascent.com/images/packs-hero.webp'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: "C'est quoi un pack de décants ?", acceptedAnswer: { '@type': 'Answer', text: "Un pack de décants est une sélection de plusieurs échantillons de parfums authentiques réunis sous un thème commun (famille olfactive, occasion, intensité). Chaque décant est prélevé depuis le flacon d'origine de la marque. C'est la façon la plus économique d'explorer plusieurs fragrances." } },
    { '@type': 'Question', name: "Les packs sont-ils adaptés pour offrir ?", acceptedAnswer: { '@type': 'Answer', text: "Oui. Nos packs sont pensés comme des coffrets premium — idéaux pour offrir une expérience olfactive sans risquer de se tromper de fragrance. Le destinataire peut tester chaque parfum et choisir son préféré en connaissance de cause." } },
    { '@type': 'Question', name: "Puis-je personnaliser un pack ?", acceptedAnswer: { '@type': 'Answer', text: "Actuellement nos packs sont des sélections fixes curatées par nos soins. Si vous avez une demande particulière — un thème olfactif, une occasion spéciale — n'hésitez pas à nous contacter via notre formulaire de contact." } },
    { '@type': 'Question', name: "Les parfums des packs sont-ils les mêmes qu'en fiche individuelle ?", acceptedAnswer: { '@type': 'Answer', text: "Oui. Les décants inclus dans nos packs sont strictement identiques aux décants vendus individuellement — même produit, même concentration, même origine. La seule différence est le conditionnement groupé." } },
  ],
}

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  )
}
