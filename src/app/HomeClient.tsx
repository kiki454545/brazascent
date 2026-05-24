'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ShieldCheck, Zap, Layers, Gift } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'
import { HomePack } from './page'
import { formatPrice } from '@/lib/format'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface DraggableCarouselHandle {
  scrollByAmount: (amount: number) => void
}

const DraggableCarousel = forwardRef<DraggableCarouselHandle, { products: Product[] }>(({ products }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    scrollByAmount: (amount: number) => {
      containerRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
    },
  }))

  const isDown = useRef(false)
  const hasDragged = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const dragThreshold = 8
  const velocity = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const animationFrame = useRef<number | null>(null)

  const applyMomentum = () => {
    if (!containerRef.current) return
    velocity.current *= 0.95
    if (Math.abs(velocity.current) < 0.5) { velocity.current = 0; return }
    containerRef.current.scrollLeft += velocity.current
    animationFrame.current = requestAnimationFrame(applyMomentum)
  }

  const stopMomentum = () => {
    if (animationFrame.current) { cancelAnimationFrame(animationFrame.current); animationFrame.current = null }
    velocity.current = 0
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    stopMomentum()
    isDown.current = true
    hasDragged.current = false
    startX.current = e.pageX
    lastX.current = e.pageX
    lastTime.current = Date.now()
    scrollLeftStart.current = containerRef.current.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !containerRef.current) return
    const x = e.pageX
    const diff = startX.current - x
    const now = Date.now()
    const dt = now - lastTime.current
    if (Math.abs(diff) > dragThreshold) { hasDragged.current = true; containerRef.current.style.cursor = 'grabbing' }
    if (hasDragged.current) {
      e.preventDefault()
      if (dt > 0) velocity.current = (lastX.current - x) / dt * 15
      lastX.current = x
      lastTime.current = now
      containerRef.current.scrollLeft = scrollLeftStart.current + diff
    }
  }

  const handleMouseUp = () => {
    if (!isDown.current) return
    isDown.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
    if (hasDragged.current && Math.abs(velocity.current) > 1) applyMomentum()
    setTimeout(() => { hasDragged.current = false }, 100)
  }

  const handleMouseLeave = () => { if (isDown.current) handleMouseUp() }

  const touchStartX = useRef(0)
  const touchScrollLeft = useRef(0)
  const hasTouchDragged = useRef(false)
  const touchLastX = useRef(0)
  const touchLastTime = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    stopMomentum()
    touchStartX.current = e.touches[0].pageX
    touchLastX.current = e.touches[0].pageX
    touchLastTime.current = Date.now()
    touchScrollLeft.current = containerRef.current.scrollLeft
    hasTouchDragged.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    const x = e.touches[0].pageX
    const diff = touchStartX.current - x
    const now = Date.now()
    const dt = now - touchLastTime.current
    if (Math.abs(diff) > dragThreshold) hasTouchDragged.current = true
    if (hasTouchDragged.current) {
      if (dt > 0) velocity.current = (touchLastX.current - x) / dt * 15
      touchLastX.current = x
      touchLastTime.current = now
      containerRef.current.scrollLeft = touchScrollLeft.current + diff
    }
  }

  const handleTouchEnd = () => {
    if (hasTouchDragged.current && Math.abs(velocity.current) > 1) applyMomentum()
    setTimeout(() => { hasTouchDragged.current = false }, 100)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || hasTouchDragged.current) { e.preventDefault(); e.stopPropagation() }
  }

  useEffect(() => {
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current) }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex gap-6 sm:gap-8 lg:gap-10 pl-6 sm:pl-10 lg:pl-20 pr-6 sm:pr-10 lg:pr-20 overflow-x-auto scrollbar-hide cursor-grab select-none"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
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
        <div key={product.id} className="flex-shrink-0 w-56 sm:w-64 lg:w-72" onDragStart={(e) => e.preventDefault()}>
          <ProductCard product={product} index={index} />
        </div>
      ))}
    </div>
  )
})
DraggableCarousel.displayName = 'DraggableCarousel'

function HeroBestsellersSlider({ products }: { products: Product[] }) {
  const items = products.slice(0, 5)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => { setCurrent((prev) => (prev + 1) % items.length) }, 5000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) return <div className="w-full h-full bg-cream/10" />

  const item = items[current]
  const getPrice = (p: Product) => {
    if (p.priceBySize) {
      const prices = Object.values(p.priceBySize).filter(v => v > 0)
      if (prices.length > 0) return Math.min(...prices)
    }
    return p.price
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={item.id}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <Link href={`/parfum/${item.slug}`} className="block w-full h-full group">
            <m.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: 6, ease: 'linear' }}
              className="absolute inset-0"
            >
              <Image
                src={item.images?.[0] || '/images/placeholder.jpg'}
                alt={item.name}
                fill
                priority={current === 0}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </m.div>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
              <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3">Bestseller</p>
              <p className="text-xs uppercase tracking-wider text-white/70 mb-1">{item.brand}</p>
              <h3 className="text-2xl sm:text-3xl font-normal mb-2">{item.name}</h3>
              <p className="text-sm text-white/90">À partir de {formatPrice(getPrice(item))} €</p>
            </div>
          </Link>
        </m.div>
      </AnimatePresence>
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 flex gap-1.5 z-10">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Voir produit ${i + 1}`}
            className={`h-0.5 transition-all ${i === current ? 'w-10 bg-primary' : 'w-6 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
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

interface HomeClientProps {
  featuredProducts: Product[]
  newProducts: Product[]
  promoProducts: Product[]
  packs: HomePack[]
  orderCount: number
}

export default function HomeClient({ featuredProducts, newProducts, promoProducts, packs, orderCount }: HomeClientProps) {
  const bestsellersCarouselRef = useRef<DraggableCarouselHandle>(null)
  const newProductsCarouselRef = useRef<DraggableCarouselHandle>(null)
  const promosCarouselRef = useRef<DraggableCarouselHandle>(null)
  const scrollStep = 320
  const [videos, setVideos] = useState<string[]>(['/videos/decantage.mp4'])
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoVisible, setVideoVisible] = useState(true)

  useEffect(() => {
    supabase
      .from('home_videos')
      .select('url, order_index')
      .eq('active', true)
      .order('order_index')
      .then(({ data }) => {
        if (data && data.length > 0) setVideos(data.map(v => v.url))
      })
  }, [])

  useEffect(() => {
    if (videos.length <= 1) return
    const interval = setInterval(() => {
      setVideoVisible(false)
      setTimeout(() => {
        setVideoIndex(i => (i + 1) % videos.length)
        setVideoVisible(true)
      }, 600)
    }, 8000)
    return () => clearInterval(interval)
  }, [videos])

  return (
    <div className="min-h-screen">
      {/* Hero Section — split 3/5 text · 2/5 slider */}
      <section className="relative lg:min-h-screen overflow-hidden text-white">
        <div className="absolute inset-0 z-0">
          <Image src="/images/hero-bg.webp" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 lg:min-h-screen pt-24 lg:pt-0">
          <div className="lg:col-span-3 relative flex items-center px-6 sm:px-10 lg:px-20 py-12 sm:py-16 lg:py-0">
            <div className="max-w-4xl relative z-10 text-white w-full">
              <h1 className="animate-fade-in-up stagger-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.1] sm:leading-[1.05] mb-6 sm:mb-8 tracking-tight">
                Découvrez des parfums rares<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-primary italic">sans acheter le flacon</span>
              </h1>
              <p className="animate-fade-in-up stagger-2 text-sm sm:text-base text-white/90 mb-8 sm:mb-10 leading-relaxed max-w-2xl">
                Braza Scent est spécialisé dans le décantage à partir de flacons authentiques :
                parfumerie de niche, éditions limitées et pièces issues de collections privées.
              </p>
              <div className="animate-fade-in-up stagger-3">
                <Link href="/parfums" className="btn-luxury inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-primary text-primary-foreground text-xs sm:text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-light transition-colors">
                  Découvrir la sélection
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="animate-fade-in-up stagger-4 mt-8 flex flex-wrap gap-2 mb-6">
                {[
                  { label: 'Best sellers', href: '/parfums?sort=bestseller' },
                  { label: 'Nouveautés',   href: '/parfums?sort=newest' },
                  { label: 'Packs',        href: '/packs' },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="px-4 py-1.5 border border-white/25 text-white/80 text-xs tracking-[0.15em] uppercase hover:border-primary hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="animate-fade-in-up stagger-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {([
                  { Icon: ShieldCheck, label: '100% authentique' },
                  { Icon: Zap,         label: 'Expédition 24/48h' },
                  { Icon: Layers,      label: 'Formats disponibles', sub: '2 / 5 / 10 ml' },
                  { Icon: Gift,        label: 'Échantillon offert' },
                ] as { Icon: React.ElementType; label: string; sub?: string }[]).map(({ Icon, label, sub }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <span className="text-xs text-white/75 tracking-wide">{label}</span>
                      {sub && <p className="text-[10px] text-white/45 tracking-wide mt-0.5">{sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Link href="#comment-ca-marche" aria-label="Comment ça marche" className="hidden lg:flex absolute bottom-10 left-20 z-10 flex-col items-center gap-3 text-white/70 hover:text-primary transition-colors group">
              <span className="text-[11px] tracking-[0.35em] uppercase">Comment ça marche</span>
              <m.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
              </m.div>
            </Link>
          </div>

          <div className="lg:col-span-2 relative aspect-[3/4] sm:aspect-[16/10] lg:aspect-auto lg:min-h-screen">
            <HeroBestsellersSlider products={featuredProducts} />
          </div>
        </div>
      </section>

      {/* Pourquoi Braza Scent */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-left relative aspect-[9/16] w-[360px] max-w-full mx-auto lg:col-span-2 overflow-hidden bg-black">
              <video
                key={videos[videoIndex]}
                src={videos[videoIndex]}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-600"
                style={{ opacity: videoVisible ? 1 : 0 }}
              />
            </div>
            <div className="lg:col-span-3">
              <span className="text-xs tracking-[0.35em] uppercase text-primary mb-4 block">Notre approche</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.1] mb-6">
                L&apos;exigence du <span className="italic text-primary">détail</span>,<br />au service du parfum.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-12 max-w-lg">
                Chaque décant est préparé à la main, à partir de flacons authentiques. Une démarche artisanale pour faire découvrir les plus belles fragrances.
              </p>
              <div className="flex items-center gap-3 mb-10">
                <div className="flex text-primary text-lg leading-none">{'★★★★★'}</div>
                <p className="text-sm text-muted-foreground">
                  Déjà <span className="text-foreground font-medium">{orderCount}</span> commandes expédiées
                </p>
              </div>

              <div className="space-y-8">
                {[
                  { num: '01', title: 'Authenticité', desc: 'Décantage exclusivement à partir de flacons originaux, jamais de copies ni de reformulations.' },
                  { num: '02', title: 'Sélection', desc: 'Parfumerie de niche, éditions limitées et pièces issues de collections privées.' },
                  { num: '03', title: 'Soin', desc: 'Matériel stérile, dosage précis, packaging sécurisé. Chaque commande est préparée comme une pièce unique.' },
                ].map((item) => (
                  <div key={item.num} className="grid grid-cols-[auto_1fr] gap-6 pb-8 border-b border-border last:border-b-0 last:pb-0">
                    <span className="font-serif text-2xl text-primary leading-none">{item.num}</span>
                    <div>
                      <h3 className="text-lg tracking-[0.15em] uppercase mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best-sellers */}
      <section className="py-20 lg:py-28 bg-cream overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">Les plus populaires</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">Best-sellers</h2>
              <div className="w-24 h-px bg-primary mt-6" />
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => bestsellersCarouselRef.current?.scrollByAmount(-scrollStep)} aria-label="Précédent" className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => bestsellersCarouselRef.current?.scrollByAmount(scrollStep)} aria-label="Suivant" className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <Link href="/parfums" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group">
                Voir tout <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
        {featuredProducts.length > 0 ? (
          <DraggableCarousel ref={bestsellersCarouselRef} products={featuredProducts} />
        ) : (
          <p className="text-center text-muted-foreground py-10">Aucun best-seller pour le moment</p>
        )}
      </section>

      {/* Nouveautés */}
      <section className="py-20 lg:py-28 bg-background overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">Fraîchement arrivés</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">Nouveautés</h2>
              <div className="w-24 h-px bg-primary mt-6" />
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => newProductsCarouselRef.current?.scrollByAmount(-scrollStep)} aria-label="Précédent" className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => newProductsCarouselRef.current?.scrollByAmount(scrollStep)} aria-label="Suivant" className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <Link href="/parfums" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group">
                Voir tout <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
        {newProducts.length > 0 ? (
          <DraggableCarousel ref={newProductsCarouselRef} products={newProducts} />
        ) : (
          <p className="text-center text-muted-foreground py-10">Aucune nouveauté pour le moment</p>
        )}
      </section>

      {/* Promos */}
      {promoProducts.length > 0 && (
        <section className="py-20 lg:py-28 bg-background overflow-hidden">
          <div className="px-6 sm:px-10 lg:px-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <span className="text-sm tracking-[0.3em] uppercase text-red-500 mb-4 block">Offres limitées</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">Promos</h2>
                <div className="w-24 h-px bg-red-500 mt-6" />
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={() => promosCarouselRef.current?.scrollByAmount(-scrollStep)} aria-label="Précédent" className="w-10 h-10 flex items-center justify-center border border-border hover:border-red-500 hover:text-red-500 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => promosCarouselRef.current?.scrollByAmount(scrollStep)} aria-label="Suivant" className="w-10 h-10 flex items-center justify-center border border-border hover:border-red-500 hover:text-red-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <Link href="/promos" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-red-500 transition-colors group">
                  Voir toutes les promos <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
          <DraggableCarousel ref={promosCarouselRef} products={promoProducts} />
        </section>
      )}

      {/* Coffrets & Packs */}
      {packs.length > 0 && (
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="px-6 sm:px-10 lg:px-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">Idées cadeaux</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">Coffrets</h2>
                <div className="w-24 h-px bg-primary mt-6" />
              </div>
              <Link href="/packs" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group">
                Voir tous les coffrets <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {packs.map((pack, index) => {
                const discount = pack.original_price
                  ? Math.round((1 - pack.price / pack.original_price) * 100)
                  : 0
                return (
                  <m.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/packs/${pack.slug}`} className="group block">
                      <div className="relative aspect-square overflow-hidden bg-cream mb-4">
                        <Image
                          src={pack.image}
                          alt={pack.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {pack.tag && (
                            <span className="px-3 py-1 bg-primary text-white text-xs tracking-[0.15em] uppercase">
                              {pack.tag}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="px-3 py-1 bg-background text-foreground text-xs tracking-[0.15em] uppercase">
                              -{discount}%
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-light tracking-wide mb-1 group-hover:text-primary transition-colors">
                        {pack.name}
                      </h3>
                      <p className="text-sm text-background/60 mb-2 line-clamp-2">{pack.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatPrice(pack.price)} €</span>
                        {pack.original_price && (
                          <span className="text-sm text-background/40 line-through">
                            {formatPrice(pack.original_price)} €
                          </span>
                        )}
                      </div>
                    </Link>
                  </m.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-20 lg:py-32 bg-cream">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="text-center mb-20">
            <span className="text-xs tracking-[0.35em] uppercase text-primary mb-4 block">Notre processus</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] mb-6">
              Comment ça <span className="italic text-primary">marche ?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Décanter, c&apos;est découvrir sans se tromper. Voici comment nous garantissons une expérience parfumée authentique, du flacon original jusqu&apos;à ta porte.
            </p>
          </div>

          <div className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary">01 · Process</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 relative">
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-primary/30" aria-hidden />
              {[
                { num: '01', title: 'Choisis ton parfum', desc: 'Sélectionne la fragrance et le format (2/5/10ml).' },
                { num: '02', title: 'Préparation', desc: 'Décantage propre et précis à partir d\'un flacon authentique.' },
                { num: '03', title: 'Packaging', desc: 'Emballage soigné et sécurisé pour un transport sans stress.' },
                { num: '04', title: 'Réception', desc: 'Tu testes sur plusieurs jours et tu profites de la niche.' },
              ].map((step) => (
                <div key={step.num} className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-cream border border-primary rounded-full flex items-center justify-center relative z-10">
                    <span className="text-primary text-base font-serif">{step.num}</span>
                  </div>
                  <h3 className="text-base tracking-[0.15em] uppercase mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary">02 · Formats</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="mb-10 max-w-2xl">
              <p className="text-muted-foreground leading-relaxed">Le décantage te permet de tester une fragrance sur plusieurs jours (peau, météo, tenue) avant d&apos;investir dans un flacon complet.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-10">
              {[
                { size: '2ml', label: 'Test rapide', sprays: '≈ 45 sprays' },
                { size: '5ml', label: 'Découverte complète', sprays: '≈ 110 sprays' },
                { size: '10ml', label: 'Vrai usage', sprays: '≈ 220 sprays' },
              ].map((format) => (
                <div key={format.size} className="p-4 sm:p-8 lg:p-10 border border-border bg-background text-center hover:border-primary transition-colors">
                  <div className="font-serif text-3xl sm:text-5xl lg:text-6xl text-primary mb-2">{format.size}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground tracking-[0.2em] uppercase mb-2">{format.label}</div>
                  <div className="text-xs sm:text-sm font-medium">{format.sprays}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary">03 · Engagement</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="p-8 lg:p-10 border border-border bg-background">
                <h3 className="text-base tracking-[0.15em] uppercase mb-4 flex items-center gap-3"><span className="text-primary font-serif">★</span>Authenticité</h3>
                <p className="text-muted-foreground leading-relaxed">Décantage réalisé à partir de flacons <strong className="text-foreground">authentiques</strong> (niche & collection privée). Aucune copie, aucune reformulation.</p>
              </div>
              <div className="p-8 lg:p-10 border border-border bg-background">
                <h3 className="text-base tracking-[0.15em] uppercase mb-4 flex items-center gap-3"><span className="text-primary font-serif">★</span>Soin & transparence</h3>
                <p className="text-muted-foreground leading-relaxed">Matériel stérile, manipulation soignée, packaging sécurisé, stock mis à jour selon disponibilité réelle.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avis */}
      <section className="py-20 lg:py-28 bg-background overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="text-center mb-12">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">Témoignages</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">Avis clients</h2>
            <div className="w-24 h-px bg-primary mx-auto" />
          </div>
        </div>
        <div className="relative">
          <m.div className="flex gap-6" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
            {[...reviews, ...reviews].map((review, index) => (
              <div key={index} className="flex-shrink-0 w-80 p-6 bg-cream border border-border">
                <div className="text-primary text-lg mb-3">★★★★★</div>
                <p className="text-muted-foreground mb-4 italic leading-relaxed text-sm">&ldquo;{review.text}&rdquo;</p>
                <p className="text-sm text-muted-foreground">{review.name}</p>
              </div>
            ))}
          </m.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="px-6 sm:px-10 lg:px-20 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">Contact</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.1] mb-6">
              Une demande, une recherche,<br className="hidden sm:block" />
              <span className="italic text-primary">une pièce rare ?</span>
            </h2>
            <div className="w-24 h-px bg-primary mx-auto mb-8" />
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Écris-moi pour une recommandation, une disponibilité, ou un conseil (familles olfactives, saisons, tenue).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-luxury px-10 py-4 bg-primary text-primary-foreground text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-light transition-colors">
                Me contacter
              </Link>
              <Link href="/parfums" className="px-10 py-4 border border-foreground text-foreground text-sm tracking-[0.2em] uppercase font-medium hover:bg-foreground hover:text-background transition-colors">
                Voir le catalogue
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
