import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles, Leaf, Award, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'À propos | Braza Scent',
  description: 'Découvrez l\'histoire de Braza Scent, maison de parfumerie d\'exception. Notre passion pour les fragrances rares, notre sourcing éthique et notre vision de la parfumerie moderne.',
  alternates: { canonical: 'https://brazascent.com/a-propos' },
  openGraph: {
    title: 'Notre histoire | Braza Scent',
    description: 'Maison de parfumerie d\'exception — découvrez notre histoire, nos valeurs et notre vision.',
    url: 'https://brazascent.com/a-propos',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Braza Scent',
  },
}

const values = [
  {
    icon: Sparkles,
    title: 'Excellence',
    desc: 'Chaque fragrance est sélectionnée selon des critères stricts de qualité. Nous ne référençons que des parfums qui nous ont convaincus lors de tests rigoureux.',
  },
  {
    icon: Leaf,
    title: 'Sourcing éthique',
    desc: 'Nos matières premières sont tracées, nos fournisseurs respectueux de l\'environnement. La parfumerie d\'exception ne peut pas se faire au détriment de la planète.',
  },
  {
    icon: Award,
    title: 'Expertise',
    desc: 'Notre équipe de passionnés vous guide dans votre découverte olfactive. Quiz, conseils personnalisés, notes détaillées — nous mettons notre savoir à votre service.',
  },
  {
    icon: Heart,
    title: 'Passion',
    desc: 'Braza Scent est né d\'un amour sincère pour les parfums. Cette passion guide chacune de nos décisions, du choix des maisons jusqu\'à l\'emballage de vos commandes.',
  },
]

const timeline = [
  {
    year: '2020',
    title: 'La genèse',
    desc: 'Née d\'une collection personnelle devenue trop grande pour une seule personne, l\'idée de partager ces pépites olfactives avec le plus grand nombre s\'impose.',
  },
  {
    year: '2021',
    title: 'Les premières sélections',
    desc: 'Après des mois de recherche et de tests, les premières maisons partenaires sont choisies. La qualité prime sur la quantité — chaque référence est justifiée.',
  },
  {
    year: '2022',
    title: 'L\'ouverture',
    desc: 'Braza Scent ouvre ses portes en ligne. L\'accueil de la communauté dépasse toutes les espérances. La boutique grandit organiquement, portée par le bouche-à-oreille.',
  },
  {
    year: '2024',
    title: 'L\'expansion',
    desc: 'De nouvelles maisons rejoignent la sélection, les formats découverte (2 ml, 5 ml, 10 ml) sont lancés pour permettre à tous d\'explorer sans engagement.',
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
            Maison de parfumerie d&apos;exception, née d&apos;une passion pour les fragrances rares
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-xl font-light leading-relaxed text-muted-foreground">
          Chez Braza Scent, nous croyons que le parfum est la forme d&apos;art la plus intime qui soit.
          Il ne se voit pas, il se ressent. Il ne s&apos;explique pas, il se raconte.
          Notre mission : vous aider à trouver la fragrance qui deviendra votre signature.
        </p>
      </section>

      {/* Image + texte */}
      <section className="px-6 sm:px-10 lg:px-20 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/3] bg-cream overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=1000&q=80"
              alt="Atelier Braza Scent"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="text-primary text-xs tracking-[0.3em] uppercase mb-4">Notre vision</div>
            <h2 className="text-3xl font-light tracking-[0.1em] uppercase mb-6">
              La parfumerie accessible à tous
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Les grandes maisons de parfumerie créent des chefs-d&apos;œuvre olfactifs, mais leur prix
              élevé rend souvent l&apos;exploration risquée. Un flacon entier pour découvrir une fragrance ?
              Braza Scent a inventé un autre chemin.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Nos formats en 2 ml, 5 ml et 10 ml vous permettent de tester, d&apos;adopter ou de passer
              à la suivante — sans culpabilité. La découverte olfactive devient ainsi une aventure
              joyeuse et accessible.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-primary hover:underline"
            >
              Trouver mon parfum avec le quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-cream mt-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-primary text-xs tracking-[0.3em] uppercase mb-3">Chronologie</div>
            <h2 className="text-3xl font-light tracking-[0.1em] uppercase">Notre parcours</h2>
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
            <h2 className="text-3xl font-light tracking-[0.1em] uppercase">Nos valeurs</h2>
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
          Commencez votre voyage olfactif
        </h2>
        <p className="text-background/70 mb-8 max-w-md mx-auto">
          Des centaines de fragrances vous attendent. Utilisez notre quiz pour trouver celle qui vous correspond.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Faire le quiz
          </Link>
          <Link
            href="/parfums"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-background/30 text-background text-sm tracking-[0.15em] uppercase hover:border-background transition-colors"
          >
            Voir les parfums
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
