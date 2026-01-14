'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Building2 } from 'lucide-react'
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
    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true })

        if (error) {
          console.error('Error fetching brands:', error)
        } else if (data) {
          setBrands(data)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBrands()
  }, [])
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&q=90"
          alt="Nos Marques"
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
              Maisons
            </span>
            <h1 className="text-5xl lg:text-6xl font-light tracking-[0.2em] uppercase mb-4">
              Nos Marques
            </h1>
            <p className="text-lg font-light max-w-xl mx-auto">
              Les plus grandes maisons de parfumerie réunies pour vous
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : brands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {brands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/marques/${brand.slug}`} className="group block">
                    <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-gray-100">
                      {brand.logo ? (
                        <>
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-2 group-hover:text-[#C9A962] transition-colors">
                      {brand.name}
                    </h2>

                    {brand.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {brand.description}
                      </p>
                    )}

                    <div className="flex items-center justify-end">
                      <span className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-[#C9A962] group-hover:gap-3 transition-all">
                        Découvrir
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune marque disponible pour le moment</p>
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
            <h2 className="text-3xl lg:text-4xl font-light tracking-[0.15em] uppercase mb-6">
              Vous êtes une marque ?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Rejoignez notre sélection exclusive de maisons de parfumerie et présentez vos créations
              à notre clientèle exigeante.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-8 py-4 border border-[#C9A962] text-[#C9A962] text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] hover:text-white transition-colors"
            >
              Nous contacter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
