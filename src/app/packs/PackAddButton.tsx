'use client'

import { useCartStore } from '@/store/cart'
import type { Product } from '@/types'

interface PackForCart {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
}

export default function PackAddButton({ pack }: { pack: PackForCart }) {
  const { addItem } = useCartStore()

  const handleAddToCart = () => {
    const packAsProduct: Product = {
      id: pack.id,
      name: pack.name,
      slug: pack.slug,
      description: pack.description,
      shortDescription: pack.description.substring(0, 100),
      price: pack.price,
      originalPrice: pack.original_price ?? undefined,
      images: [pack.image],
      category: 'collection',
      notes: { top: [], heart: [], base: [] },
      size: ['Pack'],
      inStock: true,
    }
    addItem(packAsProduct, 'Pack', 1)
  }

  return (
    <button
      onClick={handleAddToCart}
      className="w-full mt-4 py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary dark:bg-primary dark:text-primary-foreground dark:hover:bg-gold-light transition-colors"
    >
      Ajouter au panier
    </button>
  )
}
