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
  description: "Boutique de décants et échantillons de parfum — 2ml, 5ml, 10ml et 30ml. Testez les plus grandes maisons de parfumerie (Dior, Chanel, MFK, Creed…) sans vous ruiner. Livraison rapide en France.",
  keywords: "décant parfum, échantillon parfum, decant parfum, boutique échantillon parfum, parfum 2ml, parfum 5ml, parfum 10ml, parfum 30ml, parfum de niche, Braza Scent, brazascent, testeur parfum",
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
    description: "Décants et échantillons de parfum en 2ml, 5ml, 10ml et 30ml. Testez les plus grandes maisons sans vous ruiner. Livraison rapide en France.",
    type: "website",
    locale: "fr_FR",
    siteName: "Braza Scent",
    url: "https://brazascent.com",
    images: [{ url: "https://brazascent.com/og-image.png", width: 1200, height: 630, alt: "Braza Scent — Décants de parfum" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Braza Scent | Boutique d'Échantillons de Parfum & Décants",
    description: "Décants et échantillons de parfum en 2ml, 5ml, 10ml et 30ml. Testez les plus grandes maisons sans vous ruiner.",
    images: ["https://brazascent.com/og-image.png"],
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
    google: process.env.GOOGLE_SITE_VERIFICATION,
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
        {/* Préconnexion Supabase — sans crossOrigin pour correspondre au mode credentials des fetch Supabase */}
        <link rel="preconnect" href="https://mwbshveujthzcjpiraci.supabase.co" />
        <link rel="dns-prefetch" href="https://mwbshveujthzcjpiraci.supabase.co" />
        {/* CSS critique inliné — variables de thème + tokens Tailwind v4 + base body/headings.
            Évite le FOUC pendant le chargement du chunk CSS Tailwind (17,9 KB).
            Le reste (animations, scrollbar, admin, hover) reste dans globals.css. */}
        <style dangerouslySetInnerHTML={{ __html: `
:root{--background:#FFFFFF;--foreground:#0A0A0A;--cream:#F5F5F5;--muted:#F0F0F0;--muted-foreground:#666666;--border:#E5E5E5;--primary:#BF9952;--primary-foreground:#0A0A0A;--primary-text:#896C22;--gold:#BF9952;--gold-light:#E0C898;--gold-dark:#8F7038;--charcoal:#0A0A0A;--color-background:var(--background);--color-foreground:var(--foreground);--color-primary:var(--primary);--color-primary-foreground:var(--primary-foreground);--color-primary-text:var(--primary-text);--color-cream:var(--cream);--color-muted:var(--muted);--color-muted-foreground:var(--muted-foreground);--color-border:var(--border);--color-gold:var(--gold);--color-gold-light:var(--gold-light);--color-gold-dark:var(--gold-dark);--color-charcoal:var(--charcoal);--font-sans:var(--font-montserrat);--font-serif:var(--font-serif-display)}
.dark{--background:#000000;--foreground:#FAFAFA;--cream:#141414;--muted:#0D0D0D;--muted-foreground:#A3A3A3;--border:#262626;--primary:#D4AF6B;--primary-foreground:#0A0A0A;--primary-text:#D4AF6B;--gold:#D4AF6B;--gold-light:#E0C898;--gold-dark:#8F7038;--charcoal:#FAFAFA}
body{background:var(--background);color:var(--foreground);font-family:var(--font-montserrat),system-ui,-apple-system,sans-serif}
h1,h2,h3,h4,h5,h6{font-family:var(--font-serif-display),Georgia,serif;letter-spacing:.01em}
        ` }} />
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
                description: "Boutique de décants et échantillons de parfum — 2ml, 5ml, 10ml et 30ml.",
                potentialAction: {
                  '@type': 'SearchAction',
                  target: { '@type': 'EntryPoint', urlTemplate: 'https://brazascent.com/parfums?search={search_term_string}' },
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Braza Scent',
                url: 'https://brazascent.com',
                logo: 'https://brazascent.com/logo.png',
                description: "Boutique de décants et échantillons de parfum — 2ml, 5ml, 10ml et 30ml. Testez les plus grandes maisons de parfumerie sans vous ruiner.",
                sameAs: [
                  'https://www.tiktok.com/@braza.scent',
                  'https://snapchat.com/t/RIDz6Z16',
                ],
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
