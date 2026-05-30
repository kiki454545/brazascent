import type { Metadata } from 'next'
import { faqCategories } from './_data'
import FAQClient from './FAQClient'

const SITE_URL = 'https://brazascent.com'

export const metadata: Metadata = {
  title: 'FAQ — Questions fréquentes sur les décants | Braza Scent',
  description: 'Toutes les réponses sur nos décants de parfum : commandes, livraison, qualité, formats 2ml 5ml 10ml. Braza Scent — échantillons authentiques.',
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: {
    title: 'FAQ | Braza Scent',
    description: 'Questions fréquentes sur nos décants de parfum — commandes, livraison, qualité.',
    url: `${SITE_URL}/faq`,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
}

export default function FAQPage() {
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: `${SITE_URL}/faq` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <FAQClient />
    </>
  )
}
