import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Building2, Package } from 'lucide-react'
import { Product } from '@/types'
import { ProductCard } from '@/components/ProductCard'
import { Benefits } from '@/components/Benefits'

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

      {/* SEO section */}
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">
            Découvrir {brand.name} en décants
          </h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              Tester un parfum {brand.name} en décant, c&apos;est s&apos;offrir la liberté de vivre la fragrance sur votre peau pendant plusieurs jours — avant tout investissement dans un flacon complet. Nos décants authentiques sont prélevés directement depuis les flacons d&apos;origine, sans dilution ni reformulation.
            </p>
            <p>
              Chaque décant BrazaScent est soigneusement conditionné et expédié sous 24 à 48h. Explorez l&apos;univers {brand.name} en format 2ml, 5ml ou 10ml, selon votre curiosité.
            </p>
            <p className="text-xs text-muted-foreground/70 italic">
              BrazaScent est indépendant et n&apos;est pas affilié à {brand.name}. Les noms de marques sont utilisés uniquement à titre informatif pour identifier les produits.
            </p>
          </div>
          <div className="mt-10 p-6 bg-background border border-border">
            <p className="text-sm tracking-[0.2em] uppercase text-primary mb-3">Notre blog parfum</p>
            <p className="text-muted-foreground text-sm mb-5">
              Conseils sur les décants, guides olfactifs, sélections thématiques — retrouvez nos articles pour approfondir votre découverte de la parfumerie.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-foreground border border-foreground px-5 py-3 hover:bg-foreground hover:text-background transition-colors"
            >
              Lire le blog
            </Link>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {[
                { q: `Les parfums ${brand.name} chez BrazaScent sont-ils authentiques ?`, a: `Oui. Nos décants ${brand.name} sont préparés à partir de flacons originaux achetés auprès de revendeurs officiels. Vous recevez le parfum authentique de la marque, dans sa concentration d'origine, sans aucune modification.` },
                { q: "C'est quoi un décant de parfum ?", a: "Un décant est un prélèvement du parfum original effectué directement depuis le flacon de la marque. Vous recevez la même fragrance que le flacon plein — sans dilution — dans un format de 2ml, 5ml ou 10ml. Idéal pour tester avant d'acheter." },
                { q: "Pourquoi choisir un décant plutôt qu'un flacon complet ?", a: "Un flacon plein représente souvent un investissement de 100 à 400€. Un décant vous permet de tester le parfum sur votre peau pendant plusieurs semaines avant de vous décider. La décision d'achat devient une certitude, pas un pari à l'aveugle." },
              ].map(({ q, a }, i) => (
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
        </div>
      </section>

      <Benefits />
    </div>
  )
}
