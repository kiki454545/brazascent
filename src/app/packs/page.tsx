import Image from 'next/image'
import Link from 'next/link'
import { Gift } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import PackAddButton from './PackAddButton'

export const metadata = {
  title: 'Coffrets & Packs de Parfums | BrazaScent',
  description: 'Découvrez nos coffrets de décants de parfums soigneusement sélectionnés. Packs découverte, packs thématiques — livraison rapide depuis BrazaScent.',
  openGraph: {
    title: 'Coffrets & Packs de Parfums | BrazaScent',
    description: 'Découvrez nos coffrets de décants de parfums soigneusement sélectionnés.',
  },
}

export const revalidate = 3600

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Pack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  product_ids: string[]
  tag: string | null
}

interface Product {
  id: string
  name: string
}

export default async function PacksPage() {
  const [{ data: packsData }, { data: productsData }] = await Promise.all([
    supabase
      .from('packs')
      .select('id, name, slug, description, price, original_price, image, product_ids, tag')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name'),
  ])

  const packs: Pack[] = packsData || []

  const productsMap: Record<string, string> = {}
  for (const p of (productsData || []) as Product[]) {
    productsMap[p.id] = p.name
  }

  const getProductNames = (ids: string[]) =>
    ids.map((id) => productsMap[id]).filter(Boolean).join(', ')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[360px] overflow-hidden">
        <Image
          src="/images/packs-hero.webp"
          alt="Nos Coffrets"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Packs
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4">
              Notre Sélection
            </h1>
            <p className="text-sm sm:text-lg font-light max-w-xl mx-auto">
              Explorez une sélection de packs soigneusement composés pour vous faire voyager à travers différentes maisons et univers olfactifs.
            </p>
          </div>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          {packs.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Aucun pack disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {packs.map((pack) => (
                <div key={pack.id} className="group">
                  <Link href={`/packs/${pack.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden mb-6 bg-cream">
                      <Image
                        src={pack.image}
                        alt={pack.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {pack.tag && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-xs tracking-wider uppercase">
                          {pack.tag}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-2 group-hover:text-primary transition-colors truncate">
                      {pack.name}
                    </h2>

                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 break-words">
                      {pack.description}
                    </p>

                    {pack.product_ids?.length > 0 && (
                      <div className="text-xs text-muted-foreground mb-4">
                        <p className="line-clamp-1 break-words">
                          Contient : {getProductNames(pack.product_ids)}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-medium">{pack.price} €</span>
                      {pack.original_price && (
                        <>
                          <span className="text-muted-foreground/75 line-through">{pack.original_price} €</span>
                          <span className="text-xs text-primary font-medium">
                            -{Math.round((1 - pack.price / pack.original_price) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                  </Link>

                  <PackAddButton pack={pack} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEO Text + FAQ */}
      <section className="py-16 lg:py-20 bg-cream">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-20">
          <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-6">Découvrir la parfumerie de niche avec nos packs</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>Nos packs de décants parfum sont pensés pour celles et ceux qui veulent explorer plusieurs univers olfactifs sans avoir à choisir. Chaque coffret réunit des fragrances sélectionnées selon un fil conducteur commun : famille de notes, intensité, saison, occasion. Un pack découverte BrazaScent, c&apos;est la liberté d&apos;un voyage olfactif curatif.</p>
            <p>Idéaux en cadeau ou pour enrichir votre collection personnelle, nos packs sont composés de décants authentiques en 2ml, 5ml ou 10ml. Prix avantageux, conditionnement soigné, expédition sous 24 à 48h. Chaque pack est une invitation à découvrir la parfumerie de niche sans compromis.</p>
            <p className="text-xs text-muted-foreground/70 italic">BrazaScent propose des décants préparés à partir de flacons authentiques. BrazaScent n&apos;est pas affilié aux marques citées. Les noms de marques sont utilisés uniquement à titre informatif.</p>
          </div>
          <div className="mt-12">
            <h3 className="text-lg font-light tracking-[0.15em] uppercase mb-6">Questions fréquentes sur les packs</h3>
            <div className="divide-y divide-border">
              {[
                { q: "C'est quoi un pack de décants ?", a: "Un pack de décants est une sélection de plusieurs échantillons de parfums authentiques réunis sous un thème commun (famille olfactive, occasion, intensité). Chaque décant est prélevé depuis le flacon d'origine de la marque. C'est la façon la plus économique d'explorer plusieurs fragrances." },
                { q: "Les packs sont-ils adaptés pour offrir ?", a: "Oui. Nos packs sont pensés comme des coffrets premium — idéaux pour offrir une expérience olfactive sans risquer de se tromper de fragrance. Le destinataire peut tester chaque parfum et choisir son préféré en connaissance de cause." },
                { q: "Puis-je personnaliser un pack ?", a: "Actuellement nos packs sont des sélections fixes curatées par nos soins. Si vous avez une demande particulière — un thème olfactif, une occasion spéciale — n'hésitez pas à nous contacter via notre formulaire de contact." },
                { q: "Les parfums des packs sont-ils les mêmes qu'en fiche individuelle ?", a: "Oui. Les décants inclus dans nos packs sont strictement identiques aux décants vendus individuellement — même produit, même concentration, même origine. La seule différence est le conditionnement groupé." },
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
    </div>
  )
}
