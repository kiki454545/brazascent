import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import PackClient from './PackClient'

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
    const { data: pack } = await supabase
      .from('packs')
      .select('name, description, image, price')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!pack) {
      return {
        title: 'Pack introuvable',
        description: "Ce pack n'est pas disponible pour le moment.",
      }
    }

    const title = pack.name.toLowerCase().startsWith('pack')
  ? pack.name
  : `Pack ${pack.name}`
  

    const description = pack.description
      ? pack.description.substring(0, 160).trim() + (pack.description.length > 160 ? '...' : '')
      : `Découvrez le pack ${pack.name} sur Braza Scent. Une sélection de parfums à prix avantageux. Livraison rapide en France.`

    const image = pack.image || `${SITE_URL}/images/packs-hero.jpg`

    const canonicalUrl = `${SITE_URL}/packs/${slug}`

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
            alt: `Pack ${pack.name} - Braza Scent`,
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
    console.error('Erreur generateMetadata pack:', error)
    return {
      title: 'Pack',
      description: 'Découvrez nos packs de parfums sur Braza Scent.',
    }
  }
}

export default function PackPage() {
  return <PackClient />
}