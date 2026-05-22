'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { m } from 'framer-motion'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import dynamic from 'next/dynamic'
const Benefits = dynamic(() => import('@/components/Benefits').then(m => m.Benefits), { ssr: false })
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

export default function ParfumsPage({ initialProducts, initialBrands }: ParfumsClientProps) {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [products] = useState<Product[]>(initialProducts)
  const [brands] = useState<Brand[]>(initialBrands)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  // Plage de prix dynamique
  const allPrices = products.map((p) => {
    if (p.priceBySize) {
      const vals = Object.values(p.priceBySize).filter((v) => v > 0)
      if (vals.length > 0) return Math.min(...vals)
    }
    return p.price
  })
  const globalMin = Math.floor(Math.min(...allPrices, 0))
  const globalMax = Math.ceil(Math.max(...allPrices, 200))
  const [priceRange, setPriceRange] = useState<[number, number]>([globalMin, globalMax])

  const formats = ['2ml', '5ml', '10ml']

  const getProductMinPrice = (product: Product) => {
    if (product.priceBySize) {
      const vals = Object.values(product.priceBySize).filter((v) => v > 0)
      if (vals.length > 0) return Math.min(...vals)
    }
    return product.price
  }

  const filteredProducts = products
    .filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
    .filter((product) => selectedBrand === 'all' || product.brand === selectedBrand)
    .filter((product) => {
      if (selectedFormat === 'all') return true
      return product.size?.some((s) => s.toLowerCase() === selectedFormat.toLowerCase())
    })
    .filter((product) => {
      const price = getProductMinPrice(product)
      return price >= priceRange[0] && price <= priceRange[1]
    })
    .filter((product) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        product.name.toLowerCase().includes(query) ||
        (product.brand?.toLowerCase().includes(query) ?? false)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return getProductMinPrice(a) - getProductMinPrice(b)
        case 'price-desc':
          return getProductMinPrice(b) - getProductMinPrice(a)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return b.new ? 1 : -1
      }
    })

  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedBrand !== 'all',
    selectedFormat !== 'all',
    priceRange[0] > globalMin || priceRange[1] < globalMax,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[360px] overflow-hidden">
        <Image
          src="/images/parfums-hero.webp"
          alt="Nos Parfums"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Collection
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4">
              Nos Parfums
            </h1>
            <p className="text-sm sm:text-lg font-light max-w-xl mx-auto">
              Découvrez notre sélection de fragrances d&apos;exception
            </p>
          </m.div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          {/* Filter bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10 lg:mb-12 pb-6 border-b">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase hover:text-primary transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtrer
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} parfum{filteredProducts.length > 1 ? 's' : ''}
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="lg:hidden text-sm tracking-[0.1em] uppercase bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              {/* Barre de recherche */}
              <div className="relative flex-1 lg:flex-none">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full lg:w-64 pl-9 pr-8 py-2 text-sm border border-border focus:border-primary focus:outline-none transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-primary"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hidden lg:block text-sm tracking-[0.1em] uppercase bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter panel */}
          {isFilterOpen && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 pb-6 border-b"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm tracking-[0.2em] uppercase">Filtres</span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 hover:text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filtre par marque */}
              <div className="mb-6">
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3 block">Marque</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full sm:w-64 max-w-full px-4 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-foreground bg-background"
                >
                  <option value="all">Toutes les marques</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par catégorie */}
              <div className="mb-6">
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3 block">Catégorie</span>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm tracking-wider border transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-foreground text-background border-foreground'
                          : 'border-border hover:border-foreground'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par format */}
              <div className="mb-6">
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3 block">Format</span>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedFormat('all')}
                    className={`px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm tracking-wider border transition-colors ${
                      selectedFormat === 'all' ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
                    }`}
                  >
                    Tous
                  </button>
                  {formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFormat(f)}
                      className={`px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm tracking-wider border transition-colors ${
                        selectedFormat === f ? 'bg-foreground text-background border-foreground' : 'border-border hover:border-foreground'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par prix */}
              <div>
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3 block">
                  Prix — de {priceRange[0]} € à {priceRange[1]} €
                </span>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={globalMin}
                    max={globalMax}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])}
                    className="flex-1 accent-primary"
                  />
                  <input
                    type="range"
                    min={globalMin}
                    max={globalMax}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])}
                    className="flex-1 accent-primary"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{globalMin} €</span>
                  <span>{globalMax} €</span>
                </div>
              </div>
            </m.div>
          )}

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun parfum ne correspond à vos critères</p>
            </div>
          )}
        </div>
      </section>

      <Benefits />
    </div>
  )
}
