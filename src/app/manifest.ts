import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Braza Scent',
    short_name: 'BrazaScent',
    description: 'Parfums de luxe et de niche en décants 2ml, 5ml et 10ml',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#C9A84C',
    orientation: 'portrait',
    categories: ['shopping', 'lifestyle'],
    lang: 'fr',
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
