'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, Award, Star, Truck, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
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

export interface DraggableCarouselHandle {
  scrollByAmount: (amount: number) => void
}

// Composant Carrousel Draggable avec inertie/momentum
const DraggableCarousel = forwardRef<DraggableCarouselHandle, { products: Product[] }>(({ products }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Expose scrollByAmount au parent
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

  // Pour l'effet d'inertie
  const velocity = useRef(0)
  const lastX = useRef(0)
  const lastTime = useRef(0)
  const animationFrame = useRef<number | null>(null)

  // Fonction pour appliquer l'inertie
  const applyMomentum = () => {
    if (!containerRef.current) return

    // Friction pour ralentir progressivement
    velocity.current *= 0.95

    // Arrêter si la vélocité est très faible
    if (Math.abs(velocity.current) < 0.5) {
      velocity.current = 0
      return
    }

    containerRef.current.scrollLeft += velocity.current
    animationFrame.current = requestAnimationFrame(applyMomentum)
  }

  // Arrêter l'animation en cours
  const stopMomentum = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
      animationFrame.current = null
    }
    velocity.current = 0
  }

  // Mouse events
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

    if (Math.abs(diff) > dragThreshold) {
      hasDragged.current = true
      containerRef.current.style.cursor = 'grabbing'
    }

    if (hasDragged.current) {
      e.preventDefault()
      // Calculer la vélocité basée sur le mouvement récent
      if (dt > 0) {
        velocity.current = (lastX.current - x) / dt * 15
      }
      lastX.current = x
      lastTime.current = now
      containerRef.current.scrollLeft = scrollLeftStart.current + diff
    }
  }

  const handleMouseUp = () => {
    if (!isDown.current) return
    isDown.current = false
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
    // Lancer l'effet d'inertie si on a draggé
    if (hasDragged.current && Math.abs(velocity.current) > 1) {
      applyMomentum()
    }
    setTimeout(() => { hasDragged.current = false }, 100)
  }

  const handleMouseLeave = () => {
    if (isDown.current) {
      handleMouseUp()
    }
  }

  // Touch events avec inertie
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

    if (Math.abs(diff) > dragThreshold) {
      hasTouchDragged.current = true
    }

    if (hasTouchDragged.current) {
      // Calculer la vélocité
      if (dt > 0) {
        velocity.current = (touchLastX.current - x) / dt * 15
      }
      touchLastX.current = x
      touchLastTime.current = now
      containerRef.current.scrollLeft = touchScrollLeft.current + diff
    }
  }

  const handleTouchEnd = () => {
    // Lancer l'effet d'inertie si on a draggé
    if (hasTouchDragged.current && Math.abs(velocity.current) > 1) {
      applyMomentum()
    }
    setTimeout(() => { hasTouchDragged.current = false }, 100)
  }

  // Bloquer les clics sur les liens si on a draggé
  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || hasTouchDragged.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex gap-6 sm:gap-8 lg:gap-10 pl-6 sm:pl-10 lg:pl-20 pr-6 sm:pr-10 lg:pr-20 overflow-x-auto scrollbar-hide cursor-grab select-none"
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
})
DraggableCarousel.displayName = 'DraggableCarousel'

// Slider auto du hero : 5 bestsellers, défile toutes les 5s
function HeroBestsellersSlider({ products }: { products: Product[] }) {
  const items = products.slice(0, 5)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [items.length])

  if (items.length === 0) {
    return <div className="w-full h-full bg-cream/10" />
  }

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
        <motion.div
          key={item.id}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          <Link href={`/parfum/${item.slug}`} className="block w-full h-full group">
            <motion.div
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
            </motion.div>
            {/* Dégradé bas pour la lisibilité des infos produit */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Infos produit en overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white">
              <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3">
                Bestseller
              </p>
              <p className="text-xs uppercase tracking-wider text-white/70 mb-1">
                {item.brand}
              </p>
              <h3 className="text-2xl sm:text-3xl font-normal mb-2">{item.name}</h3>
              <p className="text-sm text-white/90">
                À partir de {getPrice(item).toFixed(2)} €
              </p>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Indicateurs (barres) en bas */}
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 flex gap-1.5 z-10">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Voir produit ${i + 1}`}
            className={`h-0.5 transition-all ${
              i === current ? 'w-10 bg-primary' : 'w-6 bg-white/40 hover:bg-white/70'
            }`}
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

export default function HomePage() {
  const [bestsellers, setBestsellers] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const bestsellersCarouselRef = useRef<DraggableCarouselHandle>(null)
  const newProductsCarouselRef = useRef<DraggableCarouselHandle>(null)
  const scrollStep = 320

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
      {/* Hero Section — split 3/5 text · 2/5 slider */}
      <section className="relative lg:min-h-screen overflow-hidden text-white">
        {/* Background image global (les 2 colonnes), toujours sombre */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 lg:min-h-screen pt-24 lg:pt-0">
          {/* Left : titre + subtitle + CTA */}
          <div className="lg:col-span-3 relative flex items-center px-6 sm:px-10 lg:px-20 py-12 sm:py-16 lg:py-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-4xl relative z-10 text-white w-full"
            >
              <motion.h1
                variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.1] sm:leading-[1.05] mb-6 sm:mb-8 tracking-tight"
              >
                Découvrez des parfums rares<br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-primary italic">sans acheter le flacon</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-sm sm:text-base text-white/90 mb-8 sm:mb-10 leading-relaxed max-w-2xl"
              >
                Braza Scent est spécialisé dans le décantage à partir de flacons authentiques :
                parfumerie de niche, éditions limitées et pièces issues de collections privées.
              </motion.p>

              <motion.div variants={fadeUp}>
                <Link
                  href="/parfums"
                  className="btn-luxury inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-primary text-primary-foreground text-xs sm:text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-light transition-colors"
                >
                  Découvrir la sélection
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Scroll indicator desktop */}
            <Link
              href="#comment-ca-marche"
              aria-label="Comment ça marche"
              className="hidden lg:flex absolute bottom-10 left-20 z-10 flex-col items-center gap-3 text-white/70 hover:text-primary transition-colors group"
            >
              <span className="text-[11px] tracking-[0.35em] uppercase">Comment ça marche</span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
              </motion.div>
            </Link>
          </div>

          {/* Right : slider auto des 5 bestsellers */}
          <div className="lg:col-span-2 relative aspect-[3/4] sm:aspect-[16/10] lg:aspect-auto lg:min-h-screen">
            <HeroBestsellersSlider products={bestsellers} />
          </div>
        </div>
      </section>

      {/* Pourquoi Braza Scent — éditorial split */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Vidéo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative aspect-[9/16] w-[360px] max-w-full mx-auto lg:col-span-2 overflow-hidden bg-black"
            >
              <video
                src="/videos/decantage.mp4"
                poster="/images/hero-bg.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Cartouche or sur la vidéo */}
              <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 bg-background/95 backdrop-blur px-6 py-4 border-l-2 border-primary">
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1">Maison</p>
                <p className="font-serif text-xl">Braza Scent</p>
              </div>
            </motion.div>

            {/* Contenu */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={stagger}
              className="lg:col-span-3"
            >
              <motion.span
                variants={fadeUp}
                className="text-xs tracking-[0.35em] uppercase text-primary mb-4 block"
              >
                Notre approche
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.1] mb-6"
              >
                L&apos;exigence du <span className="italic text-primary">détail</span>,
                <br />
                au service du parfum.
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-muted-foreground leading-relaxed mb-12 max-w-lg"
              >
                Chaque décant est préparé à la main, à partir de flacons authentiques.
                Une démarche artisanale pour faire découvrir les plus belles fragrances de niche.
              </motion.p>

              <div className="space-y-8">
                {[
                  {
                    num: '01',
                    title: 'Authenticité',
                    desc: 'Décantage exclusivement à partir de flacons originaux, jamais de copies ni de reformulations.',
                  },
                  {
                    num: '02',
                    title: 'Sélection',
                    desc: 'Parfumerie de niche, éditions limitées et pièces issues de collections privées.',
                  },
                  {
                    num: '03',
                    title: 'Soin',
                    desc: 'Matériel stérile, dosage précis, packaging sécurisé. Chaque commande est préparée comme une pièce unique.',
                  },
                ].map((item) => (
                  <motion.div
                    key={item.num}
                    variants={fadeUp}
                    className="grid grid-cols-[auto_1fr] gap-6 pb-8 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <span className="font-serif text-2xl text-primary leading-none">{item.num}</span>
                    <div>
                      <h3 className="text-lg tracking-[0.15em] uppercase mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Best-sellers - Carrousel draggable */}
      <section className="py-20 lg:py-28 bg-cream overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <motion.span variants={fadeUp} className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
                  Les plus populaires
                </motion.span>
                <motion.h2
                  variants={fadeUp}
                  className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase"
                >
                  Best-sellers
                </motion.h2>
                <motion.div variants={fadeUp} className="w-24 h-px bg-primary mt-6" />
              </div>
              <motion.div variants={fadeUp} className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => bestsellersCarouselRef.current?.scrollByAmount(-scrollStep)}
                    aria-label="Précédent"
                    className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => bestsellersCarouselRef.current?.scrollByAmount(scrollStep)}
                    aria-label="Suivant"
                    className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  href="/parfums"
                  className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group"
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
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bestsellers.length > 0 ? (
          <DraggableCarousel ref={bestsellersCarouselRef} products={bestsellers} />
        ) : (
          <p className="text-center text-muted-foreground py-10">Aucun best-seller pour le moment</p>
        )}
      </section>

      {/* Nouveautés - Carrousel draggable */}
      <section className="py-20 lg:py-28 bg-background overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <motion.span variants={fadeUp} className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
                  Fraîchement arrivés
                </motion.span>
                <motion.h2
                  variants={fadeUp}
                  className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase"
                >
                  Nouveautés
                </motion.h2>
                <motion.div variants={fadeUp} className="w-24 h-px bg-primary mt-6" />
              </div>
              <motion.div variants={fadeUp} className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => newProductsCarouselRef.current?.scrollByAmount(-scrollStep)}
                    aria-label="Précédent"
                    className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => newProductsCarouselRef.current?.scrollByAmount(scrollStep)}
                    aria-label="Suivant"
                    className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  href="/parfums"
                  className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-primary transition-colors group"
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
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : newProducts.length > 0 ? (
          <DraggableCarousel ref={newProductsCarouselRef} products={newProducts} />
        ) : (
          <p className="text-center text-muted-foreground py-10">Aucune nouveauté pour le moment</p>
        )}
      </section>

      {/* Comment ça marche — section unifiée (process + formats + engagement) */}
      <section id="comment-ca-marche" className="py-20 lg:py-32 bg-cream">
        <div className="px-6 sm:px-10 lg:px-20">
          {/* En-tête de section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.span
              variants={fadeUp}
              className="text-xs tracking-[0.35em] uppercase text-primary mb-4 block"
            >
              Notre processus
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] mb-6"
            >
              Comment ça <span className="italic text-primary">marche ?</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Décanter, c&apos;est découvrir sans se tromper. Voici comment nous garantissons une
              expérience parfumée authentique, du flacon original jusqu&apos;à ta porte.
            </motion.p>
          </motion.div>

          {/* Bloc 1 — Process (4 étapes timeline) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="mb-24"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary">01 · Process</span>
              <div className="flex-1 h-px bg-border" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 relative">
              {/* Ligne or de connexion (desktop only) */}
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-primary/30" aria-hidden />

              {[
                { num: '01', title: 'Choisis ton parfum', desc: 'Sélectionne la fragrance et le format (2/5/10ml).' },
                { num: '02', title: 'Préparation', desc: 'Décantage propre et précis à partir d\'un flacon authentique.' },
                { num: '03', title: 'Packaging', desc: 'Emballage soigné et sécurisé pour un transport sans stress.' },
                { num: '04', title: 'Réception', desc: 'Tu testes sur plusieurs jours et tu profites de la niche.' },
              ].map((step) => (
                <motion.div key={step.num} variants={fadeUp} className="relative text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-cream border border-primary rounded-full flex items-center justify-center relative z-10">
                    <span className="text-primary text-base font-serif">{step.num}</span>
                  </div>
                  <h3 className="text-base tracking-[0.15em] uppercase mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bloc 2 — Formats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="mb-24"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary">02 · Formats</span>
              <div className="flex-1 h-px bg-border" />
            </motion.div>

            <motion.div variants={fadeUp} className="mb-10 max-w-2xl">
              <p className="text-muted-foreground leading-relaxed">
                Le décantage te permet de tester une fragrance sur plusieurs jours
                (peau, météo, tenue) avant d&apos;investir dans un flacon complet.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-10">
              {[
                { size: '2ml', label: 'Test rapide', sprays: '≈ 45 sprays' },
                { size: '5ml', label: 'Découverte complète', sprays: '≈ 110 sprays' },
                { size: '10ml', label: 'Vrai usage', sprays: '≈ 220 sprays' },
              ].map((format) => (
                <div
                  key={format.size}
                  className="p-4 sm:p-8 lg:p-10 border border-border bg-background text-center hover:border-primary transition-colors"
                >
                  <div className="font-serif text-3xl sm:text-5xl lg:text-6xl text-primary mb-2">
                    {format.size}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground tracking-[0.2em] uppercase mb-2">
                    {format.label}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">{format.sprays}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bloc 3 — Engagement */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-12">
              <span className="text-[10px] tracking-[0.35em] uppercase text-primary">03 · Engagement</span>
              <div className="flex-1 h-px bg-border" />
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
              <div className="p-8 lg:p-10 border border-border bg-background">
                <h3 className="text-base tracking-[0.15em] uppercase mb-4 flex items-center gap-3">
                  <span className="text-primary font-serif">★</span>
                  Authenticité
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Décantage réalisé à partir de flacons <strong className="text-foreground">authentiques</strong>
                  (niche & collection privée). Aucune copie, aucune reformulation.
                </p>
              </div>
              <div className="p-8 lg:p-10 border border-border bg-background">
                <h3 className="text-base tracking-[0.15em] uppercase mb-4 flex items-center gap-3">
                  <span className="text-primary font-serif">★</span>
                  Soin & transparence
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Matériel stérile, manipulation soignée, packaging sécurisé, stock mis à jour
                  selon disponibilité réelle.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Avis - Carrousel */}
      <section className="py-20 lg:py-28 bg-background overflow-hidden">
        <div className="px-6 sm:px-10 lg:px-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
                Témoignages
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">
                Avis clients
              </h2>
              <div className="w-24 h-px bg-primary mx-auto" />
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
                className="flex-shrink-0 w-80 p-6 bg-cream border border-border"
              >
                <div className="text-primary text-lg mb-3">★★★★★</div>
                <p className="text-muted-foreground mb-4 italic leading-relaxed text-sm">"{review.text}"</p>
                <p className="text-sm text-muted-foreground">{review.name}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="px-6 sm:px-10 lg:px-20 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-4xl mx-auto"
          >
            <span className="text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Contact
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-[1.1] mb-6">
              Une demande, une recherche,<br className="hidden sm:block" />
              <span className="italic text-primary">une pièce rare ?</span>
            </h2>
            <div className="w-24 h-px bg-primary mx-auto mb-8" />
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Écris-moi pour une recommandation, une disponibilité, ou un conseil (familles olfactives, saisons, tenue).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="btn-luxury px-10 py-4 bg-primary text-primary-foreground text-sm tracking-[0.2em] uppercase font-medium hover:bg-gold-light transition-colors"
              >
                Me contacter
              </Link>
              <Link
                href="/parfums"
                className="px-10 py-4 border border-foreground text-foreground text-sm tracking-[0.2em] uppercase font-medium hover:bg-foreground hover:text-background transition-colors"
              >
                Voir le catalogue
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
