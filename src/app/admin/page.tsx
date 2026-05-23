'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { supabaseFetch } from '@/lib/supabase'

const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })

interface RevenueDay {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  name: string
  revenue: number
  qty: number
}

interface LowStockProduct {
  id: string
  name: string
  stock: number
}

interface DashboardData {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalProducts: number
  recentOrders: any[]
  revenueByDay: RevenueDay[]
  topProducts: TopProduct[]
  lowStockProducts: LowStockProduct[]
  ordersChange: number
  revenueChange: number
}

function buildRevenueByDay(orders: any[]): RevenueDay[] {
  const days: Record<string, RevenueDay> = {}
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days[key] = {
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      revenue: 0,
      orders: 0,
    }
  }
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const key = order.created_at?.slice(0, 10)
    if (key && days[key]) {
      days[key].revenue += order.total || 0
      days[key].orders += 1
    }
  }
  return Object.values(days)
}

function buildTopProducts(items: any[]): TopProduct[] {
  const map: Record<string, TopProduct> = {}
  for (const item of items) {
    const name = item.product_name || 'Inconnu'
    if (!map[name]) map[name] = { name, revenue: 0, qty: 0 }
    map[name].revenue += item.price || 0
    map[name].qty += item.quantity || 0
  }
  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map(p => ({ ...p, name: p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name }))
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 30>(30)

  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      try {
        const [ordersRes, usersRes, productsRes, itemsRes] = await Promise.all([
          supabaseFetch<any[]>('orders', { order: { column: 'created_at', ascending: false } }),
          supabaseFetch<any[]>('user_profiles'),
          supabaseFetch<any[]>('products'),
          supabaseFetch<any[]>('order_items'),
        ])

        if (!isMounted) return

        const orders = ordersRes.data || []
        const products = productsRes.data || []
        const items = itemsRes.data || []

        const validOrders = orders.filter((o: any) => o.status !== 'cancelled')
        const totalRevenue = validOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)

        // Calcul variation sur 30j vs 30j précédents
        const now = Date.now()
        const ms30 = 30 * 86400000
        const last30 = validOrders.filter((o: any) => new Date(o.created_at).getTime() > now - ms30)
        const prev30 = validOrders.filter((o: any) => {
          const t = new Date(o.created_at).getTime()
          return t > now - 2 * ms30 && t <= now - ms30
        })
        const last30Rev = last30.reduce((s: number, o: any) => s + (o.total || 0), 0)
        const prev30Rev = prev30.reduce((s: number, o: any) => s + (o.total || 0), 0)
        const revenueChange = prev30Rev > 0 ? Math.round(((last30Rev - prev30Rev) / prev30Rev) * 100 * 10) / 10 : 0
        const ordersChange = prev30.length > 0 ? Math.round(((last30.length - prev30.length) / prev30.length) * 100 * 10) / 10 : 0

        const lowStockProducts: LowStockProduct[] = products
          .filter((p: any) => p.stock !== null && p.stock <= 5)
          .sort((a: any, b: any) => a.stock - b.stock)
          .slice(0, 8)
          .map((p: any) => ({ id: p.id, name: p.name, stock: p.stock }))

        setData({
          totalOrders: validOrders.length,
          totalRevenue,
          totalUsers: usersRes.data?.length || 0,
          totalProducts: products.length,
          recentOrders: orders.slice(0, 5),
          revenueByDay: buildRevenueByDay(orders),
          topProducts: buildTopProducts(items),
          lowStockProducts,
          ordersChange,
          revenueChange,
        })
      } catch (error) {
        if (isMounted) console.error('Error fetching stats:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchStats()
    return () => { isMounted = false }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-admin-surface-alt text-admin-text'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée'
      case 'processing': return 'En cours'
      case 'confirmed': return 'Confirmée'
      case 'shipped': return 'Expédiée'
      case 'cancelled': return 'Annulée'
      case 'pending': return 'En attente'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const chartData = period === 7 ? data.revenueByDay.slice(-7) : data.revenueByDay

  const statCards = [
    { title: 'Chiffre d\'affaires', value: `${data.totalRevenue.toLocaleString('fr-FR')} €`, change: data.revenueChange, icon: DollarSign, color: 'bg-green-500' },
    { title: 'Commandes', value: data.totalOrders, change: data.ordersChange, icon: ShoppingCart, color: 'bg-blue-500' },
    { title: 'Utilisateurs', value: data.totalUsers, change: 0, icon: Users, color: 'bg-purple-500' },
    { title: 'Produits actifs', value: data.totalProducts, change: 0, icon: Package, color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6 p-6">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <m.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-admin-surface rounded-xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.change !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-semibold mb-0.5">{stat.value}</p>
            <p className="text-xs text-admin-muted">{stat.title}</p>
          </m.div>
        ))}
      </div>

      {/* Alertes stock faible */}
      {data.lowStockProducts.length > 0 && (
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">{data.lowStockProducts.length} produit{data.lowStockProducts.length > 1 ? 's' : ''} en stock faible (≤ 5)</span>
            </div>
            <Link href="/admin/produits" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
              Gérer <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.lowStockProducts.map((p) => (
              <Link key={p.id} href={`/admin/produits/${p.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg text-xs hover:border-orange-400 transition-colors"
              >
                <span className="font-medium truncate max-w-[120px]">{p.name}</span>
                <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>{p.stock}</span>
              </Link>
            ))}
          </div>
        </m.div>
      )}

      {/* Graphique CA */}
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-admin-surface rounded-xl shadow-sm p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-medium">Chiffre d&apos;affaires</h2>
            <p className="text-xs text-admin-muted mt-0.5">Revenus journaliers (commandes validées)</p>
          </div>
          <div className="flex gap-1">
            {([7, 30] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${period === p ? 'bg-[#C9A962] text-white' : 'bg-admin-surface-alt text-admin-muted hover:text-admin-text'}`}
              >
                {p}j
              </button>
            ))}
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A962" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C9A962" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={period === 30 ? 4 : 0} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                formatter={(v: any) => [`${Number(v).toFixed(2)} €`, 'Revenus']}
                contentStyle={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C9A962" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4, fill: '#C9A962' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </m.div>

      {/* Top produits + commandes récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top produits */}
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-admin-surface rounded-xl shadow-sm p-5"
        >
          <h2 className="text-base font-medium mb-4">Top produits (CA)</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  formatter={(v: any) => [`${Number(v).toFixed(2)} €`, 'CA']}
                  contentStyle={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#C9A962" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </m.div>

        {/* Commandes récentes */}
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-admin-surface rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between p-5 border-b border-admin-border">
            <h2 className="text-base font-medium">Commandes récentes</h2>
            <Link href="/admin/commandes" className="text-xs text-[#C9A962] hover:underline">Voir tout</Link>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="divide-y divide-admin-border">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-admin-surface-alt transition-colors">
                  <div>
                    <p className="text-sm font-medium">#{order.order_number}</p>
                    <p className="text-xs text-admin-muted">
                      {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{order.total?.toLocaleString('fr-FR')} €</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <ShoppingCart className="w-10 h-10 text-admin-muted mx-auto mb-3" />
              <p className="text-admin-muted text-sm">Aucune commande</p>
            </div>
          )}
        </m.div>
      </div>

      {/* Actions rapides */}
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Link href="/admin/produits/nouveau"
          className="bg-admin-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="p-2.5 bg-[#C9A962]/10 rounded-lg">
            <Package className="w-5 h-5 text-[#C9A962]" />
          </div>
          <div>
            <p className="font-medium text-sm">Ajouter un produit</p>
            <p className="text-xs text-admin-muted">Créer un nouveau parfum</p>
          </div>
        </Link>
        <Link href="/admin/commandes"
          className="bg-admin-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Gérer les commandes</p>
            <p className="text-xs text-admin-muted">Voir toutes les commandes</p>
          </div>
        </Link>
        <Link href="/admin/blog"
          className="bg-admin-surface rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="p-2.5 bg-purple-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Gérer le blog</p>
            <p className="text-xs text-admin-muted">Articles et contenu</p>
          </div>
        </Link>
      </m.div>
    </div>
  )
}
