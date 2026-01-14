'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Filter, ChevronDown } from 'lucide-react'
import { collections } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name'
type CategoryFilter = 'all' | 'femme' | 'homme' | 'unisexe'

export default function CollectionsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching products:', error)
        } else if (data) {
          const mappedProducts: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            shortDescription: p.short_description || '',
            price: p.price,
            originalPrice: p.original_price,
            images: p.images || [],
            size: p.sizes || [],
            category: p.category || 'unisexe',
            collection: p.collection,
            notes: {
              top: p.notes_top || [],
              heart: p.notes_heart || [],
              base: p.notes_base || []
            },
            inStock: (p.stock || 0) > 0,
            new: p.is_new,
            bestseller: p.is_bestseller,
            featured: p.is_bestseller
          }))
          setProducts(mappedProducts)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'featured':
      default:
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return 0
        })
    }

    return result
  }, [products, categoryFilter, sortBy])

  return (
    <div className="min-h-screen pt-28">
      {/* Hero */}
      <section className="relative h-[50vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920"
          alt="Nos Collections"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-4">
              Collections
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Explorez l&apos;univers BrazaScent à travers nos créations d&apos;exception
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collections preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/collections/${collection.slug}`}
                  className="group block relative aspect-[16/9] overflow-hidden"
                >
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xl tracking-[0.2em] uppercase">
                      {collection.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-16 bg-[#F9F6F1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12 pb-6 border-b border-gray-300">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase hover:text-[#C9A962] transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filtres
              </button>
              <span className="text-sm text-gray-500">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none bg-transparent pr-8 py-2 text-sm tracking-wider focus:outline-none cursor-pointer"
              >
                <option value="featured">En vedette</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name">Nom A-Z</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 pb-8 border-b border-gray-300"
            >
              <div className="flex flex-wrap gap-3">
                <span className="text-sm tracking-[0.1em] uppercase mr-4">Catégorie:</span>
                {(['all', 'femme', 'homme', 'unisexe'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 text-sm border transition-colors ${
                      categoryFilter === cat
                        ? 'border-[#19110B] bg-[#19110B] text-white'
                        : 'border-gray-300 hover:border-[#19110B]'
                    }`}
                  >
                    {cat === 'all' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Products grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">Aucun produit trouvé</p>
              <button
                onClick={() => {
                  setCategoryFilter('all')
                  setSortBy('featured')
                }}
                className="text-[#C9A962] hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
