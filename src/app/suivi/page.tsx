'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, Truck, CheckCircle, Clock, XCircle, Search, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface OrderItem {
  id: string
  product_name: string
  product_image: string
  size: string
  quantity: number
  price: number
}

interface OrderResult {
  order_number: string
  status: string
  subtotal: number
  shipping: number
  total: number
  tracking_number: string | null
  created_at: string
  shipping_address: {
    firstName: string
    lastName: string
    street: string
    city: string
    postalCode: string
    country: string
  }
  shipping_method: string | null
  items: OrderItem[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmée', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
  pending:   { label: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  processing:{ label: 'En préparation', color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
  shipped:   { label: 'Expédiée', color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck },
  delivered: { label: 'Livrée', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
}

const statusSteps = ['confirmed', 'processing', 'shipped', 'delivered']

export default function SuiviPage() {
  const { user } = useAuthStore()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOrder(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Commande introuvable. Vérifiez le numéro et l\'email.')
        return
      }

      setOrder(data.order)
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const status = order ? (statusConfig[order.status] || statusConfig.pending) : null
  const StatusIcon = status?.icon
  const currentStepIndex = order ? statusSteps.indexOf(order.status) : -1

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-2">
            Suivi de commande
          </h1>
          <p className="text-muted-foreground text-sm">
            Entrez votre numéro de commande et votre email pour suivre votre livraison.
          </p>
          {user && (
            <p className="text-sm mt-2">
              <Link href="/compte/commandes" className="text-primary hover:underline">
                Voir toutes mes commandes →
              </Link>
            </p>
          )}
        </div>

        {/* Formulaire */}
        <div className="bg-cream p-8 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Numéro de commande
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                required
                placeholder="ex : BRZ-2024-0001"
                className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors uppercase"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Email utilisé lors de la commande
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                'Recherche en cours...'
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Suivre ma commande
                </>
              )}
            </button>
          </form>
        </div>

        {/* Résultat */}
        {order && status && StatusIcon && (
          <div className="bg-cream shadow-sm overflow-hidden">
            {/* En-tête commande */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-medium text-lg">{order.order_number}</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bg}`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Passée le {formatDate(order.created_at)}</p>
            </div>

            {/* Barre de progression */}
            {order.status !== 'cancelled' && (
              <div className="px-6 py-5 border-b">
                <div className="flex items-center justify-between relative">
                  <div className="absolute left-0 right-0 top-4 h-0.5 bg-border -z-0" />
                  <div
                    className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500 -z-0"
                    style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (statusSteps.length - 1)) * 100 : 0}%` }}
                  />
                  {statusSteps.map((step, i) => {
                    const s = statusConfig[step]
                    const Icon = s.icon
                    const done = currentStepIndex >= i
                    return (
                      <div key={step} className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${done ? 'bg-primary border-primary text-white' : 'bg-background border-border text-muted-foreground'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs text-center leading-tight ${done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Numéro de suivi */}
            {order.tracking_number && (
              <div className="px-6 py-4 border-b bg-primary/5">
                <p className="text-sm text-muted-foreground mb-1">Numéro de suivi transporteur</p>
                <p className="font-mono font-medium text-primary">{order.tracking_number}</p>
              </div>
            )}

            {/* Articles */}
            <div className="p-6 border-b space-y-4">
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3">Articles</p>
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  {item.product_image && (
                    <div className="relative w-16 h-16 bg-muted flex-shrink-0">
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{item.size} · Qté : {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{item.price.toLocaleString('fr-FR')} €</p>
                </div>
              ))}
            </div>

            {/* Adresse + total */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Livraison</p>
                <p className="text-sm">{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.street}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.postalCode} {order.shipping_address.city}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.country}</p>
                {order.shipping_method && (
                  <p className="text-xs text-muted-foreground mt-1">{order.shipping_method}</p>
                )}
              </div>
              <div>
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">Total</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{order.subtotal.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{order.shipping === 0 ? <span className="text-green-600">Offerte</span> : `${order.shipping.toLocaleString('fr-FR')} €`}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total</span>
                    <span>{order.total.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Un problème ? */}
            <div className="px-6 pb-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Un problème avec votre commande ? Contactez-nous
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
