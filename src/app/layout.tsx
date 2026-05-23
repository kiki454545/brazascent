import type { Metadata, Viewport } from "next"
import { DM_Serif_Display, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SettingsProvider } from "@/components/SettingsProvider"
import { MainLayout } from "@/components/MainLayout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler"
import { TrackingProvider } from "@/components/TrackingProvider"
import ClientMotionProvider from "@/components/ClientMotionProvider"
import { NewsletterPopup } from "@/components/NewsletterPopup"

const dmSerif = DM_Serif_Display({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400"],
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
    default: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    template: "%s | Braza Scent",
  },
  description: "Boutique de décants et échantillons de parfum — 2ml, 5ml, 10ml. Testez les plus grandes maisons de parfumerie (Dior, Chanel, MFK, Creed…) sans vous ruiner. Livraison rapide en France.",
  keywords: "décant parfum, échantillon parfum, decant parfum, boutique échantillon parfum, parfum 2ml, parfum 5ml, parfum 10ml, parfum de niche, Braza Scent, brazascent, testeur parfum",
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
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Décants et échantillons de parfum en 2ml, 5ml, 10ml. Testez les plus grandes maisons sans vous ruiner. Livraison rapide en France.",
    type: "website",
    locale: "fr_FR",
    siteName: "Braza Scent",
    url: "https://brazascent.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Décants et échantillons de parfum en 2ml, 5ml, 10ml. Testez les plus grandes maisons sans vous ruiner.",
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

export const viewport: Viewport = {
  themeColor: '#C9A84C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var stored = localStorage.getItem('brazascent-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Suit l'OS si pas de choix explicite, sinon respecte le choix sauvegardé
    var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
            `.trim(),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Braza Scent',
                url: 'https://brazascent.com',
                description: "Boutique de décants et échantillons de parfum — 2ml, 5ml, 10ml.",
                potentialAction: {
                  '@type': 'SearchAction',
                  target: { '@type': 'EntryPoint', urlTemplate: 'https://brazascent.com/parfums?search={search_term_string}' },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Navigation principale',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Parfums', url: 'https://brazascent.com/parfums' },
                  { '@type': 'ListItem', position: 2, name: 'Packs', url: 'https://brazascent.com/packs' },
                  { '@type': 'ListItem', position: 3, name: 'Marques', url: 'https://brazascent.com/marques' },
                  { '@type': 'ListItem', position: 4, name: 'Promos', url: 'https://brazascent.com/promos' },
                ],
              },
            ]),
          }}
        />
      </head>
      <body className={`${dmSerif.variable} ${montserrat.variable} antialiased`}>
        <GlobalErrorHandler>
          <ErrorBoundary>
            <ThemeProvider>
              <AuthProvider>
                <SettingsProvider>
                  <TrackingProvider>
                    <ClientMotionProvider>
                      <MainLayout>{children}</MainLayout>
                      <NewsletterPopup />
                    </ClientMotionProvider>
                  </TrackingProvider>
                </SettingsProvider>
              </AuthProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </GlobalErrorHandler>
      </body>
    </html>
  )
}
