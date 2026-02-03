import type { Metadata } from "next"
import { Cormorant_Garamond, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { SettingsProvider } from "@/components/SettingsProvider"
import { MainLayout } from "@/components/MainLayout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler"
import { TrackingProvider } from "@/components/TrackingProvider"

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
    default: "Braza Scent | Boutique de Parfums de Luxe",
    template: "%s | Braza Scent",
  },
  description: "Boutique en ligne de parfums haut de gamme. Découvrez notre sélection de fragrances de niche disponibles en formats 2ml, 5ml et 10ml. Testez les plus grandes maisons de parfumerie sans vous ruiner. Livraison rapide en France.",
  keywords: "parfum, boutique parfum, décant parfum, échantillon parfum, parfum de niche, 2ml, 5ml, 10ml, parfum luxe, Braza Scent, brazascent, parfumerie",
  authors: [{ name: "Braza Scent" }],
  creator: "Braza Scent",
  publisher: "Braza Scent",
  metadataBase: new URL("https://brazascent.com"),
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Braza Scent | Boutique de Parfums de Luxe",
    description: "Boutique en ligne de parfums haut de gamme. Découvrez notre sélection de fragrances de niche disponibles en formats 2ml, 5ml et 10ml. Testez les plus grandes maisons sans vous ruiner.",
    type: "website",
    locale: "fr_FR",
    siteName: "Braza Scent",
    url: "https://brazascent.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Braza Scent | Boutique de Parfums de Luxe",
    description: "Boutique en ligne de parfums haut de gamme. Fragrances de niche en formats 2ml, 5ml et 10ml.",
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
                <TrackingProvider>
                  <MainLayout>{children}</MainLayout>
                </TrackingProvider>
              </SettingsProvider>
            </AuthProvider>
          </ErrorBoundary>
        </GlobalErrorHandler>
      </body>
    </html>
  )
}
