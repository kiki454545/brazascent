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
