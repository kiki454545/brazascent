import type { Metadata } from 'next'
import { faqCategories } from './_data'

export const metadata: Metadata = {
  title: 'FAQ — Questions Fréquentes | Braza Scent',
  description: 'Toutes les réponses à vos questions sur les commandes, la livraison, les retours et les parfums Braza Scent.',
  alternates: { canonical: 'https://brazascent.com/faq' },
  openGraph: {
    title: 'Questions Fréquentes | Braza Scent',
    description: 'Toutes les réponses à vos questions sur les commandes, la livraison, les retours et les parfums Braza Scent.',
    url: 'https://brazascent.com/faq',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
  twitter: {
    card: 'summary',
    title: 'Questions Fréquentes | Braza Scent',
    description: 'Toutes les réponses à vos questions sur les commandes, la livraison, les retours et les parfums Braza Scent.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqCategories.flatMap(cat =>
    cat.questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    }))
  ),
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
