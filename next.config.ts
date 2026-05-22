import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Désactiver le trailing slash pour éviter les redirections 307 sur les webhooks
  trailingSlash: false,
  images: {
    // Loader personnalisé : Supabase → render API, Unsplash → CDN natif, local → brut
    // Aucun quota Vercel consommé (pas de passage par /_next/image)
    loaderFile: './src/lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mwbshveujthzcjpiraci.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
