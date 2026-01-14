'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Package, ArrowLeft, ChevronRight, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

interface OrderItem {
  id: string
  product_name: string
  product_image: string
  size: string
  quantity: number
  price: number
}

interface Order {
  id: string
  order_number: string
  status: string
  subtotal: number
  shipping: number
  total: number
  payment_status: string
  tracking_number: string | null
  created_at: string
  items?: OrderItem[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  processing: { label: 'En préparation', color: 'text-blue-600 bg-blue-50', icon: Package },
  shipped: { label: 'Expédiée', color: 'text-purple-600 bg-purple-50', icon: Truck },
  delivered: { label: 'Livrée', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'text-red-600 bg-red-50', icon: XCircle },
}

export default function CommandesPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/compte')
    }
  }, [isInitialized, user, router])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          return { ...order, items: items || [] }
        })
      )

      setOrders(ordersWithItems)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F9F6F1]">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back link */}
          <Link
            href="/compte"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#C9A962] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au compte
          </Link>

          {/* Header */}
          <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-8">
            Mes Commandes
          </h1>

          {/* Orders list */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 shadow-sm text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-light tracking-[0.1em] uppercase mb-2">
                Aucune commande
              </h2>
              <p className="text-gray-500 mb-6">
                Vous n&apos;avez pas encore passé de commande
              </p>
              <Link
                href="/parfums"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.1em] uppercase hover:bg-[#C9A962] transition-colors"
              >
                Découvrir nos parfums
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending
                const StatusIcon = status.icon
                const isExpanded = expandedOrder === order.id

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white shadow-sm overflow-hidden"
                  >
                    {/* Order header */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full p-6 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${status.color}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-medium">{order.total.toLocaleString('fr-FR')} €</p>
                            <p className={`text-sm ${status.color.split(' ')[0]}`}>{status.label}</p>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Order details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="border-t"
                      >
                        {/* Items */}
                        <div className="p-6 space-y-4">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex gap-4">
                              <div className="relative w-20 h-20 bg-[#F9F6F1] flex-shrink-0">
                                {item.product_image && (
                                  <Image
                                    src={item.product_image}
                                    alt={item.product_name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-gray-500">{item.size}</p>
                                <p className="text-sm text-gray-500">Quantité : {item.quantity}</p>
                              </div>
                              <p className="font-medium">{item.price.toLocaleString('fr-FR')} €</p>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="p-6 bg-gray-50 border-t">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sous-total</span>
                              <span>{order.subtotal.toLocaleString('fr-FR')} €</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Livraison</span>
                              <span>
                                {order.shipping === 0 ? (
                                  <span className="text-green-600">Offerte</span>
                                ) : (
                                  `${order.shipping.toLocaleString('fr-FR')} €`
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium pt-2 border-t">
                              <span>Total</span>
                              <span>{order.total.toLocaleString('fr-FR')} €</span>
                            </div>
                          </div>

                          {/* Tracking */}
                          {order.tracking_number && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm text-gray-500">Numéro de suivi</p>
                              <p className="font-medium">{order.tracking_number}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
