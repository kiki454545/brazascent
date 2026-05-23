'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Trash2, ArrowRight, Share2, Check } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types'
import { AccountSidebar } from '@/components/AccountSidebar'
import { ProductCard } from '@/components/ProductCard'

export default function FavorisPage() {
  const { items: wishlistIds, removeItem, clearWishlist } = useWishlistStore()
  const { user } = useAuthStore()
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistIds.length === 0) {
        setWishlistProducts([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, slug, description, short_description, price, original_price, price_by_size, images, sizes, category, collection, brand, notes_top, notes_heart, notes_base, stock, is_new, is_bestseller')
          .in('id', wishlistIds)

        if (error) {
          console.error('Error fetching wishlist products:', error)
          setWishlistProducts([])
        } else if (data) {
          const mappedProducts: Product[] = data.map((p: any) => {
            const priceBySize = typeof p.price_by_size === 'string'
              ? JSON.parse(p.price_by_size)
              : (p.price_by_size || {})
            const prices = Object.values(priceBySize).filter((v): v is number => typeof v === 'number' && v > 0)
            const displayPrice = prices.length > 0 ? Math.min(...prices) : (p.price || 0)
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
              brand: p.brand || 'BrazaScent',
              notes: {
                top: p.notes_top || [],
                heart: p.notes_heart || [],
                base: p.notes_base || []
              },
              inStock: (p.stock || 0) > 0,
              stock: p.stock,
              new: p.is_new,
              bestseller: p.is_bestseller,
              featured: p.is_bestseller
            }
          })
          setWishlistProducts(mappedProducts)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [wishlistIds])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="animate-fade-in-up">
            <Heart className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
            <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-4">
              Votre liste de favoris est vide
            </h1>
            <p className="text-muted-foreground mb-8">
              Explorez nos parfums et ajoutez vos préférés à votre liste
            </p>
            <Link
              href="/parfums"
              className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
            >
              Découvrir nos parfums
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="px-6 sm:px-10 lg:px-20">
        <div>
          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-2">
                Mes Favoris
              </h1>
              <p className="text-muted-foreground">
                {wishlistProducts.length} parfum{wishlistProducts.length > 1 ? 's' : ''} dans votre liste
              </p>
            </div>
            {wishlistProducts.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/favoris/partage?ids=${wishlistIds.join(',')}`
                    navigator.clipboard.writeText(url)
                    setShared(true)
                    setTimeout(() => setShared(false), 2500)
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {shared ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  {shared ? 'Lien copié !' : 'Partager ma liste'}
                </button>
                <button
                  onClick={clearWishlist}
                  className="text-sm text-muted-foreground hover:text-red-600 transition-colors"
                >
                  Vider la liste
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <AccountSidebar />
            </div>
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {wishlistProducts.map((product, index) => (
                  <div key={product.id} className="relative">
                    <ProductCard product={product} index={index} />
                    {/* Bouton supprimer des favoris */}
                    <button
                      onClick={() => removeItem(product.id)}
                      className="absolute top-3 left-3 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded-full shadow hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Retirer des favoris"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              {!user && (
                <div className="mt-12 p-6 bg-cream text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Connectez-vous pour sauvegarder vos favoris et les retrouver sur tous vos appareils
                  </p>
                  <Link
                    href="/compte"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    Se connecter
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
