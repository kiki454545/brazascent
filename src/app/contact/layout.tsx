import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Support & Questions | Braza Scent',
  description: "Contactez Braza Scent pour toute question sur votre commande, la livraison ou nos parfums. Notre équipe vous répond rapidement.",
  alternates: { canonical: 'https://brazascent.com/contact' },
  openGraph: {
    title: 'Contact | Braza Scent',
    description: "Contactez Braza Scent pour toute question sur votre commande, la livraison ou nos parfums.",
    url: 'https://brazascent.com/contact',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
  twitter: {
    card: 'summary',
    title: 'Contact | Braza Scent',
    description: "Contactez Braza Scent pour toute question sur votre commande, la livraison ou nos parfums.",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
