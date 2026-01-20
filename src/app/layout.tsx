import type { Metadata } from "next"
import { Cormorant_Garamond, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { SettingsProvider } from "@/components/SettingsProvider"
import { MainLayout } from "@/components/MainLayout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Braza Scent | Décants & Échantillons de Parfums de Luxe",
    template: "%s | Braza Scent",
  },
  description: "Décantage haut de gamme : décants et échantillons de parfums de niche et collection privée en format voyage. Découvrez des fragrances d'exception à moindre coût avec Brazascent. Livraison rapide et paiement sécurisé.",
  keywords: "décant parfum, échantillon parfum, parfum de niche, collection privée, parfum luxe, format voyage, Braza Scent, brazascent, parfumerie haut de gamme",
  authors: [{ name: "Braza Scent" }],
  creator: "Braza Scent",
  publisher: "Braza Scent",
  metadataBase: new URL("https://brazascent.com"),
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Braza Scent | Décants & Échantillons de Parfums de Luxe",
    description: "Décantage haut de gamme : décants et échantillons de parfums de niche et collection privée en format voyage. Découvrez des fragrances d'exception à moindre coût avec Brazascent.",
    type: "website",
    locale: "fr_FR",
    siteName: "Braza Scent",
    url: "https://brazascent.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Braza Scent | Décants & Échantillons de Parfums de Luxe",
    description: "Décantage haut de gamme : décants et échantillons de parfums de niche et collection privée en format voyage.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Ajouter ici les codes de vérification Google Search Console si nécessaire
    // google: "votre-code-verification",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className={`${cormorant.variable} ${montserrat.variable} antialiased`}>
        <GlobalErrorHandler>
          <ErrorBoundary>
            <AuthProvider>
              <SettingsProvider>
                <MainLayout>{children}</MainLayout>
              </SettingsProvider>
            </AuthProvider>
          </ErrorBoundary>
        </GlobalErrorHandler>
      </body>
    </html>
  )
}
