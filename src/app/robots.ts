import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/compte/',
          '/checkout/',
          '/panier',
          '/favoris',
          '/reset-password',
          '/mot-de-passe-oublie',
        ],
      },
    ],
    sitemap: 'https://brazascent.com/sitemap.xml',
    host: 'https://brazascent.com',
  }
}