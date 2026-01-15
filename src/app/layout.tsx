import type { Metadata } from "next"
import { Cormorant_Garamond, Montserrat } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { SettingsProvider } from "@/components/SettingsProvider"
import { MainLayout } from "@/components/MainLayout"

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
  title: "Braza Scent | Maison de Parfumerie d'Exception",
  description: "Découvrez l'univers Braza Scent, maison de haute parfumerie française. Des créations uniques aux notes raffinées.",
  keywords: "parfum, parfumerie, luxe, fragrance, Braza Scent",
  openGraph: {
    title: "Braza Scent | Maison de Parfumerie d'Exception",
    description: "Découvrez l'univers Braza Scent, maison de haute parfumerie française.",
    type: "website",
    locale: "fr_FR",
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
        <AuthProvider>
          <SettingsProvider>
            <MainLayout>{children}</MainLayout>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
