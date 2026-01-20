'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Award, Star, Truck } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { supabase, isAbortError } from '@/lib/supabase'
import { Product } from '@/types'

// Helper pour exécuter une requête Supabase avec retry en cas d'AbortError
async function fetchWithRetry<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  maxRetries = 3
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await queryFn()
      if (result.error && isAbortError(result.error)) {
        lastError = result.error
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
        continue
      }
      return result
    } catch (err) {
      if (isAbortError(err) && i < maxRetries - 1) {
        lastError = err
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
        continue
      }
      return { data: null, error: err }
    }
  }
  return { data: null, error: lastError }
}

// Composant Carrousel Draggable amélioré
function DraggableCarousel({ products }: { products: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDown = useRef(false)
  const hasDragged = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const dragThreshold = 8

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    isDown.current = true
    hasDragged.current = false
    startX.current = e.pageX
    scrollLeftStart.current = containerRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !containerRef.current) return
    const x = e.pageX
    const diff = startX.current - x

    if (Math.abs(diff) > dragThreshold) {
      hasDragged.current = true
      containerRef.current.style.cursor = 'grabbing'
    }

    if (hasDragged.current) {
      e.preventDefault()
      containerRef.current.scrollLeft = scrollLeftStart.current + diff
    }
  }

  const handleMouseUp = () => {
    isDown.current = false
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
    setTimeout(() => { hasDragged.current = false }, 100)
  }

  const handleMouseLeave = () => {
    isDown.current = false
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  // Touch events
  const touchStartX = useRef(0)
  const touchScrollLeft = useRef(0)
  const hasTouchDragged = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    touchStartX.current = e.touches[0].pageX
    touchScrollLeft.current = containerRef.current.scrollLeft
    hasTouchDragged.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    const x = e.touches[0].pageX
    const diff = touchStartX.current - x

    if (Math.abs(diff) > dragThreshold) {
      hasTouchDragged.current = true
    }

    if (hasTouchDragged.current) {
      containerRef.current.scrollLeft = touchScrollLeft.current + diff
    }
  }

  const handleTouchEnd = () => {
    setTimeout(() => { hasTouchDragged.current = false }, 100)
  }

  // Bloquer les clics sur les liens si on a draggé
  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || hasTouchDragged.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-4 pl-6 lg:pl-12 pr-6 overflow-x-auto scrollbar-hide cursor-grab select-none"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClickCapture={handleClick}
    >
      {products.map((product: Product, index: number) => (
        <div
          key={product.id}
          className="flex-shrink-0 w-56 sm:w-64 lg:w-72"
          onDragStart={(e) => e.preventDefault()}
        >
          <ProductCard product={product} index={index} />
        </div>
      ))}
    </div>
  )
}

const reviews = [
  { text: 'Décants impeccables et packaging ultra soigné. On sent le sérieux.', name: 'Ale***' },
  { text: 'Parfums rares introuvables ailleurs, expédition rapide. Je recommande.', name: 'Max***' },
  { text: 'Top pour tester sur plusieurs jours avant d\'acheter un flacon complet.', name: 'Jul***' },
  { text: 'Qualité au rendez-vous, je suis conquis par le service.', name: 'Tho***' },
  { text: 'Enfin un vendeur sérieux pour les décants de niche !', name: 'Luc***' },
  { text: 'Livraison rapide, parfums authentiques. Parfait.', name: 'Nic***' },
  { text: 'J\'ai pu tester 5 parfums avant de me décider. Génial !', name: 'Ant***' },
  { text: 'Le packaging est vraiment premium, on se sent privilégié.', name: 'Mar***' },
  { text: 'Service client au top, réponse en moins d\'une heure.', name: 'Pie***' },
  { text: 'Les décants sont parfaitement dosés, rien à redire.', name: 'Flo***' },
  { text: 'Ma collection s\'agrandit grâce à Braza Scent !', name: 'Vin***' },
  { text: 'Première commande et déjà fidèle. Bravo !', name: 'Pau***' },
  { text: 'Des fragrances introuvables en France, merci !', name: 'Adri***' },
  { text: 'Rapport qualité/prix imbattable pour du niche.', name: 'Seb***' },
  { text: 'J\'ai offert un coffret, succès garanti.', name: 'Cha***' },
  { text: 'Emballage soigné, livraison express. Top !', name: 'Lou***' },
  { text: 'Parfait pour découvrir avant d\'investir.', name: 'Rap***' },
  { text: 'Sélection pointue, on voit la passion.', name: 'Bap***' },
  { text: 'Commande reçue en 48h, nickel chrome.', name: 'Yac***' },
  { text: 'Je recommande les yeux fermés.', name: 'Kar***' },
  { text: 'Décants généreux et bien présentés.', name: 'Emi***' },
  { text: 'Enfin trouvé mon parfum signature grâce aux tests.', name: 'Cla***' },
  { text: 'Communication parfaite du début à la fin.', name: 'Gab***' },
  { text: 'Qualité identique aux flacons originaux.', name: 'Léo***' },
  { text: 'Parfums frais et puissants, excellente tenue.', name: 'Dyl***' },
  { text: 'Livraison offerte dès 50€, c\'est cadeau !', name: 'Jes***' },
  { text: 'Mes amis me demandent tous où je trouve mes parfums.', name: 'Kev***' },
  { text: 'Service impeccable, je suis client régulier.', name: 'Rom***' },
  { text: 'Les notes olfactives sont bien décrites.', name: 'Axe***' },
  { text: 'Parfait pour les collectionneurs comme moi.', name: 'Dam***' },
  { text: 'Braza Scent = confiance et qualité.', name: 'Sam***' },
  { text: 'J\'ai testé 10 parfums, tous authentiques.', name: 'Eli***' },
  { text: 'Le meilleur site de décants que j\'ai trouvé.', name: 'Mat***' },
  { text: 'Expédition le jour même, impressionnant.', name: 'Lau***' },
  { text: 'Prix justes pour de la vraie niche.', name: 'Arn***' },
  { text: 'Atomiseurs de qualité, pratiques à transporter.', name: 'Ced***' },
  { text: 'Ma femme adore les parfums que j\'ai commandés.', name: 'Phi***' },
  { text: 'Découvert grâce à TikTok, pas déçu du voyage.', name: 'Enz***' },
  { text: 'Parfums rares enfin accessibles.', name: 'Yas***' },
  { text: 'Je commande chaque mois maintenant.', name: 'Noe***' },
  { text: 'Excellent pour offrir en cadeau.', name: 'Raf***' },
  { text: 'Sérieux et professionnel, rien à dire.', name: 'Osm***' },
  { text: 'Ma go est fan, merci Braza !', name: 'Wal***' },
  { text: 'Décants parfaits pour voyager léger.', name: 'Iss***' },
  { text: 'Service après-vente réactif et arrangeant.', name: 'Bil***' },
  { text: 'Je teste avant d\'acheter le flacon, c\'est malin.', name: 'Sof***' },
  { text: 'Packaging digne d\'une grande maison.', name: 'Lil***' },
  { text: 'Fragrances fidèles aux originaux.', name: 'Eva***' },
  { text: 'Braza Scent a changé ma façon de découvrir les parfums.', name: 'Meh***' },
  { text: 'Tout est parfait, du site à la livraison.', name: 'Aya***' },
]

export default function HomePage() {
  const [bestsellers, setBestsellers] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const mapProduct = (p: any): Product => {
      const priceBySize = typeof p.price_by_size === 'string'
        ? JSON.parse(p.price_by_size)
        : (p.price_by_size || {})

      const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
      const displayPrice = prices.length > 0 ? Math.min(...prices) : p.price

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        shortDescription: p.short_description || '',
        price: displayPrice,
        originalPrice: p.original_price,
        priceBySize,
        images: p.images || [],
        size: p.sizes || [],
        category: p.category || 'unisexe',
        collection: p.collection,
        brand: p.brand || '',
        notes: {
          top: p.notes_top || [],
          heart: p.notes_heart || [],
          base: p.notes_base || []
        },
        stock: p.stock ?? 1,
        inStock: (p.stock || 0) > 0,
        new: p.is_new,
        bestseller: p.is_bestseller,
        featured: p.is_bestseller
      }
    }

    const fetchProducts = async () => {
      try {
        // Fetch bestsellers avec retry (produits avec is_bestseller = true)
        const { data: bestsellersData, error: bestsellersError } = await fetchWithRetry<any[]>(() =>
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .eq('is_bestseller', true)
            .order('created_at', { ascending: false })
        )

        if (isMounted && bestsellersData) {
          setBestsellers(bestsellersData.map(mapProduct))
        }
        if (bestsellersError && !isAbortError(bestsellersError)) {
          console.error('Bestsellers error:', bestsellersError)
        }

        // Fetch new products avec retry (produits avec is_new = true)
        const { data: newData, error: newError } = await fetchWithRetry<any[]>(() =>
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .eq('is_new', true)
            .order('created_at', { ascending: false })
        )

        if (isMounted && newData) {
          setNewProducts(newData.map(mapProduct))
        }
        if (newError && !isAbortError(newError)) {
          console.error('New products error:', newError)
        }
      } catch (err: any) {
        if (!isAbortError(err)) {
          console.error('Fetch error:', err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProducts()
    return () => { isMounted = false }
  }, [])

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt="Braza Scent - Parfumerie de niche"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-6 pt-32 sm:pt-0">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Kicker */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 border border-[#C9A962]/50 rounded-full text-xs tracking-[0.2em] uppercase text-[#C9A962]">
                Décants premium • Niche • Collection privée
              </span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.1em] uppercase mb-6 leading-tight"
            >
              Découvre des parfums rares<br />
              <span className="text-[#C9A962]">sans acheter le flacon</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl font-light max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Braza Scent est spécialisé dans le décantage à partir de flacons authentiques :
              parfumerie de niche, éditions limitées et pièces issues de collections privées.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/parfums"
                className="btn-luxury px-10 py-4 bg-white text-[#19110B] text-sm tracking-[0.2em] uppercase font-medium hover:bg-[#C9A962] hover:text-white transition-colors"
              >
                Découvrir la sélection
              </Link>
              <Link
                href="/packs"
                className="px-10 py-4 border border-[#C9A962] bg-[#C9A962]/10 text-[#C9A962] text-sm tracking-[0.2em] uppercase font-medium hover:bg-[#C9A962] hover:text-white transition-colors"
              >
                Découvrir les packs
              </Link>
              <Link
                href="#comment-ca-marche"
                className="px-10 py-4 border border-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-[#19110B] transition-colors"
              >
                Comment ça marche ?
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
              {['Authenticité garantie', 'Décantage soigné', 'Packaging sécurisé', 'Stock limité'].map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs tracking-wider"
                >
                  {badge}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pourquoi Braza Scent */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Notre approche
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6"
            >
              Pourquoi Braza Scent ?
            </motion.h2>
            <motion.div variants={fadeUp} className="w-24 h-px bg-[#C9A962] mx-auto mb-8" />
            <motion.p
              variants={fadeUp}
              className="text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              Une approche simple : <strong className="text-[#19110B]">authenticité</strong>, <strong className="text-[#19110B]">sélection</strong>, <strong className="text-[#19110B]">soin</strong>.
              Chaque décant est préparé avec précision pour te faire découvrir le parfum dans les meilleures conditions.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: Sparkles, title: 'Authenticité', desc: 'Décantage à partir de flacons authentiques uniquement.' },
              { icon: Award, title: 'Qualité', desc: 'Matériel propre, dosage précis, rendu premium.' },
              { icon: Star, title: 'Rareté', desc: 'Niche, éditions limitées, sélection de collection privée.' },
              { icon: Truck, title: 'Expédition', desc: 'Packaging sécurisé, préparation rapide.' },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="text-center p-6 border border-gray-100 hover:border-[#C9A962]/30 transition-colors"
              >
                <div className="w-16 h-16 mx-auto mb-6 border border-[#C9A962] rounded-full flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-[#C9A962]" />
                </div>
                <h3 className="text-lg tracking-[0.15em] uppercase mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Best-sellers - Carrousel draggable */}
      <section className="py-20 lg:py-28 bg-[#F9F6F1] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <motion.span variants={fadeUp} className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
                  Les plus populaires
                </motion.span>
                <motion.h2
                  variants={fadeUp}
                  className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase"
                >
                  Best-sellers
                </motion.h2>
                <motion.div variants={fadeUp} className="w-24 h-px bg-[#C9A962] mt-6" />
              </div>
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 hidden md:block">← Glissez pour découvrir →</span>
                <Link
                  href="/parfums"
                  className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-[#C9A962] transition-colors group"
                >
                  Voir tout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bestsellers.length > 0 ? (
          <DraggableCarousel products={bestsellers} />
        ) : (
          <p className="text-center text-gray-500 py-10">Aucun best-seller pour le moment</p>
        )}
      </section>

      {/* Nouveautés - Carrousel draggable */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <motion.span variants={fadeUp} className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
                  Fraîchement arrivés
                </motion.span>
                <motion.h2
                  variants={fadeUp}
                  className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase"
                >
                  Nouveautés
                </motion.h2>
                <motion.div variants={fadeUp} className="w-24 h-px bg-[#C9A962] mt-6" />
              </div>
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 hidden md:block">← Glissez pour découvrir →</span>
                <Link
                  href="/parfums"
                  className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-[#C9A962] transition-colors group"
                >
                  Voir tout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : newProducts.length > 0 ? (
          <DraggableCarousel products={newProducts} />
        ) : (
          <p className="text-center text-gray-500 py-10">Aucune nouveauté pour le moment</p>
        )}
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 lg:py-28 bg-[#19110B] text-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Simple & rapide
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6"
            >
              Comment ça marche ?
            </motion.h2>
            <motion.div variants={fadeUp} className="w-24 h-px bg-[#C9A962] mx-auto" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { num: '01', title: 'Choisis ton parfum', desc: 'Sélectionne la fragrance et le format (2/5/10ml).' },
              { num: '02', title: 'Préparation', desc: 'Décantage propre et précis à partir d\'un flacon authentique.' },
              { num: '03', title: 'Packaging', desc: 'Emballage soigné et sécurisé pour un transport sans stress.' },
              { num: '04', title: 'Réception', desc: 'Tu testes sur plusieurs jours et tu profites de la niche.' },
            ].map((step) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 border border-[#C9A962] rounded-full flex items-center justify-center">
                  <span className="text-[#C9A962] text-lg font-light">{step.num}</span>
                </div>
                <h3 className="text-lg tracking-[0.15em] uppercase mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Formats disponibles */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
                Nos formats
              </span>
              <h2 className="text-3xl md:text-4xl font-light tracking-[0.15em] uppercase mb-6">
                Décanter, c'est découvrir sans se tromper
              </h2>
              <div className="w-24 h-px bg-[#C9A962] mx-auto mb-8" />
              <p className="text-gray-600 max-w-2xl mx-auto">
                Le décantage te permet de tester une fragrance sur plusieurs jours (peau, météo, tenue)
                avant d'investir dans un flacon complet.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 lg:gap-8">
              {[
                { size: '2ml', label: 'Test rapide' },
                { size: '5ml', label: 'Découverte complète' },
                { size: '10ml', label: 'Vrai usage' },
              ].map((format) => (
                <div
                  key={format.size}
                  className="p-6 lg:p-8 border border-gray-200 text-center hover:border-[#C9A962] transition-colors"
                >
                  <div className="text-3xl lg:text-4xl font-light text-[#C9A962] mb-2">{format.size}</div>
                  <div className="text-sm text-gray-600 tracking-wider uppercase">{format.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Engagement qualité */}
      <section className="py-20 lg:py-28 bg-[#F9F6F1]">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
                Notre engagement
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">
                Engagement qualité
              </h2>
              <div className="w-24 h-px bg-[#C9A962] mx-auto" />
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white border border-gray-100">
                <h3 className="text-xl tracking-[0.15em] uppercase mb-4">Authenticité</h3>
                <p className="text-gray-600 leading-relaxed">
                  Décantage réalisé à partir de flacons <strong className="text-[#19110B]">authentiques</strong> (niche & collection privée).
                </p>
              </div>
              <div className="p-8 bg-white border border-gray-100">
                <h3 className="text-xl tracking-[0.15em] uppercase mb-4">Soin & transparence</h3>
                <p className="text-gray-600 leading-relaxed">
                  Matériel propre, manipulation soignée, packaging sécurisé, stock mis à jour selon disponibilité.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Avis - Carrousel */}
      <section className="py-20 lg:py-28 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
                Témoignages
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">
                Avis clients
              </h2>
              <div className="w-24 h-px bg-[#C9A962] mx-auto" />
            </motion.div>
          </motion.div>
        </div>

        {/* Carrousel infini */}
        <div className="relative">
          <motion.div
            className="flex gap-6"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            {[...reviews, ...reviews].map((review, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-80 p-6 bg-[#F9F6F1] border border-gray-100"
              >
                <div className="text-[#C9A962] text-lg mb-3">★★★★★</div>
                <p className="text-gray-600 mb-4 italic leading-relaxed text-sm">"{review.text}"</p>
                <p className="text-sm text-gray-500">{review.name}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 lg:py-28 bg-[#19110B] text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Contact
            </span>
            <h2 className="text-3xl md:text-4xl font-light tracking-[0.15em] uppercase mb-6">
              Une demande, une recherche, une pièce rare ?
            </h2>
            <div className="w-24 h-px bg-[#C9A962] mx-auto mb-8" />
            <p className="text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Écris-moi pour une recommandation, une disponibilité, ou un conseil (familles olfactives, saisons, tenue).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="btn-luxury px-10 py-4 bg-[#C9A962] text-[#19110B] text-sm tracking-[0.2em] uppercase font-medium hover:bg-[#E8D5A3] transition-colors"
              >
                Me contacter
              </Link>
              <Link
                href="/parfums"
                className="px-10 py-4 border border-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-[#19110B] transition-colors"
              >
                Voir le catalogue
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-16 bg-[#F9F6F1]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-8 block">
            @braza.scent
          </span>

          <div className="flex justify-center gap-8">
            <a
              href="https://snapchat.com/t/eOoOvNcf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-[#FFFC00] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                </svg>
              </div>
              <span className="text-sm tracking-[0.15em] uppercase text-gray-600 group-hover:text-[#C9A962] transition-colors">Snapchat</span>
            </a>

            <a
              href="https://www.tiktok.com/@braza.scent"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <span className="text-sm tracking-[0.15em] uppercase text-gray-600 group-hover:text-[#C9A962] transition-colors">TikTok</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
