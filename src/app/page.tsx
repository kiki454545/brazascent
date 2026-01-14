'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { supabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settings'
import { Product } from '@/types'

export default function HomePage() {
  const heroRef = useRef(null)
  const featuredRef = useRef(null)
  const isFeatureInView = useInView(featuredRef, { once: true })
  const { settings } = useSettingsStore()

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  // Helper pour ignorer les AbortError
  const isAbortError = (error: any): boolean => {
    if (!error) return false
    const message = error.message || ''
    return error.name === 'AbortError' ||
           message.includes('AbortError') ||
           message.includes('signal is aborted')
  }

  // Charger les produits depuis Supabase
  useEffect(() => {
    let isMounted = true

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_bestseller', true)
          .limit(4)

        if (!isMounted) return

        if (error) {
          // Ignorer les erreurs d'annulation
          if (isAbortError(error)) return
          console.error('Error fetching products:', error)
          return
        }

        if (data) {
          const mappedProducts: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            shortDescription: p.short_description || '',
            price: p.price,
            originalPrice: p.original_price,
            images: p.images || [],
            size: p.sizes || [],
            category: p.category || 'unisexe',
            collection: p.collection,
            notes: {
              top: p.notes_top || [],
              heart: p.notes_heart || [],
              base: p.notes_base || []
            },
            inStock: (p.stock || 0) > 0,
            new: p.is_new,
            bestseller: p.is_bestseller,
            featured: p.is_bestseller
          }))
          setFeaturedProducts(mappedProducts)
        }
      } catch (err: any) {
        // Ignorer les erreurs d'annulation
        if (isAbortError(err) || !isMounted) return
        console.error('Error:', err)
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <motion.div style={{ scale: heroScale }} className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=90"
            alt="BrazaScent - Parfumerie d'exception"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative h-full flex flex-col items-center justify-center text-white text-center px-6"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm tracking-[0.3em] uppercase mb-4"
          >
            Collection Signature
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-light tracking-[0.2em] uppercase mb-6"
          >
            L&apos;Art du Parfum
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg md:text-xl font-light max-w-2xl mb-10 leading-relaxed"
          >
            Découvrez nos créations uniques, où chaque fragrance raconte une histoire d&apos;exception
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/parfums"
              className="btn-luxury px-10 py-4 bg-white text-[#19110B] text-sm tracking-[0.2em] uppercase font-medium hover:bg-[#C9A962] hover:text-white transition-colors"
            >
              Découvrir
            </Link>
            <Link
              href="/marques"
              className="px-10 py-4 border border-white text-sm tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-[#19110B] transition-colors"
            >
              Nos Marques
            </Link>
          </motion.div>
        </motion.div>

      </section>

      {/* Featured Products Section */}
      <section ref={featuredRef} className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isFeatureInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              Sélection
            </span>
            <h2 className="text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-6">
              Nos Créations
            </h2>
            <div className="w-24 h-px bg-[#C9A962] mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isFeatureInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <Link
              href="/parfums"
              className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase hover:text-[#C9A962] transition-colors group"
            >
              Voir tous les parfums
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-24 lg:py-32 bg-[#19110B] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
                Notre Histoire
              </span>
              <h2 className="text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-8">
                L&apos;Excellence<br />à la Française
              </h2>
              <div className="w-24 h-px bg-[#C9A962] mb-8" />
              <p className="text-gray-300 leading-relaxed mb-6">
                Fondée sur la passion de l&apos;art olfactif, BrazaScent perpétue les traditions
                de la haute parfumerie française tout en explorant de nouvelles voies créatives.
              </p>
              <p className="text-gray-300 leading-relaxed mb-8">
                Chaque fragrance est le fruit d&apos;un travail minutieux, où les plus belles
                matières premières du monde sont sublimées par le savoir-faire de nos
                Maîtres Parfumeurs.
              </p>
              <Link
                href="/parfums"
                className="inline-flex items-center gap-3 text-sm tracking-[0.2em] uppercase text-[#C9A962] hover:text-white transition-colors group"
              >
                Découvrir nos parfums
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800"
                  alt="L'art du parfum"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Video play button overlay */}
              <button className="absolute inset-0 flex items-center justify-center group">
                <div className="w-20 h-20 rounded-full border-2 border-white/50 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            {[
              {
                title: 'Livraison Premium',
                description: `Livraison offerte dès ${settings.freeShippingThreshold}€. Écrin luxueux et personnalisé.`,
              },
              {
                title: 'Échantillons',
                description: 'Un échantillon aléatoire offert dès 120€ d\'achat.',
              },
              {
                title: 'Service Client',
                description: 'Nos conseillers sont à votre écoute 7j/7.',
              },
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 border border-[#C9A962] rounded-full flex items-center justify-center">
                  <span className="text-2xl text-[#C9A962]">0{index + 1}</span>
                </div>
                <h3 className="text-lg tracking-[0.15em] uppercase mb-4">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-24 lg:py-32 bg-[#F9F6F1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <span className="text-sm tracking-[0.3em] uppercase text-[#C9A962] mb-4 block">
              @braza.scent
            </span>
            <h2 className="text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase">
              Suivez-nous
            </h2>
          </div>

          <div className="flex justify-center gap-8 lg:gap-16">
            <motion.a
              href="https://snapchat.com/t/eOoOvNcf"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-[#FFFC00] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 lg:w-12 lg:h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                </svg>
              </div>
              <span className="text-sm tracking-[0.15em] uppercase text-gray-600 group-hover:text-[#C9A962] transition-colors">Snapchat</span>
            </motion.a>

            <motion.a
              href="https://www.tiktok.com/@braza.scent"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 lg:w-12 lg:h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <span className="text-sm tracking-[0.15em] uppercase text-gray-600 group-hover:text-[#C9A962] transition-colors">TikTok</span>
            </motion.a>
          </div>
        </div>
      </section>
    </div>
  )
}
