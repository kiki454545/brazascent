'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { m } from 'framer-motion'
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'
import posthog from 'posthog-js'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (orderNumber) {
      posthog.capture('order_completed', { order_number: orderNumber })
    } else {
      posthog.capture('order_completed')
    }
  }, [orderNumber])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <m.div
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
            <p className="text-lg text-muted-foreground mb-8">
              Commande n° <span className="font-medium text-foreground">{orderNumber}</span>
            </p>
          )}

          <div className="bg-cream p-8 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Confirmation envoyée</p>
                  <p className="text-sm text-muted-foreground">Vérifiez votre boîte mail</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-12 bg-border" />

              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium">En préparation</p>
                  <p className="text-sm text-muted-foreground">Expédition sous 24-48h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-muted-foreground">
              Nous préparons votre commande avec le plus grand soin.
              <br />
              Vous recevrez un email de confirmation avec le suivi de livraison.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/compte/commandes"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
            >
              Suivre ma commande
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/parfums"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-foreground text-sm tracking-[0.15em] uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>
        </m.div>

        {/* Benefits reminder */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-16 border-t"
        >
          <h2 className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-8">
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
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </m.div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-24 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  )
}
