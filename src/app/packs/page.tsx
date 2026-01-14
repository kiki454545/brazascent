'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gift, Truck, Star } from 'lucide-react'

const packs = [
  {
    id: '1',
    name: 'Coffret Découverte',
    slug: 'coffret-decouverte',
    description: 'Une sélection de 5 miniatures pour découvrir l\'univers Braza Scent. Idéal pour trouver votre signature olfactive.',
    price: 89,
    originalPrice: 120,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
    products: ['Oud Royal', 'Rose Éternelle', 'Noir Absolu', 'Lumière d\'Or', 'Bois Précieux'],
    tag: 'Bestseller',
  },
  {
    id: '2',
    name: 'Coffret Prestige',
    slug: 'coffret-prestige',
    description: 'Notre coffret signature avec 2 parfums full-size et un vaporisateur de voyage. L\'élégance à portée de main.',
    price: 249,
    originalPrice: 310,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800',
    products: ['Oud Royal 100ml', 'Rose Éternelle 100ml', 'Vaporisateur 10ml'],
    tag: 'Exclusif',
  },
  {
    id: '3',
    name: 'Coffret Homme',
    slug: 'coffret-homme',
    description: 'Une sélection masculine raffinée avec 3 fragrances boisées et épicées pour l\'homme moderne.',
    price: 179,
    originalPrice: 220,
    image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800',
    products: ['Noir Absolu 50ml', 'Bois Précieux 50ml', 'Cuir Intense 50ml'],
    tag: 'Nouveau',
  },
  {
    id: '4',
    name: 'Coffret Femme',
    slug: 'coffret-femme',
    description: 'L\'essence de la féminité avec 3 créations florales et orientales d\'une élégance absolue.',
    price: 179,
    originalPrice: 220,
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800',
    products: ['Rose Éternelle 50ml', 'Jasmin Nuit 50ml', 'Fleur de Soie 50ml'],
    tag: null,
  },
  {
    id: '5',
    name: 'Coffret Collection Signature',
    slug: 'coffret-collection-signature',
    description: 'L\'intégralité de notre collection Signature en format voyage. 8 créations uniques à découvrir.',
    price: 149,
    originalPrice: 200,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800',
    products: ['8 miniatures 10ml de la Collection Signature'],
    tag: 'Édition limitée',
  },
  {
    id: '6',
    name: 'Coffret Cadeau Luxe',
    slug: 'coffret-cadeau-luxe',
    description: 'Le cadeau parfait : un parfum full-size, une bougie parfumée et un savon artisanal dans un écrin luxueux.',
    price: 299,
    originalPrice: 380,
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800',
    products: ['Parfum 100ml au choix', 'Bougie 200g', 'Savon 100g'],
    tag: 'Idée cadeau',
  },
]

export default function PacksPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1920&q=90"
          alt="Nos Coffrets"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Coffrets
            </span>
            <h1 className="text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-4">
              Nos Packs
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Des coffrets d&apos;exception pour offrir ou se faire plaisir
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-[#F9F6F1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Gift, title: 'Emballage cadeau', description: 'Écrin luxueux offert' },
              { icon: Truck, title: 'Livraison express', description: 'Offerte dès 100€' },
              { icon: Star, title: 'Économies', description: 'Jusqu\'à -25% sur les packs' },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 justify-center"
              >
                <benefit.icon className="w-8 h-8 text-[#C9A962]" />
                <div>
                  <p className="font-medium">{benefit.title}</p>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {packs.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Link href={`/packs/${pack.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden mb-6 bg-[#F9F6F1]">
                    <Image
                      src={pack.image}
                      alt={pack.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {pack.tag && (
                      <span className="absolute top-4 left-4 px-3 py-1 bg-[#C9A962] text-white text-xs tracking-wider uppercase">
                        {pack.tag}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-2 group-hover:text-[#C9A962] transition-colors">
                    {pack.name}
                  </h2>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {pack.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-4">
                    <p className="line-clamp-1">Contient : {pack.products.join(', ')}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-medium">{pack.price} €</span>
                    {pack.originalPrice && (
                      <span className="text-gray-400 line-through">{pack.originalPrice} €</span>
                    )}
                    {pack.originalPrice && (
                      <span className="text-xs text-[#C9A962] font-medium">
                        -{Math.round((1 - pack.price / pack.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                </Link>

                <button className="w-full mt-4 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors">
                  Ajouter au panier
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#19110B] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Gift className="w-16 h-16 text-[#C9A962] mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-light tracking-[0.15em] uppercase mb-6">
              Coffret personnalisé
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Créez votre propre coffret sur-mesure en sélectionnant vos parfums préférés.
              Un cadeau unique et personnel.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 border border-[#C9A962] text-[#C9A962] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] hover:text-white transition-colors"
            >
              Nous contacter
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
