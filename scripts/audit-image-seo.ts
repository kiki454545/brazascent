/**
 * Audit SEO image quality across BrazaScent products.
 *
 * Usage: npx tsx scripts/audit-image-seo.ts
 *
 * Reports:
 * - Products with non-SEO image filenames (timestamp-based)
 * - Products with no images
 * - Images not following decant-{name}-{brand} pattern
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SEO_PATTERN = /^decant-[a-z0-9-]+-[a-z0-9-]+(-\d+)?\.(jpg|jpeg|webp|png|avif)$/

function extractFilename(url: string): string {
  return url.split('/').pop()?.split('?')[0] ?? url
}

function isSeoFilename(filename: string): boolean {
  return SEO_PATTERN.test(filename)
}

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, brand, slug, images, is_active')
    .order('name')

  if (error) {
    console.error('Supabase error:', error.message)
    process.exit(1)
  }

  const noImages: typeof products = []
  const nonSeoImages: Array<{ name: string; brand: string; slug: string; files: string[] }> = []
  let totalImages = 0
  let seoImages = 0

  for (const p of products ?? []) {
    const images: string[] = p.images ?? []

    if (images.length === 0) {
      noImages.push(p)
      continue
    }

    const badFiles: string[] = []
    for (const url of images) {
      totalImages++
      const filename = extractFilename(url)
      if (isSeoFilename(filename)) {
        seoImages++
      } else {
        badFiles.push(filename)
      }
    }

    if (badFiles.length > 0) {
      nonSeoImages.push({ name: p.name, brand: p.brand ?? '', slug: p.slug, files: badFiles })
    }
  }

  console.log('\n══════════ BrazaScent — Audit SEO Images ══════════\n')

  console.log(`Total produits : ${products?.length ?? 0}`)
  console.log(`Total images   : ${totalImages}`)
  console.log(`Images SEO-ok  : ${seoImages}/${totalImages} (${totalImages > 0 ? Math.round((seoImages / totalImages) * 100) : 0}%)`)

  if (noImages.length > 0) {
    console.log(`\n⚠️  Produits sans image (${noImages.length}) :`)
    for (const p of noImages) {
      console.log(`   - [${p.is_active ? 'actif' : 'inactif'}] ${p.name} (${p.brand}) → /parfum/${p.slug}`)
    }
  }

  if (nonSeoImages.length > 0) {
    console.log(`\n🔴 Images non-SEO (${nonSeoImages.length} produits) :`)
    for (const p of nonSeoImages) {
      console.log(`\n   ${p.name} — ${p.brand} (/parfum/${p.slug})`)
      for (const f of p.files) {
        const expected = `decant-${p.name.toLowerCase().replace(/\s+/g, '-')}-${p.brand.toLowerCase().replace(/\s+/g, '-')}.ext`
        console.log(`     ✗ ${f}`)
        console.log(`       → devrait ressembler à : ${expected}`)
      }
    }
  }

  if (nonSeoImages.length === 0 && noImages.length === 0) {
    console.log('\n✅ Toutes les images respectent la convention SEO !')
  }

  console.log('\n═══════════════════════════════════════════════════\n')
}

main().catch(console.error)
