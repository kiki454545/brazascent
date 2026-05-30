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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: "Qu'est-ce qu'une maison de parfumerie de niche ?", acceptedAnswer: { '@type': 'Answer', text: "Une maison de niche est une maison de parfumerie indépendante, souvent fondée par un nez ou un créateur visionnaire, qui privilégie la qualité des matières premières à la distribution de masse. Nos décants vous permettent de les découvrir facilement." } },
    { '@type': 'Question', name: "Pourquoi la parfumerie de niche coûte-t-elle si cher ?", acceptedAnswer: { '@type': 'Answer', text: "Les parfums de niche utilisent des matières premières rares et coûteuses (oud, rose centifolia, iris de Florence) à des concentrations élevées. Un flacon vaut souvent 150 à 500€. C'est précisément pour cette raison que nos décants sont précieux : ils vous donnent accès à ces créations sans engagement financier." } },
    { '@type': 'Question', name: "Comment trouver un parfum selon ma marque préférée ?", acceptedAnswer: { '@type': 'Answer', text: "Sélectionnez la marque dans notre catalogue — chaque page marque liste l'ensemble de nos décants disponibles pour cette maison. Vous pouvez également utiliser notre moteur de recherche ou notre quiz olfactif pour explorer selon votre profil." } },
  ],
}

export default function MarquesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  )
}
