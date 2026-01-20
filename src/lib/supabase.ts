import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fetch personnalisé qui ignore les signaux d'annulation de React 19
// Cela évite les AbortError qui se produisent lors du démontage des composants
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const { signal, ...restOptions } = options || {}
  return fetch(url, restOptions)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: customFetch,
  },
})

// Helper pour détecter les erreurs d'annulation (AbortError)
// Ces erreurs sont normales en mode Strict de React et ne doivent pas être loggées
export const isAbortError = (error: unknown): boolean => {
  if (!error) return false
  const message = (error as { message?: string }).message || String(error)
  return message.includes('AbortError') || message.includes('aborted')
}

// Types pour la base de données
export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          slug: string
          brand: string
          description: string
          price: number
          original_price: number | null
          images: string[]
          sizes: string[]
          category: string
          collection: string | null
          notes_top: string[]
          notes_heart: string[]
          notes_base: string[]
          is_new: boolean
          is_bestseller: boolean
          stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          brand: string
          description: string
          price: number
          original_price?: number | null
          images: string[]
          sizes: string[]
          category: string
          collection?: string | null
          notes_top?: string[]
          notes_heart?: string[]
          notes_base?: string[]
          is_new?: boolean
          is_bestseller?: boolean
          stock?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          brand?: string
          description?: string
          price?: number
          original_price?: number | null
          images?: string[]
          sizes?: string[]
          category?: string
          collection?: string | null
          notes_top?: string[]
          notes_heart?: string[]
          notes_base?: string[]
          is_new?: boolean
          is_bestseller?: boolean
          stock?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          street: string
          city: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          street: string
          city: string
          postal_code: string
          country: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          street?: string
          city?: string
          postal_code?: string
          country?: string
          is_default?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          status: string
          subtotal: number
          shipping: number
          total: number
          shipping_address: object
          billing_address: object | null
          payment_method: string | null
          payment_status: string
          tracking_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: string
          subtotal: number
          shipping: number
          total: number
          shipping_address: object
          billing_address?: object | null
          payment_method?: string | null
          payment_status?: string
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          status?: string
          subtotal?: number
          shipping?: number
          total?: number
          shipping_address?: object
          billing_address?: object | null
          payment_method?: string | null
          payment_status?: string
          tracking_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_image: string
          size: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_image: string
          size: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_image?: string
          size?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo?: string | null
          created_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image?: string | null
          created_at?: string
        }
      }
      packs: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          price: number
          original_price: number | null
          image: string
          product_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description: string
          price: number
          original_price?: number | null
          image: string
          product_ids: string[]
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          price?: number
          original_price?: number | null
          image?: string
          product_ids?: string[]
          created_at?: string
        }
      }
    }
  }
}
