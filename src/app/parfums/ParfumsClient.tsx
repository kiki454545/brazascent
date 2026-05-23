'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { X, Search, ChevronDown, ChevronUp, Sparkles, SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import dynamic from 'next/dynamic'
import { Product } from '@/types'

interface Brand {
  id: string
  name: string
  slug: string
}

interface ParfumsClientProps {
  initialProducts: Product[]
  initialBrands: Brand[]
}

const categories = [
  { id: 'all', name: 'Tous' },
  { id: 'Eau de Parfum', name: 'Eau de Parfum' },
  { id: 'Eau de Toilette', name: 'Eau de Toilette' },
  { id: 'Extrait de Parfum', name: 'Extrait de Parfum' },
]

const sortOptions = [
  { id: 'newest', name: 'Nouveautés' },
  { id: 'price-asc', name: 'Prix croissant' },
  { id: 'price-desc', name: 'Prix décroissant' },
  { id: 'name', name: 'Nom A-Z' },
]

const ITEMS_PER_PAGE = 20
const formats = ['2ml', '5ml', '10ml', '30ml']

export default function ParfumsPage({ initialProducts, initialBrands }: ParfumsClientProps) {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [products] = useState<Product[]>(initialProducts)
  const [brands] = useState<Brand[]>(initialBrands)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  // Tiroir filtres mobile
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Sidebar sections open/close (desktop)
  const [openSections, setOpenSections] = useState({ category: true, brand: true, format: true, price: true })
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections(s => ({ ...s, [key]: !s[key] }))

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Plage de prix dynamique — couvre TOUTES les contenances de tous les produits
  const allPrices = products.flatMap(p => {
    if (p.priceBySize) {
      const vals = Object.values(p.priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
      if (vals.length > 0) return vals
    }
    return p.price > 0 ? [p.price] : []
  })
  const globalMin = Math.floor(Math.min(...allPrices, 0))
  const globalMax = Math.ceil(Math.max(...allPrices, 200))
  const [priceRange, setPriceRange] = useState<[number, number]>([globalMin, globalMax])

  const isRangeFiltered = priceRange[0] > globalMin || priceRange[1] < globalMax

  // Retourne le prix à afficher : priorité au format sélectionné, sinon le prix dans la plage, sinon le min
  const getProductDisplayPrice = (product: Product) => {
    if (selectedFormat !== 'all' && product.priceBySize) {
      const key = Object.keys(product.priceBySize).find(k => k.toLowerCase() === selectedFormat.toLowerCase())
      if (key && product.priceBySize[key] > 0) return product.priceBySize[key]
    }
    if (product.priceBySize) {
      const entries = Object.entries(product.priceBySize).filter(([, v]) => typeof v === 'number' && v > 0) as [string, number][]
      if (entries.length > 0) {
        if (isRangeFiltered) {
          const inRange = entries.filter(([, v]) => v >= priceRange[0] && v <= priceRange[1])
          if (inRange.length > 0) return Math.min(...inRange.map(([, v]) => v))
        }
        return Math.min(...entries.map(([, v]) => v))
      }
    }
    return product.price
  }

  // Retourne la taille à pré-sélectionner sur la carte selon les filtres actifs
  const getPreferredSize = (product: Product): string | undefined => {
    if (selectedFormat !== 'all') return selectedFormat
    if (isRangeFiltered && product.priceBySize) {
      const entries = Object.entries(product.priceBySize).filter(([, v]) => typeof v === 'number' && v > 0 && (v as number) >= priceRange[0] && (v as number) <= priceRange[1]) as [string, number][]
      if (entries.length > 0) return entries.reduce((a, b) => a[1] < b[1] ? a : b)[0]
    }
    return undefined
  }

  const filteredProducts = products
    .filter(p => selectedCategory === 'all' || p.category === selectedCategory)
    .filter(p => selectedBrand === 'all' || p.brand === selectedBrand)
    .filter(p => selectedFormat === 'all' || p.size?.some(s => s.toLowerCase() === selectedFormat.toLowerCase()))
    .filter(p => {
      // Le produit passe si AU MOINS UNE de ses contenances est dans la plage de prix
      if (p.priceBySize) {
        const vals = Object.values(p.priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
        if (vals.length > 0) return vals.some(v => v >= priceRange[0] && v <= priceRange[1])
      }
      return p.price >= priceRange[0] && p.price <= priceRange[1]
    })
    .filter(p => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.brand?.toLowerCase().includes(q) ?? false)
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return getProductDisplayPrice(a) - getProductDisplayPrice(b)
        case 'price-desc': return getProductDisplayPrice(b) - getProductDisplayPrice(a)
        case 'name': return a.name.localeCompare(b.name)
        default: return b.new ? 1 : -1
      }
    })

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  // Réinitialiser la pagination à chaque changement de filtre
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [selectedCategory, selectedBrand, selectedFormat, sortBy, searchQuery, priceRange])

  // Intersection Observer pour l'infinite scroll
  const loadMore = useCallback(() => {
    setVisibleCount(c => c + ITEMS_PER_PAGE)
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) loadMore()
    }, { rootMargin: '200px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedBrand !== 'all',
    selectedFormat !== 'all',
    priceRange[0] > globalMin || priceRange[1] < globalMax,
  ].filter(Boolean).length

  const resetFilters = () => {
    setSelectedCategory('all')
    setSelectedBrand('all')
    setSelectedFormat('all')
    setPriceRange([globalMin, globalMax])
  }

  const SectionHeader = ({ label, sectionKey }: { label: string; sectionKey: keyof typeof openSections }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full text-xs tracking-[0.15em] uppercase text-foreground py-3 border-b border-border"
    >
      {label}
      {openSections[sectionKey] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
    </button>
  )

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[360px] overflow-hidden">
        <Image src="/images/parfums-hero.webp" alt="Nos Parfums" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <m.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">Collection</span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4">
              Nos Parfums
            </h1>
            <p className="text-sm sm:text-lg font-light max-w-xl mx-auto mb-6">
              Découvrez notre sélection de fragrances d&apos;exception
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/60 text-white text-xs tracking-[0.2em] uppercase hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Quiz olfactif
            </Link>
          </m.div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">

          {/* Mobile top bar */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm bg-transparent border border-border px-3 py-2 focus:outline-none focus:border-primary"
            >
              {sortOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 border border-border text-sm hover:border-primary transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Tiroir filtres mobile */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              {/* Panneau */}
              <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-background overflow-y-auto shadow-xl">
                {/* En-tête */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
                  <span className="text-sm tracking-[0.15em] uppercase font-medium">Filtres</span>
                  <button onClick={() => setMobileFiltersOpen(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-6">
                  {/* Tri */}
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground mb-3 pb-2 border-b border-border">Trier par</p>
                    <div className="space-y-1">
                      {sortOptions.map(o => (
                        <button key={o.id} onClick={() => setSortBy(o.id)}
                          className={`w-full text-left text-sm py-2 px-2 transition-colors ${sortBy === o.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {o.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catégorie */}
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground mb-3 pb-2 border-b border-border">Catégorie</p>
                    <div className="space-y-1">
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <button key={c.id} onClick={() => setSelectedCategory(c.id === selectedCategory ? 'all' : c.id)}
                          className={`w-full text-left text-sm py-2 px-2 transition-colors ${selectedCategory === c.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Marque */}
                  {brands.length > 0 && (
                    <div>
                      <p className="text-xs tracking-[0.15em] uppercase text-foreground mb-3 pb-2 border-b border-border">Marque</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {brands.map(b => (
                          <button key={b.id} onClick={() => setSelectedBrand(b.name === selectedBrand ? 'all' : b.name)}
                            className={`w-full text-left text-sm py-2 px-2 transition-colors ${selectedBrand === b.name ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Format */}
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground mb-3 pb-2 border-b border-border">Format</p>
                    <div className="flex flex-wrap gap-2">
                      {formats.map(f => (
                        <button key={f} onClick={() => setSelectedFormat(f === selectedFormat ? 'all' : f)}
                          className={`px-3 py-1.5 text-xs tracking-wider border transition-colors ${selectedFormat === f ? 'bg-foreground text-background border-foreground' : 'border-border'}`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prix */}
                  <div>
                    <p className="text-xs tracking-[0.15em] uppercase text-foreground mb-3 pb-2 border-b border-border">Prix</p>
                    <p className="text-xs text-muted-foreground mb-3">{priceRange[0]} € — {priceRange[1]} €</p>
                    <div className="space-y-2">
                      <input type="range" min={globalMin} max={globalMax} value={priceRange[0]}
                        onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])}
                        className="w-full accent-primary" />
                      <input type="range" min={globalMin} max={globalMax} value={priceRange[1]}
                        onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])}
                        className="w-full accent-primary" />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{globalMin} €</span><span>{globalMax} €</span>
                    </div>
                  </div>

                  {/* Reset + Appliquer */}
                  <div className="flex gap-3 pt-2">
                    {activeFilterCount > 0 && (
                      <button onClick={() => { resetFilters(); }} className="flex-1 py-2.5 border border-border text-sm tracking-[0.1em] uppercase hover:border-foreground transition-colors">
                        Réinitialiser
                      </button>
                    )}
                    <button onClick={() => setMobileFiltersOpen(false)}
                      className="flex-1 py-2.5 bg-foreground text-background text-sm tracking-[0.1em] uppercase dark:bg-primary dark:text-primary-foreground hover:bg-primary transition-colors">
                      Voir {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-8 lg:gap-12">
            {/* ── Sidebar desktop ── */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                {/* Quiz CTA */}
                <Link
                  href="/quiz"
                  className="flex items-center gap-2 w-full mb-6 px-4 py-3 bg-primary/10 border border-primary/30 text-primary text-xs tracking-[0.15em] uppercase hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  Trouver mon parfum
                </Link>

                {/* Search */}
                <div className="relative mb-5">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-8 pr-7 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Tri */}
                <div className="mb-5">
                  <span className="text-xs tracking-[0.15em] uppercase text-foreground block mb-3 pb-2 border-b border-border">Trier par</span>
                  <div className="space-y-1">
                    {sortOptions.map(o => (
                      <button
                        key={o.id}
                        onClick={() => setSortBy(o.id)}
                        className={`w-full text-left text-sm py-1.5 px-2 transition-colors ${sortBy === o.id ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catégorie */}
                <div className="mb-5">
                  <SectionHeader label="Catégorie" sectionKey="category" />
                  {openSections.category && (
                    <div className="mt-2 space-y-1">
                      {categories.filter(c => c.id !== 'all').map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategory(c.id === selectedCategory ? 'all' : c.id)}
                          className={`w-full text-left text-sm py-1.5 px-2 transition-colors ${selectedCategory === c.id ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Marque */}
                {brands.length > 0 && (
                  <div className="mb-5">
                    <SectionHeader label="Marque" sectionKey="brand" />
                    {openSections.brand && (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
                        {brands.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBrand(b.name === selectedBrand ? 'all' : b.name)}
                            className={`w-full text-left text-sm py-1.5 px-2 transition-colors ${selectedBrand === b.name ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Format */}
                <div className="mb-5">
                  <SectionHeader label="Format" sectionKey="format" />
                  {openSections.format && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formats.map(f => (
                        <button
                          key={f}
                          onClick={() => setSelectedFormat(f === selectedFormat ? 'all' : f)}
                          className={`px-3 py-1.5 text-xs tracking-wider border transition-colors ${selectedFormat === f ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prix */}
                <div className="mb-5">
                  <SectionHeader label="Prix" sectionKey="price" />
                  {openSections.price && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">{priceRange[0]} € — {priceRange[1]} €</p>
                      <div className="space-y-2">
                        <input
                          type="range" min={globalMin} max={globalMax} value={priceRange[0]}
                          onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])}
                          className="w-full accent-primary"
                        />
                        <input
                          type="range" min={globalMin} max={globalMax} value={priceRange[1]}
                          onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])}
                          className="w-full accent-primary"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{globalMin} €</span><span>{globalMax} €</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reset filtres */}
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Réinitialiser ({activeFilterCount})
                  </button>
                )}
              </div>
            </aside>

            {/* ── Contenu principal ── */}
            <div className="flex-1 min-w-0">
              {/* Barre résultats (desktop) */}
              <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b">
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} parfum{filteredProducts.length > 1 ? 's' : ''}
                  {visibleCount < filteredProducts.length && ` · ${visibleProducts.length} affichés`}
                </span>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Effacer les filtres
                  </button>
                )}
              </div>

              {/* Grille produits */}
              {visibleProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                    {visibleProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} preferredSize={getPreferredSize(product)} />
                    ))}
                  </div>

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} className="h-10 mt-8 flex items-center justify-center">
                    {hasMore && (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Aucun parfum ne correspond à vos critères</p>
                  <button onClick={resetFilters} className="mt-4 text-sm text-primary hover:underline">
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
