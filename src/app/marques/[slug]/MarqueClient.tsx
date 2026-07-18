import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Building2, Package } from 'lucide-react'
import { Product } from '@/types'
import { ProductCard } from '@/components/ProductCard'
import { Benefits } from '@/components/Benefits'
import { generateBrandSeoText, BRAND_EXTRA_FAQ } from '@/lib/seo-content'

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
}

interface Props {
  brand: Brand
  products: Product[]
}

export default function MarqueClient({ brand, products }: Props) {
  const seo = generateBrandSeoText({
    brandName: brand.name,
    description: brand.description,
    products: products.map(p => ({
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      notes: p.notes,
    })),
  })
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[40vh] min-h-[240px] sm:min-h-[300px] overflow-hidden">
        {brand.logo ? (
          <Image
            src={brand.logo}
            alt={brand.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Maison
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 break-words">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-sm sm:text-lg font-light max-w-2xl mx-auto line-clamp-3 break-words">
                {brand.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="px-6 sm:px-10 lg:px-20 py-4">
          <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
            <Link href="/" className="text-muted-foreground hover:text-primary">
              Accueil
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link href="/marques" className="text-muted-foreground hover:text-primary">
              Marques
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground truncate">{brand.name}</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-light tracking-[0.1em] uppercase">
                Nos Parfums
              </h2>
              <p className="text-muted-foreground mt-2">
                {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
              </p>
            </div>
            <Link
              href="/marques"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Toutes les marques
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Aucun produit disponible pour cette marque
              </p>
              <p className="text-sm text-muted-foreground/60">
                Revenez bientôt pour découvrir nos nouveautés
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SEO section — contenu généré dynamiquement côté serveur */}
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-8">
            {seo.heading}
          </h2>

          <div className="text-muted-foreground leading-relaxed space-y-5 text-sm sm:text-base">
            <p>{seo.intro}</p>
            <p>{seo.styleOlfactif}</p>
            <p>{seo.pourquoiDecant}</p>
          </div>

          {/* Liens internes vers les produits de la marque */}
          {seo.productLinks.length > 0 && (
            <div className="mt-8">
              <p className="text-xs tracking-[0.2em] uppercase text-foreground mb-3">
                Dans notre sélection {brand.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {seo.productLinks.map(p => (
                  <Link
                    key={p.slug}
                    href={`/parfum/${p.slug}`}
                    className="text-sm border border-border px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 p-6 bg-background border border-border">
            <p className="text-sm tracking-[0.2em] uppercase text-primary mb-3">BrazaScent</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{seo.brazen}</p>
          </div>

          {/* FAQ générée dynamiquement */}
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {[...seo.faq, BRAND_EXTRA_FAQ].map(({ q, a }, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="text-primary ml-4 flex-shrink-0 text-xl leading-none group-open:rotate-45 transition-transform inline-block">+</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-foreground/60 italic">{seo.disclaimer}</p>
        </div>
      </section>

      <Benefits />
    </div>
  )
}
