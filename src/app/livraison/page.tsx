'use client'

import { Truck, Clock, Package, CheckCircle, MapPin } from 'lucide-react'
import { useSettingsStore } from '@/store/settings'

export default function LivraisonPage() {
  const { settings } = useSettingsStore()

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#19110B] text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl lg:text-5xl font-light tracking-[0.2em] uppercase mb-4">
            Livraison
          </h1>
          <p className="text-gray-400 text-lg">
            Informations sur nos modes de livraison
          </p>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="max-w-4xl mx-auto px-6 py-16 lg:py-24">
        <h2 className="text-2xl font-medium tracking-[0.1em] uppercase mb-8 text-[#19110B] text-center">
          Nos modes de livraison
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Standard */}
          <div className="border border-gray-200 rounded-lg p-8 hover:border-[#C9A962] transition-colors">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#FAF9F7] rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#C9A962]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#19110B]">Livraison Standard</h3>
                <p className="text-sm text-gray-500">Colissimo</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5 text-[#C9A962]" />
                <span>3-5 jours ouvrés</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Package className="w-5 h-5 text-[#C9A962]" />
                <span>Suivi inclus</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-6">
              <p className="text-2xl font-medium text-[#19110B]">
                {settings.standardShippingPrice?.toFixed(2) || '9.90'}€
              </p>
              <p className="text-sm text-[#C9A962] mt-1">
                Offerte dès {settings.freeShippingThreshold || 150}€ d'achat
              </p>
            </div>
          </div>

          {/* Express */}
          <div className="border border-[#C9A962] rounded-lg p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#C9A962] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              Rapide
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#C9A962]/10 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#C9A962]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#19110B]">Livraison Express</h3>
                <p className="text-sm text-gray-500">Chronopost</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Clock className="w-5 h-5 text-[#C9A962]" />
                <span>1-2 jours ouvrés</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Package className="w-5 h-5 text-[#C9A962]" />
                <span>Suivi en temps réel</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-6">
              <p className="text-2xl font-medium text-[#19110B]">
                {settings.expressShippingPrice?.toFixed(2) || '14.90'}€
              </p>
            </div>
          </div>
        </div>

        {/* Zones */}
        <div className="bg-[#FAF9F7] rounded-lg p-8 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="w-6 h-6 text-[#C9A962]" />
            <h3 className="text-xl font-medium text-[#19110B]">Zones de livraison</h3>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            Nous livrons actuellement en <strong>France métropolitaine uniquement</strong>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            La livraison vers les DOM-TOM et à l'international sera bientôt disponible.
            Inscrivez-vous à notre newsletter pour être informé de l'ouverture de ces zones.
          </p>
        </div>

        {/* Process */}
        <h2 className="text-2xl font-medium tracking-[0.1em] uppercase mb-8 text-[#19110B] text-center">
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
              <div className="w-12 h-12 bg-[#C9A962] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-medium">
                {item.step}
              </div>
              <h3 className="font-medium text-[#19110B] mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Guarantees */}
        <div className="border border-gray-200 rounded-lg p-8">
          <h3 className="text-xl font-medium text-[#19110B] mb-6 text-center">
            Nos garanties
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-[#C9A962] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-[#19110B] mb-1">Emballage soigné</h4>
                <p className="text-sm text-gray-600">Chaque parfum est protégé pour un transport en toute sécurité</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-[#C9A962] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-[#19110B] mb-1">Suivi en temps réel</h4>
                <p className="text-sm text-gray-600">Suivez votre colis à chaque étape de sa livraison</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-[#C9A962] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-[#19110B] mb-1">Service client réactif</h4>
                <p className="text-sm text-gray-600">Une question ? Notre équipe vous répond rapidement</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Vous avez d'autres questions sur la livraison ?
          </p>
          <a
            href="/faq"
            className="inline-block px-8 py-3 bg-[#C9A962] text-white text-sm tracking-[0.15em] uppercase font-medium hover:bg-[#B8944F] transition-colors"
          >
            Consulter la FAQ
          </a>
        </div>
      </section>
    </main>
  )
}
