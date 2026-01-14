import { Product, Collection } from '@/types'

// Produits vides - les vrais produits sont dans Supabase
export const products: Product[] = []

export const collections: Collection[] = [
  {
    id: '1',
    name: 'Signature',
    slug: 'signature',
    description: 'Notre collection emblématique, l\'essence même de BrazaScent',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200',
    products: []
  },
  {
    id: '2',
    name: 'Les Absolus',
    slug: 'les-absolus',
    description: 'Des matières premières d\'exception pour des créations uniques',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200',
    products: []
  },
  {
    id: '3',
    name: 'Lumière',
    slug: 'lumiere',
    description: 'Des fragrances lumineuses pour illuminer chaque jour',
    image: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200',
    products: []
  }
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured)
}

export function getNewProducts(): Product[] {
  return products.filter(p => p.new)
}

export function getBestsellers(): Product[] {
  return products.filter(p => p.bestseller)
}

export function getProductsByCategory(category: Product['category']): Product[] {
  return products.filter(p => p.category === category)
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find(c => c.slug === slug)
}
