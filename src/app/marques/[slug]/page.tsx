import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import MarqueClient from './MarqueClient'

const SITE_URL = 'https://brazascent.com'

// Client Supabase pour le fetch côté serveur (metadata)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Régénération des metadata toutes les heures
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const { data: brand } = await supabase
      .from('brands')
      .select('name, description, logo')
      .eq('slug', slug)
      .single()

    if (!brand) {
      return {
        title: 'Marque introuvable',
        description: "Cette marque n'est pas disponible pour le moment.",
      }
    }

    const title = `Parfums ${brand.name} - Décants & échantillons`

    const description = brand.description
      ? brand.description.substring(0, 160).trim() + (brand.description.length > 160 ? '...' : '')
      : `Découvrez la collection ${brand.name} en décants 2ml, 5ml et 10ml sur Braza Scent. Testez les parfums ${brand.name} avant d'investir. Livraison rapide en France.`

    const image = brand.logo || `${SITE_URL}/images/parfums-hero.jpg`

    const canonicalUrl = `${SITE_URL}/marques/${slug}`

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title} | Braza Scent`,
        description,
        url: canonicalUrl,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'Braza Scent',
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: `Parfums ${brand.name} - Braza Scent`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Braza Scent`,
        description,
        images: [image],
      },
    }
  } catch (error) {
    console.error('Erreur generateMetadata marque:', error)
    return {
      title: 'Marque',
      description: 'Découvrez nos parfums par marque sur Braza Scent.',
    }
  }
}

export default function MarquePage() {
  return <MarqueClient />
}