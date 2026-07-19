'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ShieldCheck, Zap, Layers, Gift, Truck, Lock } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'
import { HomePack } from '../page'
import { formatPrice } from '@/lib/format'
import { useSettingsStore } from '@/store/settings'

// ─── DraggableCarousel ────────────────────────────────────────────────────────

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
  const touchStartY = useRef(0)
  const touchScrollLeft = useRef(0)
  const hasTouchDragged = useRef(false)
  const isVerticalGesture = useRef(false)
  const touchLastX = useRef(0)
  const touchLastTime = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    stopMomentum()
    touchStartX.current = e.touches[0].pageX
    touchStartY.current = e.touches[0].pageY
    touchLastX.current = e.touches[0].pageX
    touchLastTime.current = Date.now()
    touchScrollLeft.current = containerRef.current.scrollLeft
    hasTouchDragged.current = false
    isVerticalGesture.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || isVerticalGesture.current) return
    const x = e.touches[0].pageX
    const y = e.touches[0].pageY
    const diffX = touchStartX.current - x
    const diffY = touchStartY.current - y
    const now = Date.now()
    const dt = now - touchLastTime.current
    if (!hasTouchDragged.current && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
      if (Math.abs(diffY) > Math.abs(diffX)) { isVerticalGesture.current = true; return }
    }
    if (Math.abs(diffX) > dragThreshold) hasTouchDragged.current = true
    if (hasTouchDragged.current) {
      if (dt > 0) velocity.current = (touchLastX.current - x) / dt * 15
      touchLastX.current = x
      touchLastTime.current = now
      containerRef.current.scrollLeft = touchScrollLeft.current + diffX
    }
  }

  const handleTouchEnd = () => {
    if (hasTouchDragged.current && Math.abs(velocity.current) > 1) applyMomentum()
    setTimeout(() => { hasTouchDragged.current = false }, 100)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onTouchMove = (e: TouchEvent) => {
      if (hasTouchDragged.current && !isVerticalGesture.current) e.preventDefault()
    }
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => container.removeEventListener('touchmove', onTouchMove)
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || hasTouchDragged.current) { e.preventDefault(); e.stopPropagation() }
  }

  useEffect(() => {
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current) }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex gap-6 sm:gap-8 lg:gap-10 pl-6 sm:pl-10 lg:pl-20 pr-6 sm:pr-10 lg:pr-20 overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab select-none"
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

// ─── HeroBestsellersSlider ────────────────────────────────────────────────────

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
                fetchPriority={current === 0 ? 'high' : 'auto'}
                decoding={current === 0 ? 'sync' : 'async'}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </m.div>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
              <p className="text-[10px] tracking-[0.3em] uppercase text-primary-text mb-3">Bestseller</p>
              <p className="text-xs uppercase tracking-wider text-white/70 mb-1">{item.brand}</p>
              <p className="text-2xl sm:text-3xl font-normal mb-2">{item.name}</p>
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
            aria-pressed={i === current}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center group"
          >
            <span className={`block h-0.5 transition-all ${i === current ? 'w-10 bg-primary' : 'w-6 bg-white/40 group-hover:bg-white/70'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

const reviews = [
  { text: 'Décants impeccables et packaging ultra soigné. On sent le sérieux.', name: 'Ale***' },
  { text: 'Parfums rares introuvables ailleurs, expédition rapide. Je recommande.', name: 'Max***' },
  { text: "Top pour tester sur plusieurs jours avant d'acheter un flacon complet.", name: 'Jul***' },
  { text: 'Qualité au rendez-vous, je suis conquis par le service.', name: 'Tho***' },
  { text: 'Enfin un vendeur sérieux pour les décants de niche !', name: 'Luc***' },
  { text: 'Livraison rapide, parfums authentiques. Parfait.', name: 'Nic***' },
  { text: "J'ai pu tester 5 parfums avant de me décider. Génial !", name: 'Ant***' },
  { text: 'Le packaging est vraiment premium, on se sent privilégié.', name: 'Mar***' },
  { text: "Service client au top, réponse en moins d'une heure.", name: 'Pie***' },
  { text: 'Les décants sont parfaitement dosés, rien à redire.', name: 'Flo***' },
  { text: "Ma collection s'agrandit grâce à Braza Scent !", name: 'Vin***' },
  { text: 'Première commande et déjà fidèle. Bravo !', name: 'Pau***' },
  { text: "Des fragrances introuvables en France, merci !", name: 'Adri***' },
  { text: 'Rapport qualité/prix imbattable pour du niche.', name: 'Seb***' },
  { text: "J'ai offert un coffret, succès garanti.", name: 'Cha***' },
  { text: 'Emballage soigné, livraison express. Top !', name: 'Lou***' },
  { text: "Parfait pour découvrir avant d'investir.", name: 'Rap***' },
  { text: "Sélection pointue, on voit la passion.", name: 'Bap***' },
  { text: 'Commande reçue en 48h, nickel chrome.', name: 'Yac***' },
  { text: 'Je recommande les yeux fermés.', name: 'Kar***' },
  { text: 'Décants généreux et bien présentés.', name: 'Emi***' },
  { text: 'Enfin trouvé mon parfum signature grâce aux tests.', name: 'Cla***' },
  { text: 'Communication parfaite du début à la fin.', name: 'Gab***' },
  { text: 'Qualité identique aux flacons originaux.', name: 'Léo***' },
  { text: 'Parfums frais et puissants, excellente tenue.', name: 'Dyl***' },
  { text: "Livraison offerte dès 50€, c'est cadeau !", name: 'Jes***' },
  { text: 'Mes amis me demandent tous où je trouve mes parfums.', name: 'Kev***' },
  { text: 'Service impeccable, je suis client régulier.', name: 'Rom***' },
  { text: 'Les notes olfactives sont bien décrites.', name: 'Axe***' },
  { text: 'Parfait pour les collectionneurs comme moi.', name: 'Dam***' },
]

// ─── FaqItem ──────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 text-left group"
      >
        <span className="text-sm sm:text-base tracking-[0.05em] font-light group-hover:text-primary transition-colors">
          {question}
        </span>
        <span className={`text-primary flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {answer}
        </p>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DecantageParfumClientProps {
  featuredProducts: Product[]
  newProducts: Product[]
  promoProducts: Product[]
  packs: HomePack[]
  orderCount: number
  initialVideos: string[]
}

export default function DecantageParfumClient({
  featuredProducts,
  newProducts,
  promoProducts,
  packs,
  orderCount,
  initialVideos,
}: DecantageParfumClientProps) {
  const { settings } = useSettingsStore()
  const freeShippingThreshold = settings.freeShippingThreshold || 120
  const bestsellersCarouselRef = useRef<DraggableCarouselHandle>(null)
  const newProductsCarouselRef = useRef<DraggableCarouselHandle>(null)
  const promosCarouselRef = useRef<DraggableCarouselHandle>(null)
  const scrollStep = 320
  const [videos] = useState<string[]>(initialVideos)
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoVisible, setVideoVisible] = useState(true)
  const [videoInViewport, setVideoInViewport] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = videoContainerRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVideoInViewport(true); obs.disconnect() } },
      { rootMargin: '100px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (videos.length <= 1) return
    const interval = setInterval(() => {
      setVideoVisible(false)
      setTimeout(() => { setVideoIndex(i => (i + 1) % videos.length); setVideoVisible(true) }, 600)
    }, 8000)
    return () => clearInterval(interval)
  }, [videos])

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative lg:min-h-screen overflow-hidden text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.webp"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAABwAQCdASoKAAYABUB8JS7AIwARYAD+7t3XgfKRGzg824W/L40uP8mJk7DAAA=="
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 lg:min-h-screen pt-24 lg:pt-0">
          <div className="lg:col-span-3 relative flex items-center px-6 sm:px-10 lg:px-20 py-12 sm:py-16 lg:py-0">
            <div className="max-w-4xl relative z-10 text-white w-full">

              {/* Breadcrumb */}
              <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-white/50 mb-6 tracking-wide">
                <Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/70">Décantage parfum</span>
              </nav>

              <h1 className="animate-fade-in-up stagger-1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.1] sm:leading-[1.05] tracking-tight">
                Décantage parfum :<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-primary italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">testez avant d&apos;acheter</span>
              </h1>
              <p className="animate-fade-in-up stagger-2 text-sm sm:text-base text-white/80 mt-8 sm:mt-10 mb-8 sm:mb-10 leading-relaxed max-w-lg">
                Décants authentiques prélevés de flacons officiels.<br />
                Chanel, Dior, Creed, Tom Ford — en 2ml, 5ml, 10ml et 30ml.
              </p>
              <div className="animate-fade-in-up stagger-3">
                <Link href="/parfums" className="btn-luxury inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-primary text-primary-foreground text-xs sm:text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-light transition-colors">
                  Voir les parfums en décant
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="animate-fade-in-up stagger-4 mt-8 flex flex-wrap gap-2 mb-6">
                {[
                  { label: 'Best sellers',  href: '/parfums?sort=bestseller' },
                  { label: 'Nouveautés',    href: '/parfums?sort=newest' },
                  { label: 'Packs décant', href: '/packs' },
                  { label: 'Par marque',   href: '/marques' },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="px-4 py-2.5 border border-white/25 text-white/80 text-xs tracking-[0.15em] uppercase hover:border-primary hover:text-primary transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <div className="animate-fade-in-up stagger-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {([
                  { Icon: ShieldCheck, label: '100% authentique' },
                  { Icon: Zap,         label: 'Expédition 24/48h' },
                  { Icon: Layers,      label: 'Formats disponibles', sub: '2 / 5 / 10 / 30 ml' },
                  { Icon: Gift,        label: 'Échantillon offert' },
                  { Icon: Truck,       label: 'Livraison offerte', sub: `Dès ${freeShippingThreshold} €` },
                  { Icon: Lock,        label: 'Paiement sécurisé', sub: 'SSL · 3D Secure' },
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

            <Link href="#decantage-definition" aria-label="Qu'est-ce que le décantage ?" className="hidden lg:flex absolute bottom-10 left-20 z-10 flex-col items-center gap-3 text-white/70 hover:text-primary transition-colors group">
              <span className="text-[11px] tracking-[0.35em] uppercase">Qu&apos;est-ce que c&apos;est ?</span>
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

      {/* ── Définition du décantage ──────────────────────────────────────── */}
      <section id="decantage-definition" className="py-20 lg:py-28 bg-background">
        <div className="px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            <div ref={videoContainerRef} className="animate-fade-in-left relative aspect-[9/16] w-[360px] max-w-full mx-auto lg:col-span-2 overflow-hidden bg-black">
              {videos.length > 0 ? (
                <video
                  key={videoInViewport ? videos[videoIndex] : 'poster-only'}
                  src={videoInViewport ? videos[videoIndex] : undefined}
                  autoPlay={videoInViewport}
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/videos/decantage-poster.webp"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-600"
                  style={{ opacity: videoVisible ? 1 : 0 }}
                />
              ) : (
                <img
                  src="/videos/decantage-poster.webp"
                  alt="Décantage de parfum BrazaScent"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
            <div className="lg:col-span-3">
              <span className="text-xs tracking-[0.35em] uppercase text-primary-text mb-4 block">Le décantage parfum</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.1] mb-6">
                Tester un parfum <span className="italic text-primary-text">en conditions réelles</span>,<br />sans investir à l&apos;aveugle.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 max-w-lg">
                Le <strong className="text-foreground">décantage parfum</strong> consiste à transférer du parfum depuis le flacon d&apos;origine (Chanel, Dior, Creed…) vers un petit atomiseur. Vous recevez le même jus — même concentration, même sillage — en format 2ml, 5ml, 10ml ou 30ml.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-12 max-w-lg">
                Contrairement à un échantillon papier distribué en boutique, un <strong className="text-foreground">décant</strong> vous donne assez de produit pour plusieurs semaines. Suffisant pour voir comment la fragrance évolue sur votre peau, à différentes heures, dans différentes météos — avant de décider.
              </p>
              <div className="flex items-center gap-3 mb-10">
                <div className="flex text-primary-text text-lg leading-none">{'★★★★★'}</div>
                <p className="text-sm text-muted-foreground">
                  Déjà <span className="text-foreground font-medium">{orderCount}</span> commandes expédiées
                </p>
              </div>
              <div className="space-y-8">
                {[
                  { num: '01', title: 'Authenticité garantie', desc: 'Chaque décant est prélevé directement du flacon officiel de la marque. Aucune dilution, aucune copie, aucune reformulation.' },
                  { num: '02', title: 'Sélection de niche', desc: 'Parfumerie de niche, éditions limitées, grandes maisons — des fragrances rarement disponibles à l\'essai en boutique.' },
                  { num: '03', title: 'Préparation artisanale', desc: 'Matériel stérile, dosage précis, packaging sécurisé. Chaque commande est conditionnée comme une pièce unique.' },
                ].map((item) => (
                  <div key={item.num} className="grid grid-cols-[auto_1fr] gap-6 pb-8 border-b border-border last:border-b-0 last:pb-0">
                    <span className="font-serif text-2xl text-primary-text leading-none">{item.num}</span>
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

      {/* ── Best-sellers ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-cream overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-sm tracking-[0.3em] uppercase text-primary-text mb-4 block">Décants les plus populaires</span>
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
              <Link href="/parfums?sort=bestseller" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group">
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

      {/* ── Nouveautés ───────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-background overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <span className="text-sm tracking-[0.3em] uppercase text-primary-text mb-4 block">Fraîchement décantés</span>
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
              <Link href="/parfums?sort=newest" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group">
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

      {/* ── Promos ───────────────────────────────────────────────────────── */}
      {promoProducts.length > 0 && (
        <section className="py-20 lg:py-28 bg-background overflow-hidden">
          <div className="px-6 sm:px-10 lg:px-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <span className="text-sm tracking-[0.3em] uppercase text-red-400 mb-4 block">Offres limitées</span>
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

      {/* ── Packs ────────────────────────────────────────────────────────── */}
      {packs.length > 0 && (
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="px-6 sm:px-10 lg:px-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <span className="text-sm tracking-[0.3em] uppercase text-primary-text mb-4 block">Découverte & Cadeaux</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">Coffrets décant</h2>
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
                            <span className="px-3 py-1 bg-primary text-white text-xs tracking-[0.15em] uppercase">{pack.tag}</span>
                          )}
                          {discount > 0 && (
                            <span className="px-3 py-1 bg-background text-foreground text-xs tracking-[0.15em] uppercase">-{discount}%</span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-light tracking-wide mb-1 group-hover:text-primary transition-colors">{pack.name}</h3>
                      <p className="text-sm text-background/60 mb-2 line-clamp-2">{pack.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatPrice(pack.price)} €</span>
                        {pack.original_price && (
                          <span className="text-sm text-background/50 line-through">{formatPrice(pack.original_price)} €</span>
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

      {/* ── Comment ça marche ────────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="py-20 lg:py-32 bg-cream">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="text-center mb-20">
            <span className="text-xs tracking-[0.35em] uppercase text-primary-text mb-4 block">Notre processus</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] mb-6">
              Comment fonctionne<br /><span className="italic text-primary-text">le décantage ?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Du flacon officiel à votre atomiseur, chaque étape est contrôlée. Le même parfum, en format découverte.
            </p>
          </div>

          <div className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary-text">01 · Process décantage</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 relative">
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-primary/30" aria-hidden />
              {[
                { num: '01', title: 'Choisissez', desc: 'Parcourez notre catalogue et sélectionnez votre fragrance. Filtrez par marque, note olfactive ou famille.' },
                { num: '02', title: 'On décante', desc: 'Prélevé directement du flacon authentique, avec précision et matériel stérile. Sans intermédiaire.' },
                { num: '03', title: 'Expédition', desc: 'Conditionné avec soin dans les 24h. Chaque décant arrive intact, prêt à être découvert.' },
                { num: '04', title: 'Votre verdict', desc: 'Portez-le. Vivez-le. Décidez en toute confiance avant d\'investir dans le flacon complet.' },
              ].map((step) => (
                <div key={step.num} className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-cream border border-primary rounded-full flex items-center justify-center relative z-10">
                    <span className="text-primary-text text-base font-serif">{step.num}</span>
                  </div>
                  <h3 className="text-base tracking-[0.15em] uppercase mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-24">
            <div className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary-text">02 · Formats disponibles</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="mb-10 max-w-2xl">
              <p className="text-muted-foreground leading-relaxed">
                Du test express à l&apos;usage prolongé : choisissez le format adapté à votre niveau de curiosité. Chaque ml compte.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 lg:gap-10">
              {[
                { size: '2ml', label: 'Test rapide', sprays: '≈ 44 sprays' },
                { size: '5ml', label: 'Découverte complète', sprays: '≈ 110 sprays' },
                { size: '10ml', label: 'Vrai usage', sprays: '≈ 220 sprays' },
                { size: '30ml', label: 'Format flacon', sprays: '≈ 660 sprays' },
              ].map((format) => (
                <div key={format.size} className="p-4 sm:p-8 lg:p-10 border border-border bg-background text-center hover:border-primary transition-colors">
                  <div className="font-serif text-3xl sm:text-5xl lg:text-6xl text-primary-text mb-2">{format.size}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground tracking-[0.2em] uppercase mb-2">{format.label}</div>
                  <div className="text-xs sm:text-sm font-medium">{format.sprays}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary-text">03 · Nos engagements</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="p-8 lg:p-10 border border-border bg-background">
                <h3 className="text-base tracking-[0.15em] uppercase mb-4 flex items-center gap-3">
                  <span className="text-primary-text font-serif">★</span>Authenticité
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Décantage réalisé à partir de flacons <strong className="text-foreground">authentiques</strong> issus de maisons officielles. Aucune copie, aucune reformulation. Ce que vous recevez est identique à ce qu&apos;on trouve en parfumerie.
                </p>
              </div>
              <div className="p-8 lg:p-10 border border-border bg-background">
                <h3 className="text-base tracking-[0.15em] uppercase mb-4 flex items-center gap-3">
                  <span className="text-primary-text font-serif">★</span>Soin &amp; transparence
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Matériel stérile, manipulation soignée, packaging sécurisé, stock mis à jour selon disponibilité réelle. Chaque commande est préparée avec le soin d&apos;un artisan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marques disponibles ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="text-center mb-12">
            <span className="text-sm tracking-[0.3em] uppercase text-primary-text mb-4 block">Sélection</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">
              Marques disponibles en décant
            </h2>
            <div className="w-24 h-px bg-primary mx-auto mb-8" />
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
              Notre catalogue s&apos;articule autour des grandes maisons de parfumerie et des créateurs de niche.
              Des fragrances rarement disponibles à l&apos;essai, accessibles en format découverte.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto mb-10">
            {[
              { name: 'Chanel', slug: 'chanel' },
              { name: 'Dior', slug: 'dior' },
              { name: 'Creed', slug: 'creed' },
              { name: 'Tom Ford', slug: 'tom-ford' },
              { name: 'Maison Margiela', slug: 'maison-margiela' },
              { name: 'Parfums de Marly', slug: 'parfums-de-marly' },
            ].map(({ name, slug }) => (
              <Link
                key={slug}
                href={`/marques/${slug}`}
                className="border border-border px-4 py-3 text-center text-sm tracking-wide hover:border-primary hover:text-primary transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link href="/marques" className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group">
              Voir toutes les marques <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Avis clients ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-cream overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <div className="text-center mb-12">
            <span className="text-sm tracking-[0.3em] uppercase text-primary-text mb-4 block">Témoignages</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">Avis clients</h2>
            <div className="w-24 h-px bg-primary mx-auto" />
          </div>
        </div>
        <div className="relative">
          <m.div className="flex gap-6" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
            {[...reviews, ...reviews].map((review, index) => (
              <div key={index} className="flex-shrink-0 w-80 p-6 bg-background border border-border">
                <div className="text-primary-text text-lg mb-3">★★★★★</div>
                <p className="text-muted-foreground mb-4 italic leading-relaxed text-sm">&ldquo;{review.text}&rdquo;</p>
                <p className="text-sm text-muted-foreground">{review.name}</p>
              </div>
            ))}
          </m.div>
        </div>
      </section>

      {/* ── FAQ décantage ────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="px-6 sm:px-10 lg:px-20 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs tracking-[0.3em] uppercase text-primary-text mb-4 block">Tout savoir sur le décantage</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">Questions fréquentes</h2>
            <div className="w-24 h-px bg-primary mx-auto mt-6" />
          </div>
          <div className="divide-y divide-border">
            {[
              {
                q: "Qu'est-ce que le décantage de parfum ?",
                a: "Le décantage consiste à transférer du parfum depuis le flacon d'origine de la maison (Chanel, Dior, Creed…) vers un petit atomiseur (2ml, 5ml, 10ml ou 30ml). Vous recevez le même parfum qu'en boutique, dans la même concentration, sans aucune modification.",
              },
              {
                q: 'Les parfums décantés sont-ils authentiques ?',
                a: "Oui, absolument. Chaque décant est prélevé directement depuis le flacon officiel de la marque. Aucune copie, aucune reformulation. Ce que vous recevez, c'est le parfum tel qu'il a été créé par la maison.",
              },
              {
                q: 'Le parfum est-il dilué ?',
                a: "Non. Nos décants sont du parfum pur, sans ajout de solvant ni d'alcool supplémentaire. La concentration (EDT, EDP, Parfum) est identique à celle du flacon d'origine.",
              },
              {
                q: 'Combien de sprays y a-t-il dans un décant ?',
                a: "Un décant 2ml correspond à environ 44 sprays, un 5ml à environ 110 sprays, un 10ml à environ 220 sprays et un 30ml à environ 660 sprays. À raison de 2 à 3 sprays par utilisation, un 5ml représente plusieurs semaines de test quotidien.",
              },
              {
                q: 'Pourquoi acheter un décant plutôt qu\'un flacon complet ?',
                a: "Pour tester un parfum à 200–400€ sans investir à l'aveugle. Un décant vous permet de porter la fragrance sur votre peau pendant plusieurs semaines, d'observer son évolution aux différentes heures de la journée, et de décider en toute connaissance.",
              },
              {
                q: 'Quelles marques sont disponibles en décantage ?',
                a: "Notre catalogue inclut Chanel, Dior, Creed, Tom Ford, Maison Margiela, Parfums de Marly, Initio, Kilian, Guerlain et bien d'autres. Il s'enrichit régulièrement avec les nouvelles sorties.",
              },
              {
                q: 'Combien de temps met la livraison ?',
                a: "Chaque commande est préparée sous 24h et expédiée en 24 à 48h ouvrées. Un numéro de suivi vous est transmis dès l'envoi. La livraison est offerte dès un certain montant de commande.",
              },
              {
                q: 'Puis-je offrir un décant en cadeau ?',
                a: "Absolument. Nos packs découverte sont pensés comme des coffrets premium — idéaux pour offrir une expérience olfactive sans se tromper de fragrance. Plusieurs formats et thématiques disponibles.",
              },
            ].map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO text + maillage interne ──────────────────────────────────── */}
      <section className="py-16 bg-cream border-t border-border">
        <div className="px-6 sm:px-10 lg:px-20 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-lg tracking-[0.15em] uppercase mb-4">Le décantage parfum chez BrazaScent</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                BrazaScent est une boutique française spécialisée dans le <strong className="text-foreground">décantage de parfum</strong>.
                Notre mission : rendre accessible les plus grandes fragrances de luxe grâce à des{' '}
                <Link href="/parfums" className="text-foreground underline hover:text-primary transition-colors">décants authentiques</Link>{' '}
                en formats 2ml, 5ml, 10ml et 30ml.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Que vous cherchiez un <Link href="/homme" className="text-foreground underline hover:text-primary transition-colors">parfum homme</Link>{' '}
                ou un <Link href="/femme" className="text-foreground underline hover:text-primary transition-colors">parfum femme</Link>,{' '}
                une <Link href="/parfums/florale" className="text-foreground underline hover:text-primary transition-colors">fragrance florale</Link>{' '}
                ou <Link href="/parfums/orientale" className="text-foreground underline hover:text-primary transition-colors">orientale</Link>,{' '}
                notre catalogue de <Link href="/marques" className="text-foreground underline hover:text-primary transition-colors">grandes marques</Link>{' '}
                couvre tous les styles et toutes les saisons.
              </p>
            </div>
            <div>
              <h2 className="text-lg tracking-[0.15em] uppercase mb-4">Explorer par note olfactive</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Chaque fragrance est décrite par ses <Link href="/notes" className="text-foreground underline hover:text-primary transition-colors">notes olfactives</Link>.
                Explorez nos décants par ingrédient : de la rose au vétiver, du santal à la bergamote.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { name: 'Rose', slug: 'rose' },
                  { name: 'Santal', slug: 'santal' },
                  { name: 'Vétiver', slug: 'vetiver' },
                  { name: 'Bergamote', slug: 'bergamote' },
                  { name: 'Oud', slug: 'oud' },
                  { name: 'Musc', slug: 'musc' },
                ].map(({ name, slug }) => (
                  <Link
                    key={slug}
                    href={`/notes/${slug}`}
                    className="text-xs px-3 py-1.5 border border-border hover:border-primary hover:text-primary transition-colors tracking-wide"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="px-6 sm:px-10 lg:px-20 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <span className="text-sm tracking-[0.3em] uppercase text-primary-text mb-4 block">Prêt à tester ?</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.1] mb-6">
              Trouvez votre signature olfactive<br className="hidden sm:block" />
              <span className="italic text-primary-text"> en format découverte.</span>
            </h2>
            <div className="w-24 h-px bg-primary mx-auto mb-8" />
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Plus de 100 fragrances disponibles en décant. Testez, comparez, choisissez — sans risque, sans mauvaise surprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/parfums" className="btn-luxury px-10 py-4 bg-primary text-primary-foreground text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-light transition-colors">
                Voir le catalogue
              </Link>
              <Link href="/packs" className="px-10 py-4 border border-foreground text-foreground text-sm tracking-[0.2em] uppercase font-medium hover:bg-foreground hover:text-background transition-colors">
                Découvrir les packs
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
