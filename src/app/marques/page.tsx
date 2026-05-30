import Image from 'next/image'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Benefits } from '@/components/Benefits'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
}

export default async function MarquesPage() {
  const { data } = await supabase
    .from('brands')
    .select('id, name, slug, description, logo')
    .order('name', { ascending: true })

  const brands: Brand[] = data || []

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[360px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1592765213186-912a7504662d?w=1920&q=90"
          alt="Nos Marques"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Maisons
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4">
              Nos Marques
            </h1>
            <p className="text-sm sm:text-lg font-light max-w-xl mx-auto">
              Les plus grandes maisons de parfumerie réunies pour vous
            </p>
          </div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          {brands.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {brands.map((brand) => (
                <div key={brand.id}>
                  <Link href={`/marques/${brand.slug}`} className="group block text-center">
                    <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-cream">
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-light tracking-[0.15em] uppercase mb-2 group-hover:text-primary transition-colors truncate">
                      {brand.name}
                    </h2>

                    {brand.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 break-words max-w-xs mx-auto">
                        {brand.description}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune marque disponible pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* SEO Text + FAQ */}
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">Les grandes maisons de parfumerie en décants</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>BrazaScent réunit les plus grandes maisons de parfumerie pour vous offrir un accès inédit à la parfumerie de niche et de luxe. Dior, Chanel, Maison Francis Kurkdjian, Creed, Tom Ford, Le Labo, Byredo, Maison Margiela et bien d&apos;autres — leurs créations sont disponibles en décants authentiques de 2ml, 5ml et 10ml.</p>
            <p>Explorer une marque en décant, c&apos;est prendre le temps de comprendre son univers, ses matières premières, ses partis pris olfactifs. C&apos;est aussi la liberté de comparer plusieurs maisons avant d&apos;investir dans un flacon plein. La parfumerie de niche s&apos;apprécie dans la durée — nos échantillons vous donnent ce temps.</p>
            <p className="text-xs text-muted-foreground/70 italic">BrazaScent est indépendant et n&apos;est pas affilié aux marques citées. Les noms de marques sont utilisés uniquement à titre informatif pour identifier les produits.</p>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes</h3>
            <div className="divide-y divide-border">
              {[
                { q: "Qu'est-ce qu'une maison de parfumerie de niche ?", a: "Une maison de niche est une maison de parfumerie indépendante, souvent fondée par un nez ou un créateur visionnaire, qui privilégie la qualité des matières premières à la distribution de masse. Ces parfums sont souvent moins accessibles en boutique mais plus singuliers. Nos décants vous permettent de les découvrir facilement." },
                { q: "Pourquoi la parfumerie de niche coûte-t-elle si cher ?", a: "Les parfums de niche utilisent des matières premières rares et coûteuses (oud, rose centifolia, iris de Florence) à des concentrations élevées. Les séries sont limitées, la distribution restreinte. Un flacon vaut souvent 150 à 500€. C'est précisément pour cette raison que nos décants sont précieux : ils vous donnent accès à ces créations sans engagement financier." },
                { q: "Comment trouver un parfum selon ma marque préférée ?", a: "Sélectionnez la marque dans notre catalogue — chaque page marque liste l'ensemble de nos décants disponibles pour cette maison. Vous pouvez également utiliser notre moteur de recherche ou notre quiz olfactif pour explorer selon votre profil." },
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
