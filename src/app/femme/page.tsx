'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name'

export default function FemmePage() {
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', 'femme')
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
            category: p.category || 'femme',
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

  const sortedProducts = useMemo(() => {
    const sorted = [...products]
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return sorted
  }, [products, sortBy])

  return (
    <div className="min-h-screen pt-28">
      {/* Hero */}
      <section className="relative h-[60vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1920"
          alt="Parfums Femme"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase mb-4 block text-[#C9A962]">
              Collection
            </span>
            <h1 className="text-5xl lg:text-7xl font-light tracking-[0.2em] uppercase mb-4">
              Femme
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Des fragrances féminines empreintes de délicatesse et de caractère
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-12 pb-6 border-b">
            <span className="text-sm text-gray-500">
              {sortedProducts.length} parfum{sortedProducts.length > 1 ? 's' : ''}
            </span>

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

          {/* Products grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {sortedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Aucun parfum disponible dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
