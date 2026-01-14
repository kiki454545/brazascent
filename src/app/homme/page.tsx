'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { getProductsByCategory } from '@/data/products'
import { ProductCard } from '@/components/ProductCard'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name'

export default function HommePage() {
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  let products = getProductsByCategory('homme')

  // Sort products
  switch (sortBy) {
    case 'price-asc':
      products.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      products.sort((a, b) => b.price - a.price)
      break
    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name))
      break
  }

  return (
    <div className="min-h-screen pt-28">
      {/* Hero */}
      <section className="relative h-[60vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=1920"
          alt="Parfums Homme"
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
              Homme
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Des fragrances masculines alliant puissance et raffinement
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
              {products.length} parfum{products.length > 1 ? 's' : ''}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
