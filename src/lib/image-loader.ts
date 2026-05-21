export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  const q = quality ?? 75

  // Supabase Storage → Supabase Image Transformation API (gratuit, zéro quota Vercel)
  if (src.includes('/storage/v1/object/public/')) {
    const renderSrc = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    return `${renderSrc}?width=${width}&quality=${q}&resize=contain`
  }

  // Unsplash → paramètres de redimensionnement natifs du CDN (format WebP automatique)
  if (src.includes('images.unsplash.com')) {
    const base = src.split('?')[0]
    return `${base}?w=${width}&q=${q}&fm=webp&fit=crop`
  }

  // Fichiers locaux (hero WebP, favicon…) → servis tels quels
  return src
}
