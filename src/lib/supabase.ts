import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Fetch personnalisé qui ignore les signaux d'annulation de React 19
// Cela évite les AbortError qui se produisent lors du démontage des composants
const customFetch = (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
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

// Helper pour faire des requêtes REST directes à Supabase sans AbortError
// Utilisé pour contourner le problème d'AbortController de React 19
export async function supabaseFetch<T = any>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    select?: string
    filters?: Record<string, string>
    order?: { column: string; ascending?: boolean }
    body?: object
    single?: boolean
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { method = 'GET', select = '*', filters = {}, order, body, single } = options

  try {
    // Construire l'URL avec les filtres
    const params = new URLSearchParams()
    params.set('select', select)
    for (const [key, value] of Object.entries(filters)) {
      params.set(key, value)
    }
    if (order) {
      params.set('order', `${order.column}.${order.ascending ? 'asc' : 'desc'}`)
    }

    const url = `${supabaseUrl}/rest/v1/${table}?${params.toString()}`

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    }

    if (single) {
      headers['Accept'] = 'application/vnd.pgrst.object+json'
    }

    if (method === 'POST' || method === 'PATCH') {
      headers['Prefer'] = 'return=representation'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { data: null, error: { message: errorText, status: response.status } }
    }

    // Pour DELETE sans retour
    if (method === 'DELETE' && response.status === 204) {
      return { data: null, error: null }
    }

    const data = await response.json()
    return { data: single && Array.isArray(data) ? data[0] : data, error: null }
  } catch (error) {
    return { data: null, error }
  }
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
