import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, Leaf, Award, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'À propos — BrazaScent',
  description: 'BrazaScent, c\'est l\'idée simple que personne ne devrait dépenser 200€ pour découvrir un parfum. Décants authentiques, maisons de niche, livraison en France.',
  alternates: { canonical: 'https://brazascent.com/a-propos' },
  openGraph: {
    title: 'À propos — BrazaScent',
    description: 'Décants authentiques de parfums de niche et de luxe. Testez avant d\'investir.',
    url: 'https://brazascent.com/a-propos',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
}

const values = [
  {
    icon: Sparkles,
    title: 'Authenticité',
    desc: 'Chaque décant est prélevé directement depuis le flacon d\'origine — même concentration, même qualité. Pas de reformulation, pas de dilution. Ce que vous recevez, c\'est le parfum tel qu\'il a été créé.',
  },
  {
    icon: Leaf,
    title: 'Transparence',
    desc: 'Nous indiquons la maison, la référence, les notes. Nous ne vendons pas de "parfums inspirés de". Nous ne fabriquons pas de copies. Tout est clair, vérifiable, honnête.',
  },
  {
    icon: Award,
    title: 'Exigence',
    desc: 'Nous ne référençons pas tout ce qui existe. Chaque fragrance proposée a été choisie — pour sa qualité, son intérêt, sa capacité à surprendre. Une sélection courte vaut mieux qu\'un catalogue sans fin.',
  },
  {
    icon: Heart,
    title: 'Passion',
    desc: 'BrazaScent est tenu par des passionnés de parfumerie qui connaissent les maisons, les parfumeurs, les pyramides olfactives. Pas une interface algorithmique — des humains qui aiment les beaux parfums.',
  },
]

const timeline = [
  {
    year: '01',
    title: 'Le problème',
    desc: 'Un parfum de niche coûte entre 150 et 400€ le flacon. La plupart des gens l\'achètent après deux secondes sur le poignet d\'un vendeur, ou pire — sans même l\'avoir senti. C\'est absurde.',
  },
  {
    year: '02',
    title: 'La solution',
    desc: 'Un décant, c\'est un prélèvement du flacon original dans un format de 2ml, 5ml ou 10ml. Vous portez le parfum vrai pendant plusieurs jours, sur votre peau, dans votre vie. Puis vous décidez.',
  },
  {
    year: '03',
    title: 'La sélection',
    desc: 'Nous avons constitué une sélection de maisons de niche et de parfumerie de luxe : Dior, Louis Vuitton, MFK, Guerlain, Xerjoff, Kilian, Ex Nihilo et d\'autres. Des références choisies pour leur qualité, pas pour leur popularité.',
  },
  {
    year: '04',
    title: 'Aujourd\'hui',
    desc: 'Des clients de toute la France reçoivent leurs décants en 24 à 48h. Certains trouvent leur parfum signature. D\'autres explorent une nouvelle maison chaque mois. Tous décident en connaissance de cause.',
  },
]

export default function AProposPage() {
  return (
    <div className="min-h-screen pt-24 pb-24 bg-background">

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-foreground" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1600&q=80')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-6">
          <div className="inline-flex items-center gap-2 text-primary text-xs tracking-[0.3em] uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            Notre histoire
          </div>
          <h1 className="text-5xl sm:text-6xl font-light tracking-[0.15em] uppercase text-white mb-4">
            Braza Scent
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Décants authentiques de parfums de niche et de luxe — pour tester avant d&apos;investir
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-xl font-light leading-relaxed text-muted-foreground">
          Un flacon complet coûte souvent entre 150 et 400€. La plupart des gens l&apos;achètent
          sans l&apos;avoir jamais porté plus de cinq minutes. BrazaScent est né de ce constat :
          il existe une façon plus intelligente de découvrir les parfums.
        </p>
      </section>

      {/* Image + texte */}
      <section className="px-6 sm:px-10 lg:px-20 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/3] bg-cream overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=1000&q=80"
              alt="Décants BrazaScent"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="text-primary text-xs tracking-[0.3em] uppercase mb-4">Ce que nous faisons</div>
            <h2 className="text-3xl font-light tracking-[0.1em] uppercase mb-6">
              Décanter pour vraiment choisir
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Un décant est un prélèvement effectué directement depuis le flacon d&apos;origine.
              Pas une copie, pas une imitation — le parfum authentique de la maison, dans sa
              concentration exacte, conditionné en 2ml, 5ml ou 10ml.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Cinq millilitres, c&apos;est environ cent projections. De quoi porter le parfum
              une semaine entière dans des contextes différents — au travail, le soir, par temps
              chaud, par temps froid. De quoi savoir si cette fragrance vous appartient vraiment.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Nous préparons chaque commande à la main et expédions en France en 24 à 48h ouvrées.
            </p>
            <Link
              href="/parfums"
              className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-primary hover:underline"
            >
              Voir la sélection
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-cream mt-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-primary text-xs tracking-[0.3em] uppercase mb-3">Comment ça fonctionne</div>
            <h2 className="text-3xl font-light tracking-[0.1em] uppercase">De l&apos;idée au décant</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-border hidden sm:block" />
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div key={item.year} className={`relative flex flex-col sm:flex-row gap-6 sm:gap-12 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                  <div className={`sm:w-1/2 ${i % 2 === 0 ? 'sm:text-right sm:pr-10' : 'sm:text-left sm:pl-10'}`}>
                    <div className="text-primary text-2xl font-light mb-1">{item.year}</div>
                    <h3 className="text-lg tracking-[0.05em] uppercase mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  <div className="sm:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-20 px-6 sm:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-primary text-xs tracking-[0.3em] uppercase mb-3">Ce qui nous guide</div>
            <h2 className="text-3xl font-light tracking-[0.1em] uppercase">Nos engagements</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 border border-primary/30 text-primary mb-4">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm tracking-[0.15em] uppercase mb-3">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-foreground text-background text-center px-6">
        <div className="text-primary text-xs tracking-[0.3em] uppercase mb-4">Prêt à explorer ?</div>
        <h2 className="text-3xl font-light tracking-[0.1em] uppercase mb-4">
          Trouvez votre parfum signature
        </h2>
        <p className="text-background/70 mb-8 max-w-md mx-auto">
          Commencez par un décant. Portez-le quelques jours. Décidez en connaissance de cause.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/parfums"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Explorer les parfums
          </Link>
          <Link
            href="/packs"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-background/30 text-background text-sm tracking-[0.15em] uppercase hover:border-background transition-colors"
          >
            Voir les packs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
