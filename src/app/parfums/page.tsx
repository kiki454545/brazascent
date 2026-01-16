'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

interface Brand {
  id: string
  name: string
  slug: string
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

export default function ParfumsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted')
    }

    const fetchData = async () => {
      try {
        // Fetch products and brands in parallel
        const [productsResponse, brandsResponse] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .order('display_order', { ascending: true }),
          supabase
            .from('brands')
            .select('id, name, slug')
            .order('name', { ascending: true })
        ])

        if (!isMounted) return

        if (productsResponse.error) {
          if (!isAbortError(productsResponse.error)) {
            console.error('Error fetching products:', productsResponse.error.message)
          }
        } else if (productsResponse.data) {
          const mappedProducts: Product[] = productsResponse.data.map((p: any) => {
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
              inStock: (p.stock || 0) > 0,
              new: p.is_new,
              bestseller: p.is_bestseller,
              featured: p.is_bestseller
            }
          })
          setProducts(mappedProducts)
        }

        if (!brandsResponse.error && brandsResponse.data) {
          setBrands(brandsResponse.data)
        }
      } catch (err) {
        if (!isAbortError(err)) {
          console.error('Error:', err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProducts = products
    .filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
    .filter((product) => selectedBrand === 'all' || product.brand === selectedBrand)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return b.new ? 1 : -1
      }
    })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=90"
          alt="Nos Parfums"
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
              Collection
            </span>
            <h1 className="text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-4">
              Nos Parfums
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Découvrez notre sélection de fragrances d&apos;exception
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-12 pb-6 border-b">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase hover:text-[#C9A962] transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtrer
              </button>

              <span className="text-sm text-gray-500">
                {filteredProducts.length} parfum{filteredProducts.length > 1 ? 's' : ''}
              </span>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm tracking-[0.1em] uppercase bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter panel */}
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 pb-6 border-b"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm tracking-[0.2em] uppercase">Filtres</span>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 hover:text-[#C9A962] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filtre par marque */}
              <div className="mb-6">
                <span className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-3 block">Marque</span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 border border-gray-300 rounded-none text-sm focus:outline-none focus:border-[#19110B] bg-white"
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
              <div>
                <span className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-3 block">Catégorie</span>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-5 py-2.5 text-sm tracking-wider border transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-[#19110B] text-white border-[#19110B]'
                          : 'border-gray-300 hover:border-[#19110B]'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">Aucun parfum ne correspond à vos critères</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
