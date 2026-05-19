'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Truck, Clock, Package, CheckCircle, MapPin, Loader2 } from 'lucide-react'

interface ShippingMethod {
  id: string
  title: string
  description: string | null
  description_2: string | null
  price: number
  image_url: string | null
  badge: string | null
  free_threshold: number | null
  sort_order: number
}

export default function LivraisonPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shipping-methods')
      .then((r) => r.json())
      .then((data) => setMethods(data.methods || []))
      .catch(() => setMethods([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-black text-white pt-32 lg:pt-40 pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Livraison
          </h1>
          <p className="text-white text-lg">
            Informations sur nos modes de livraison
          </p>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <h2 className="text-2xl font-medium tracking-[0.1em] uppercase mb-8 text-foreground text-center">
          Nos modes de livraison
        </h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : methods.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            Aucun mode de livraison disponible pour le moment.
          </p>
        ) : (
          <div className={`grid gap-6 mb-16 ${
            methods.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
            methods.length === 2 ? 'md:grid-cols-2' :
            'md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {methods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-8 relative overflow-hidden transition-colors ${
                  method.badge
                    ? 'border-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                {method.badge && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    {method.badge}
                  </div>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                    {method.image_url ? (
                      <Image
                        src={method.image_url}
                        alt={method.title}
                        fill
                        sizes="48px"
                        className="object-contain p-1.5"
                      />
                    ) : (
                      <Truck className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium text-foreground truncate">{method.title}</h3>
                    {method.description && (
                      <p className="text-sm text-muted-foreground truncate">{method.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {method.description_2 && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{method.description_2}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Package className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Suivi inclus</span>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <p className="text-2xl font-medium text-foreground">
                    {Number(method.price).toFixed(2)} €
                  </p>
                  {method.free_threshold !== null && (
                    <p className="text-sm text-primary mt-1">
                      Offerte dès {Number(method.free_threshold).toFixed(2)} € d&apos;achat
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Zones */}
        <div className="bg-cream rounded-lg p-8 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-medium text-foreground">Zones de livraison</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Nous livrons actuellement en <strong>France métropolitaine</strong> et en <strong>Belgique</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            La livraison vers les DOM-TOM et dans d'autres pays sera bientôt disponible.
            Inscrivez-vous à notre newsletter pour être informé de l'ouverture de nouvelles zones.
          </p>
        </div>

        {/* Process */}
        <h2 className="text-2xl font-medium tracking-[0.1em] uppercase mb-8 text-foreground text-center">
          Comment ça marche ?
        </h2>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {[
            { step: 1, title: 'Commande', desc: 'Validez votre panier et choisissez votre mode de livraison' },
            { step: 2, title: 'Préparation', desc: 'Votre commande est préparée avec soin sous 24h' },
            { step: 3, title: 'Expédition', desc: 'Un email avec le numéro de suivi vous est envoyé' },
            { step: 4, title: 'Réception', desc: 'Votre colis arrive chez vous en toute sécurité' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-medium">
                {item.step}
              </div>
              <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Guarantees */}
        <div className="border border-border rounded-lg p-8">
          <h3 className="text-xl font-medium text-foreground mb-6 text-center">
            Nos garanties
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Emballage soigné</h4>
                <p className="text-sm text-muted-foreground">Chaque parfum est protégé pour un transport en toute sécurité</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Suivi en temps réel</h4>
                <p className="text-sm text-muted-foreground">Suivez votre colis à chaque étape de sa livraison</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">Service client réactif</h4>
                <p className="text-sm text-muted-foreground">Une question ? Notre équipe vous répond rapidement</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Vous avez d'autres questions sur la livraison ?
          </p>
          <a
            href="/faq"
            className="inline-block px-8 py-3 bg-primary text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-gold-light transition-colors"
          >
            Consulter la FAQ
          </a>
        </div>
      </section>
    </main>
  )
}
