'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gift, Truck, Star, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/store/cart'

interface Pack {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price: number | null
  image: string
  product_ids: string[]
  tag: string | null
  is_active: boolean
}

interface Product {
  id: string
  name: string
}

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(150)
  const { addItem } = useCartStore()

  useEffect(() => {
    let isMounted = true

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted')
    }

    const fetchData = async () => {
      try {
        // Fetch packs
        const { data: packsData, error: packsError } = await supabase
          .from('packs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (!isMounted) return
        if (packsError) throw packsError

        // Fetch products for names
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')

        if (!isMounted) return
        if (productsError) throw productsError

        // Fetch shipping settings
        const settingsResponse = await fetch('/api/settings')
        const settingsData = await settingsResponse.json()
        if (!isMounted) return
        if (settingsData?.shipping?.freeShippingThreshold) {
          setFreeShippingThreshold(settingsData.shipping.freeShippingThreshold)
        }

        // Create products lookup
        const productsLookup: Record<string, Product> = {}
        productsData?.forEach(p => {
          productsLookup[p.id] = p
        })

        setPacks(packsData || [])
        setProducts(productsLookup)
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('Error fetching packs:', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  const getProductNames = (productIds: string[]) => {
    return productIds
      .map(id => products[id]?.name)
      .filter(Boolean)
      .join(', ')
  }

  const handleAddToCart = (pack: Pack) => {
    // Créer un objet Product compatible pour le panier
    const packAsProduct = {
      id: pack.id,
      name: pack.name,
      slug: pack.slug,
      description: pack.description,
      shortDescription: pack.description.substring(0, 100),
      price: pack.price,
      originalPrice: pack.original_price || undefined,
      images: [pack.image],
      category: 'collection' as const,
      notes: { top: [], heart: [], base: [] },
      size: ['Pack'],
      inStock: true,
    }
    addItem(packAsProduct, 'Pack', 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="/images/packs-hero.jpg"
          alt="Nos Coffrets"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Coffrets
            </span>
            <h1 className="text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-4">
              Nos Packs
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Des coffrets d&apos;exception pour offrir ou se faire plaisir
            </p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-[#F9F6F1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Gift, title: 'Échantillons offerts', description: 'Dès 120€ d\'achat' },
              { icon: Truck, title: 'Livraison offerte', description: `Dès ${freeShippingThreshold}€ d'achat` },
              { icon: Star, title: 'Économies', description: 'Réductions sur les packs' },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 justify-center"
              >
                <benefit.icon className="w-8 h-8 text-[#C9A962]" />
                <div>
                  <p className="font-medium">{benefit.title}</p>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {packs.length === 0 ? (
            <div className="text-center py-16">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun pack disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {packs.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <Link href={`/packs/${pack.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden mb-6 bg-[#F9F6F1]">
                      <Image
                        src={pack.image}
                        alt={pack.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {pack.tag && (
                        <span className="absolute top-4 left-4 px-3 py-1 bg-[#C9A962] text-white text-xs tracking-wider uppercase">
                          {pack.tag}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-2 group-hover:text-[#C9A962] transition-colors">
                      {pack.name}
                    </h2>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {pack.description}
                    </p>

                    {pack.product_ids?.length > 0 && (
                      <div className="text-xs text-gray-500 mb-4">
                        <p className="line-clamp-1">Contient : {getProductNames(pack.product_ids)}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-xl font-medium">{pack.price} €</span>
                      {pack.original_price && (
                        <span className="text-gray-400 line-through">{pack.original_price} €</span>
                      )}
                      {pack.original_price && (
                        <span className="text-xs text-[#C9A962] font-medium">
                          -{Math.round((1 - pack.price / pack.original_price) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>

                  <button
                    onClick={() => handleAddToCart(pack)}
                    className="w-full mt-4 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    Ajouter au panier
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#19110B] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Gift className="w-16 h-16 text-[#C9A962] mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-light tracking-[0.15em] uppercase mb-6">
              Coffret personnalisé
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Créez votre propre coffret sur-mesure en sélectionnant vos parfums préférés.
              Un cadeau unique et personnel.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 border border-[#C9A962] text-[#C9A962] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] hover:text-white transition-colors"
            >
              Nous contacter
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
