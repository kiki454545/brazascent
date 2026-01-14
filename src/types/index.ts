export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  originalPrice?: number
  images: string[]
  category: 'homme' | 'femme' | 'unisexe' | 'collection'
  collection?: string
  brand?: string
  notes: {
    top: string[]
    heart: string[]
    base: string[]
  }
  size: string[]
  inStock: boolean
  featured?: boolean
  new?: boolean
  bestseller?: boolean
}

export interface CartItem {
  product: Product
  quantity: number
  selectedSize: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  addresses: Address[]
  orders: Order[]
  wishlist: string[]
  createdAt: string
}

export interface Address {
  id: string
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: Address
  createdAt: string
  trackingNumber?: string
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string
  image: string
  products: string[]
}
