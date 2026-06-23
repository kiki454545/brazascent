export function slugifyImageName(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['']/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function generateProductImageFilename(
  productName: string,
  brandName: string,
  originalFilename: string,
  index = 0
): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
  const slugName = slugifyImageName(productName)
  const slugBrand = slugifyImageName(brandName)
  const base = `decant-${slugName}-${slugBrand}`
  return index > 0 ? `${base}-${index + 1}.${ext}` : `${base}.${ext}`
}

type ImageAltContext = 'product-card' | 'product-hero' | 'cart' | 'brand-page'

export function generateProductImageAlt(
  productName: string,
  brandName: string,
  context: ImageAltContext = 'product-card'
): string {
  const brand = brandName ? ` ${brandName}` : ''
  switch (context) {
    case 'product-hero':
      return `Décant ${productName}${brand} — achetez en 2ml, 5ml, 10ml ou 30ml`
    case 'cart':
      return `${productName}${brand} — votre décant`
    case 'brand-page':
      return brandName
        ? `Parfums ${brandName} en décant — ${productName}`
        : `${productName} en décant`
    case 'product-card':
    default:
      return `Décant ${productName}${brand} — parfum en petite quantité`
  }
}
