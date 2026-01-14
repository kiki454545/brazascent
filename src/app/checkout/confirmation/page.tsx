'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F9F6F1]">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl lg:text-4xl font-light tracking-[0.15em] uppercase mb-4">
            Merci pour votre commande
          </h1>

          {orderNumber && (
            <p className="text-lg text-gray-600 mb-8">
              Commande n° <span className="font-medium text-[#19110B]">{orderNumber}</span>
            </p>
          )}

          <div className="bg-white p-8 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-[#C9A962]" />
                <div className="text-left">
                  <p className="font-medium">Confirmation envoyée</p>
                  <p className="text-sm text-gray-500">Vérifiez votre boîte mail</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 bg-gray-200" />

              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-[#C9A962]" />
                <div className="text-left">
                  <p className="font-medium">En préparation</p>
                  <p className="text-sm text-gray-500">Expédition sous 24-48h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-gray-600">
              Nous préparons votre commande avec le plus grand soin.
              <br />
              Vous recevrez un email de confirmation avec le suivi de livraison.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/compte/commandes"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
            >
              Suivre ma commande
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/parfums"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#19110B] text-sm tracking-[0.15em] uppercase hover:bg-[#19110B] hover:text-white transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>
        </motion.div>

        {/* Benefits reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-16 border-t"
        >
          <h2 className="text-sm tracking-[0.2em] uppercase text-gray-500 mb-8">
            Nos engagements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                title: 'Livraison soignée',
                description: 'Écrin luxueux et emballage cadeau offert',
              },
              {
                title: 'Échantillons offerts',
                description: '3 échantillons inclus dans chaque commande',
              },
              {
                title: 'Retours gratuits',
                description: '30 jours pour changer d\'avis',
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-24 bg-[#F9F6F1] flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
