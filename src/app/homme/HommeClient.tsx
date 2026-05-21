'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name'

interface HommeClientProps {
  initialProducts: Product[]
}

export default function HommePage({ initialProducts }: HommeClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [products] = useState<Product[]>(initialProducts)

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
          src="https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=1920"
          alt="Parfums Homme"
          fill
          sizes="100vw"
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
            <span className="text-sm tracking-[0.3em] uppercase mb-4 block text-primary">
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
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          {/* Filter bar */}
          <div className="flex items-center justify-between mb-12 pb-6 border-b">
            <span className="text-sm text-muted-foreground">
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
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              {sortedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun parfum disponible dans cette catégorie</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
