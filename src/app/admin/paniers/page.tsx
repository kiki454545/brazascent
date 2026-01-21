'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  ShoppingCart,
  Clock,
  AlertTriangle,
  RefreshCw,
  Package,
  Euro,
  User,
  Mail,
  ChevronDown,
  ExternalLink
} from 'lucide-react'

interface CartItem {
  product_id: string
  name: string
  size: string
  quantity: number
  price: number
  image?: string
}

interface ActiveCart {
  id: string
  visitor_id: string
  session_id: string
  items: CartItem[]
  subtotal: number
  item_count: number
  last_activity: string
  abandoned_at: string | null
  converted_at: string | null
  user_email: string | null
  created_at: string
}

export default function AdminPaniersPage() {
  const [carts, setCarts] = useState<ActiveCart[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedCart, setExpandedCart] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'abandoned'>('all')

  const fetchCarts = async () => {
    try {
      const response = await fetch('/api/tracking?type=carts')
      const data = await response.json()
      setCarts(data.carts || [])
    } catch (error) {
      console.error('Error fetching carts:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCarts()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchCarts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCarts()
  }

  const getTimeSinceActivity = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}min`
    return `${minutes} min`
  }

  const isAbandoned = (cart: ActiveCart) => {
    if (cart.abandoned_at) return true
    const diff = Date.now() - new Date(cart.last_activity).getTime()
    return diff > 2 * 60 * 60 * 1000 // Plus de 2 heures
  }

  const filteredCarts = carts.filter(cart => {
    if (filter === 'active') return !isAbandoned(cart)
    if (filter === 'abandoned') return isAbandoned(cart)
    return true
  })

  const totalValue = filteredCarts.reduce((sum, cart) => sum + cart.subtotal, 0)
  const totalItems = filteredCarts.reduce((sum, cart) => sum + cart.item_count, 0)
  const abandonedCount = carts.filter(isAbandoned).length
  const activeCount = carts.filter(c => !isAbandoned(c)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Paniers actifs</h1>
          <p className="text-gray-500">
            Suivi des paniers en cours et abandonnés
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Total paniers</span>
          </div>
          <p className="text-2xl font-semibold">{carts.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Paniers actifs</span>
          </div>
          <p className="text-2xl font-semibold">{activeCount}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Abandonnés</span>
          </div>
          <p className="text-2xl font-semibold">{abandonedCount}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#C9A962]/20 text-[#C9A962] rounded-lg">
              <Euro className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500">Valeur totale</span>
          </div>
          <p className="text-2xl font-semibold">{totalValue.toFixed(2)} €</p>
          <p className="text-sm text-gray-500">{totalItems} articles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[#19110B] text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Tous ({carts.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Actifs ({activeCount})
        </button>
        <button
          onClick={() => setFilter('abandoned')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'abandoned'
              ? 'bg-orange-600 text-white'
              : 'bg-white border hover:bg-gray-50'
          }`}
        >
          Abandonnés ({abandonedCount})
        </button>
      </div>

      {/* Carts List */}
      <div className="bg-white rounded-xl shadow-sm">
        {filteredCarts.length > 0 ? (
          <div className="divide-y">
            {filteredCarts.map((cart) => {
              const abandoned = isAbandoned(cart)
              const isExpanded = expandedCart === cart.id

              return (
                <div key={cart.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedCart(isExpanded ? null : cart.id)}
                  >
                    {/* Status Icon */}
                    <div className={`p-3 rounded-xl ${
                      abandoned
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {abandoned ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : (
                        <ShoppingCart className="w-6 h-6" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {cart.item_count} article{cart.item_count > 1 ? 's' : ''}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          abandoned
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {abandoned ? 'Abandonné' : 'Actif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeSinceActivity(cart.last_activity)} d&apos;inactivité
                        </span>
                        {cart.user_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {cart.user_email}
                          </span>
                        )}
                        <span className="font-mono text-xs">
                          {cart.visitor_id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <p className="text-xl font-semibold">{cart.subtotal.toFixed(2)} €</p>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded: Cart Items */}
                  {isExpanded && cart.items && cart.items.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        Articles dans le panier
                      </p>
                      <div className="space-y-3">
                        {cart.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden relative">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.size} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              {(item.price * item.quantity).toFixed(2)} €
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        {cart.user_email && (
                          <a
                            href={`mailto:${cart.user_email}?subject=Votre panier vous attend !&body=Bonjour,%0A%0ANous avons remarqué que vous avez laissé des articles dans votre panier. Besoin d'aide pour finaliser votre commande ?%0A%0ACordialement,%0ABraza Scent`}
                            className="flex items-center gap-2 px-4 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#b8944d] transition-colors text-sm"
                          >
                            <Mail className="w-4 h-4" />
                            Envoyer un rappel
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Aucun panier</p>
            <p className="text-sm text-gray-400">
              {filter === 'all'
                ? 'Aucun panier actif pour le moment'
                : filter === 'active'
                ? 'Aucun panier actif'
                : 'Aucun panier abandonné'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
