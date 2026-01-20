'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalProducts: number
  recentOrders: any[]
  ordersChange: number
  revenueChange: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    recentOrders: [],
    ordersChange: 12.5,
    revenueChange: 8.2
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const isAbortError = (error: unknown): boolean => {
      if (!error) return false
      const message = (error as { message?: string }).message || String(error)
      return message.includes('AbortError') || message.includes('aborted') || message.includes('signal')
    }

    const fetchStats = async () => {
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
        ])

        if (!isMounted) return

        const orders = ordersRes.data || []
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalUsers: usersRes.count || 0,
          totalProducts: productsRes.count || 0,
          recentOrders: orders.slice(0, 5),
          ordersChange: 12.5,
          revenueChange: 8.2
        })
      } catch (error) {
        if (!isMounted) return
        if (!isAbortError(error)) {
          console.error('Error fetching stats:', error)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [])

  const statCards = [
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.totalRevenue.toLocaleString('fr-FR')} €`,
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Commandes',
      value: stats.totalOrders,
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      change: 5.3,
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Produits',
      value: stats.totalProducts,
      change: 0,
      icon: Package,
      color: 'bg-orange-500'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'processing':
        return 'En cours'
      case 'shipped':
        return 'Expédiée'
      case 'cancelled':
        return 'Annulée'
      case 'pending':
        return 'En attente'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.change !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${
                  stat.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-semibold mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm"
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Commandes récentes</h2>
            <a
              href="/admin/commandes"
              className="text-sm text-[#C9A962] hover:underline"
            >
              Voir tout
            </a>
          </div>
        </div>

        {stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">#{order.order_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium">
                          {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{order.shipping_address?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium">{order.total?.toLocaleString('fr-FR')} €</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande pour le moment</p>
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <a
          href="/admin/produits/nouveau"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="p-3 bg-[#C9A962]/10 rounded-lg">
            <Package className="w-6 h-6 text-[#C9A962]" />
          </div>
          <div>
            <p className="font-medium">Ajouter un produit</p>
            <p className="text-sm text-gray-500">Créer un nouveau parfum</p>
          </div>
        </a>

        <a
          href="/admin/commandes"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="p-3 bg-blue-50 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="font-medium">Gérer les commandes</p>
            <p className="text-sm text-gray-500">Voir toutes les commandes</p>
          </div>
        </a>

        <a
          href="/admin/utilisateurs"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="p-3 bg-purple-50 rounded-lg">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="font-medium">Gérer les utilisateurs</p>
            <p className="text-sm text-gray-500">Voir tous les clients</p>
          </div>
        </a>
      </motion.div>
    </div>
  )
}
