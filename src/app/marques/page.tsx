'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Benefits } from '@/components/Benefits'
import { supabase } from '@/lib/supabase'

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
}

export default function MarquesPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Forcer loading à true au démarrage
    setLoading(true)

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted') || message.includes('signal')
    }

    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true })

        if (!isMounted) return

        if (error) {
          if (!isAbortError(error)) {
            console.error('Error fetching brands:', error)
          }
          setBrands([])
        } else {
          setBrands(data || [])
        }
      } catch (err) {
        if (isMounted && !isAbortError(err)) {
          console.error('Error:', err)
          setBrands([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchBrands()

    return () => {
      isMounted = false
    }
  }, [])
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[35vh] sm:h-[50vh] min-h-[240px] sm:min-h-[360px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1592765213186-912a7504662d?w=1920&q=90"
          alt="Nos Marques"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-6 pt-24 sm:pt-0">
          <div className="max-w-3xl animate-fade-in-up">
            <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary mb-4 block">
              Maisons
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4">
              Nos Marques
            </h1>
            <p className="text-sm sm:text-lg font-light max-w-xl mx-auto">
              Les plus grandes maisons de parfumerie réunies pour vous
            </p>
          </div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : brands.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {brands.map((brand, index) => (
                <div key={brand.id}>
                  <Link href={`/marques/${brand.slug}`} className="group block text-center">
                    <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-cream">
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-light tracking-[0.15em] uppercase mb-2 group-hover:text-primary transition-colors truncate">
                      {brand.name}
                    </h2>

                    {brand.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 break-words max-w-xs mx-auto">
                        {brand.description}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune marque disponible pour le moment</p>
            </div>
          )}
        </div>
      </section>

      <Benefits />
    </div>
  )
}
