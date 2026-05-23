'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Download,
  X,
  Save,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Archive,
  AlertCircle
} from 'lucide-react'
import { supabase, supabaseFetch } from '@/lib/supabase'

interface Order {
  id: string
  order_number: string
  user_id: string
  items: any[]
  subtotal: number
  shipping: number
  discount: number | null
  promo_code: string | null
  total: number
  status: string
  shipping_method: string
  payment_method: string
  shipping_address: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  tracking_number: string | null
  tracking_url: string | null
  carrier: string | null
  shipped_at: string | null
  delivered_at: string | null
  admin_notes: string | null
  created_at: string
}

const statusOptions = [
  { value: 'pending', label: 'En attente', icon: Clock, color: 'bg-yellow-100 text-yellow-800', step: 1 },
  { value: 'processing', label: 'En préparation', icon: Package, color: 'bg-blue-100 text-blue-800', step: 2 },
  { value: 'shipped', label: 'Expédiée', icon: Truck, color: 'bg-purple-100 text-purple-800', step: 3 },
  { value: 'completed', label: 'Livrée', icon: CheckCircle, color: 'bg-green-100 text-green-800', step: 4 },
  { value: 'cancelled', label: 'Annulée', icon: XCircle, color: 'bg-red-100 text-red-800', step: 0 }
]

const carrierOptions = [
  { value: 'colissimo', label: 'Colissimo', trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=' },
  { value: 'chronopost', label: 'Chronopost', trackingUrl: 'https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=' },
  { value: 'ups', label: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum=' },
  { value: 'dhl', label: 'DHL', trackingUrl: 'https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=' },
  { value: 'fedex', label: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=' },
  { value: 'mondialrelay', label: 'Mondial Relay', trackingUrl: 'https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=' },
  { value: 'other', label: 'Autre', trackingUrl: '' }
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [exportDropdown, setExportDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    status: '',
    tracking_number: '',
    tracking_url: '',
    carrier: '',
    admin_notes: ''
  })

  useEffect(() => {
    let isMounted = true

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabaseFetch<Order[]>('orders', {
          order: { column: 'created_at', ascending: false }
        })

        if (!isMounted) return

        if (error) {
          console.error('Error fetching orders:', error)
        } else if (data) {
          setOrders(data)
        }
      } catch (error) {
        if (isMounted) console.error('Error fetching orders:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchOrders()

    return () => {
      isMounted = false
    }
  }, [])

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      if (statusDropdown) {
        setStatusDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [statusDropdown])

  useEffect(() => {
    if (selectedOrder) {
      setEditForm({
        status: selectedOrder.status,
        tracking_number: selectedOrder.tracking_number || '',
        tracking_url: selectedOrder.tracking_url || '',
        carrier: selectedOrder.carrier || '',
        admin_notes: selectedOrder.admin_notes || ''
      })
    }
  }, [selectedOrder])

  const refetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
  }

  // Séparer les commandes actives et terminées
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId)
    setStatusDropdown(null)

    try {
      const updateData: any = { status: newStatus }

      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      }
      if (newStatus === 'completed') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (!error) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, ...updateData } : order
        ))

        if (newStatus === 'processing' || newStatus === 'completed') {
          fetch('/api/email/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status: newStatus }),
          }).catch(console.error)
        }
      } else {
        console.error('Error updating order:', error)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const saveOrderDetails = async () => {
    if (!selectedOrder) return

    setSaving(true)
    try {
      const updateData: any = {
        status: editForm.status,
        tracking_number: editForm.tracking_number || null,
        tracking_url: editForm.tracking_url || null,
        carrier: editForm.carrier || null,
        admin_notes: editForm.admin_notes || null
      }

      const isNewShipment = editForm.status === 'shipped' && !selectedOrder.shipped_at
      const isNewProcessing = editForm.status === 'processing' && selectedOrder.status !== 'processing'
      const isNewDelivered = editForm.status === 'completed' && !selectedOrder.delivered_at

      if (isNewShipment) {
        updateData.shipped_at = new Date().toISOString()
      }
      if (isNewDelivered) {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id)

      if (!error) {
        const updatedOrder = { ...selectedOrder, ...updateData }
        setOrders(orders.map(order =>
          order.id === selectedOrder.id ? updatedOrder : order
        ))
        setSelectedOrder(updatedOrder)

        if (isNewShipment) {
          fetch('/api/email/shipping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: selectedOrder.id }),
          }).catch(console.error)
        }
        if (isNewProcessing || isNewDelivered) {
          fetch('/api/email/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: selectedOrder.id, status: editForm.status }),
          }).catch(console.error)
        }
      }
    } catch (error) {
      console.error('Error saving order:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCarrierChange = (carrier: string) => {
    setEditForm({ ...editForm, carrier })

    if (editForm.tracking_number) {
      const carrierConfig = carrierOptions.find(c => c.value === carrier)
      if (carrierConfig && carrierConfig.trackingUrl) {
        setEditForm(prev => ({
          ...prev,
          carrier,
          tracking_url: carrierConfig.trackingUrl + prev.tracking_number
        }))
      }
    }
  }

  const handleTrackingNumberChange = (tracking_number: string) => {
    setEditForm(prev => {
      const newForm = { ...prev, tracking_number }

      if (prev.carrier && prev.carrier !== 'other') {
        const carrierConfig = carrierOptions.find(c => c.value === prev.carrier)
        if (carrierConfig && carrierConfig.trackingUrl) {
          newForm.tracking_url = carrierConfig.trackingUrl + tracking_number
        }
      }

      return newForm
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  const getStatusStep = (status: string) => {
    return statusOptions.find(s => s.value === status)?.step || 0
  }

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export CSV synthèse (une ligne par commande)
  const handleExportCSV = () => {
    const rows = filteredOrders.length > 0 ? filteredOrders : orders
    downloadCSV(
      [
        ['Numéro', 'Date', 'Client', 'Email', 'Adresse', 'Ville', 'CP', 'Statut', 'Livraison', 'Sous-total', 'Frais livraison', 'Code promo', 'Remise', 'Total', 'Transporteur', 'Numéro de suivi'],
        ...rows.map(o => [
          o.order_number,
          new Date(o.created_at).toLocaleDateString('fr-FR'),
          `${o.shipping_address?.firstName || ''} ${o.shipping_address?.lastName || ''}`.trim(),
          o.shipping_address?.email || '',
          o.shipping_address?.address || '',
          o.shipping_address?.city || '',
          o.shipping_address?.postalCode || '',
          o.status,
          o.shipping_method || '',
          (o.subtotal || 0).toFixed(2),
          (o.shipping || 0).toFixed(2),
          o.promo_code || '',
          (o.discount || 0).toFixed(2),
          (o.total || 0).toFixed(2),
          o.carrier || '',
          o.tracking_number || '',
        ]),
      ],
      `commandes-${new Date().toISOString().slice(0, 10)}.csv`
    )
  }

  // Export CSV détaillé (une ligne par article)
  const handleExportCSVItems = () => {
    const rows = filteredOrders.length > 0 ? filteredOrders : orders
    const itemRows: string[][] = [
      ['Numéro commande', 'Date', 'Client', 'Email', 'Statut', 'Produit', 'Taille', 'Qté', 'Prix unitaire', 'Total commande'],
    ]
    for (const o of rows) {
      const items: any[] = Array.isArray(o.items) ? o.items : []
      if (items.length === 0) {
        itemRows.push([
          o.order_number,
          new Date(o.created_at).toLocaleDateString('fr-FR'),
          `${o.shipping_address?.firstName || ''} ${o.shipping_address?.lastName || ''}`.trim(),
          o.shipping_address?.email || '',
          o.status,
          '', '', '', '',
          (o.total || 0).toFixed(2),
        ])
      } else {
        for (const item of items) {
          itemRows.push([
            o.order_number,
            new Date(o.created_at).toLocaleDateString('fr-FR'),
            `${o.shipping_address?.firstName || ''} ${o.shipping_address?.lastName || ''}`.trim(),
            o.shipping_address?.email || '',
            o.status,
            item.product_name || item.name || '',
            item.size || item.selectedSize || '',
            String(item.quantity || 1),
            (item.price || 0).toFixed(2),
            (o.total || 0).toFixed(2),
          ])
        }
      }
    }
    downloadCSV(itemRows, `commandes-articles-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // Filtrer selon l'onglet actif
  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders

  const filteredOrders = currentOrders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${order.shipping_address?.firstName} ${order.shipping_address?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stats pour les commandes actives uniquement
  const activeStatusOptions = statusOptions.filter(s => !['completed', 'cancelled'].includes(s.value))

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
          <h1 className="text-2xl font-semibold">Commandes</h1>
          <p className="text-admin-muted">
            {activeOrders.length} à traiter · {completedOrders.length} terminées
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setExportDropdown(v => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {exportDropdown && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-admin-surface border border-admin-border rounded-lg shadow-lg z-20 overflow-hidden">
              <button
                onClick={() => { handleExportCSV(); setExportDropdown(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-admin-surface-alt transition-colors"
              >
                <p className="font-medium">Synthèse commandes</p>
                <p className="text-xs text-admin-muted mt-0.5">1 ligne par commande</p>
              </button>
              <button
                onClick={() => { handleExportCSVItems(); setExportDropdown(false) }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-admin-surface-alt transition-colors border-t border-admin-border"
              >
                <p className="font-medium">Détail articles</p>
                <p className="text-xs text-admin-muted mt-0.5">1 ligne par article commandé</p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-admin-surface rounded-xl shadow-sm">
        <div className="flex border-b border-admin-border">
          <button
            onClick={() => { setActiveTab('active'); setStatusFilter('') }}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'active'
                ? 'text-[#C9A962]'
                : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>À traiter</span>
            {activeOrders.length > 0 && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'active'
                  ? 'bg-[#C9A962] text-white'
                  : 'bg-admin-surface-alt text-admin-muted'
              }`}>
                {activeOrders.length}
              </span>
            )}
            {activeTab === 'active' && (
              <m.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]"
              />
            )}
          </button>
          <button
            onClick={() => { setActiveTab('completed'); setStatusFilter('') }}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'completed'
                ? 'text-[#C9A962]'
                : 'text-admin-muted hover:text-admin-text'
            }`}
          >
            <Archive className="w-5 h-5" />
            <span>Terminées</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs ${
              activeTab === 'completed'
                ? 'bg-[#C9A962] text-white'
                : 'bg-admin-surface-alt text-admin-muted'
            }`}>
              {completedOrders.length}
            </span>
            {activeTab === 'completed' && (
              <m.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]"
              />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-light" />
            <input
              type="text"
              placeholder="Rechercher par n° commande, client, email ou n° suivi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>
        </div>
      </div>

      {/* Stats cards - Seulement pour l'onglet "À traiter" */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-3 gap-4">
          {activeStatusOptions.map((status) => {
            const count = activeOrders.filter(o => o.status === status.value).length
            return (
              <button
                key={status.value}
                onClick={() => setStatusFilter(statusFilter === status.value ? '' : status.value)}
                className={`p-4 bg-admin-surface rounded-xl shadow-sm hover:shadow-md transition-all ${
                  statusFilter === status.value ? 'ring-2 ring-[#C9A962]' : ''
                }`}
              >
                <div className={`inline-flex p-2 rounded-lg ${status.color} mb-2`}>
                  <status.icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-semibold">{count}</p>
                <p className="text-sm text-admin-muted">{status.label}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Stats pour terminées */}
      {activeTab === 'completed' && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}
            className={`p-4 bg-admin-surface rounded-xl shadow-sm hover:shadow-md transition-all ${
              statusFilter === 'completed' ? 'ring-2 ring-[#C9A962]' : ''
            }`}
          >
            <div className="inline-flex p-2 rounded-lg bg-green-100 text-green-800 mb-2">
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold">
              {completedOrders.filter(o => o.status === 'completed').length}
            </p>
            <p className="text-sm text-admin-muted">Livrées</p>
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'cancelled' ? '' : 'cancelled')}
            className={`p-4 bg-admin-surface rounded-xl shadow-sm hover:shadow-md transition-all ${
              statusFilter === 'cancelled' ? 'ring-2 ring-[#C9A962]' : ''
            }`}
          >
            <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-800 mb-2">
              <XCircle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold">
              {completedOrders.filter(o => o.status === 'cancelled').length}
            </p>
            <p className="text-sm text-admin-muted">Annulées</p>
          </button>
        </div>
      )}

      {/* Alerte commandes urgentes */}
      {activeTab === 'active' && activeOrders.filter(o => o.status === 'pending').length > 0 && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">
              {activeOrders.filter(o => o.status === 'pending').length} commande(s) en attente
            </p>
            <p className="text-sm text-yellow-700">
              Ces commandes nécessitent votre attention
            </p>
          </div>
        </m.div>
      )}

      {/* Orders list */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-admin-surface rounded-xl shadow-sm overflow-hidden"
      >
        {filteredOrders.length > 0 ? (
          <div className="divide-y divide-admin-border">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-admin-surface-alt transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Statut icon */}
                    <div className={`p-3 rounded-xl ${statusConfig.color}`}>
                      <statusConfig.icon className="w-6 h-6" />
                    </div>

                    {/* Infos principales */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-lg">#{order.order_number}</span>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (updatingStatus !== order.id) {
                                setStatusDropdown(statusDropdown === order.id ? null : order.id)
                              }
                            }}
                            disabled={updatingStatus === order.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${statusConfig.color} ${updatingStatus === order.id ? 'opacity-70' : ''}`}
                          >
                            {updatingStatus === order.id ? (
                              <>
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                Mise à jour...
                              </>
                            ) : (
                              <>
                                {statusConfig.label}
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>

                          {statusDropdown === order.id && (
                            <div
                              className="absolute bottom-full left-0 mb-1 w-48 bg-admin-surface rounded-lg shadow-lg border border-admin-border z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {statusOptions.map((status) => (
                                <button
                                  key={status.value}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateOrderStatus(order.id, status.value)
                                  }}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-admin-surface-alt first:rounded-t-lg last:rounded-b-lg ${
                                    order.status === status.value ? 'bg-admin-surface-alt font-medium' : ''
                                  }`}
                                >
                                  <status.icon className="w-4 h-4" />
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-admin-muted">
                        <span className="font-medium">
                          {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                        </span>
                        <span>·</span>
                        <span>{order.shipping_address?.email}</span>
                        <span>·</span>
                        <span>{order.shipping_address?.city}</span>
                      </div>

                      {/* Articles */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-admin-surface-alt rounded text-xs">
                            {item.product?.name} ({item.size}) ×{item.quantity}
                          </span>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="px-2 py-1 bg-admin-surface-alt rounded text-xs text-admin-muted">
                            +{order.items.length - 3} autres
                          </span>
                        )}
                      </div>

                      {/* Suivi */}
                      {order.tracking_number && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-admin-light" />
                          <span className="font-mono text-admin-muted">{order.tracking_number}</span>
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#C9A962] hover:underline"
                            >
                              Suivre
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Prix et actions */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-semibold">{order.total?.toLocaleString('fr-FR')} €</p>
                      {order.promo_code && (
                        <p className="text-xs text-green-600 font-medium">
                          Code: {order.promo_code} (-{order.discount} €)
                        </p>
                      )}
                      <p className="text-sm text-admin-muted">
                        {new Date(order.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="mt-2 px-4 py-2 text-sm bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
                      >
                        Gérer
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            {activeTab === 'active' ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-admin-muted font-medium">Aucune commande à traiter</p>
                <p className="text-sm text-admin-light">Toutes les commandes ont été traitées</p>
              </>
            ) : (
              <>
                <Archive className="w-12 h-12 text-admin-light mx-auto mb-4" />
                <p className="text-admin-muted">Aucune commande terminée</p>
              </>
            )}
          </div>
        )}
      </m.div>

      {/* Order detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-admin-surface rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="p-6 border-b border-admin-border sticky top-0 bg-admin-surface z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Commande #{selectedOrder.order_number}</h2>
                    <p className="text-sm text-admin-muted">
                      {new Date(selectedOrder.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-admin-surface-alt rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Timeline de statut */}
                <div>
                  <h3 className="text-sm font-medium text-admin-muted uppercase tracking-wider mb-4">
                    Suivi de la commande
                  </h3>
                  <div className="relative">
                    <div className="flex justify-between">
                      {statusOptions.filter(s => s.step > 0).map((status) => {
                        const currentStep = getStatusStep(editForm.status)
                        const isActive = status.step <= currentStep
                        const isCurrent = status.step === currentStep

                        return (
                          <div key={status.value} className="flex flex-col items-center relative z-10">
                            <button
                              onClick={() => setEditForm({ ...editForm, status: status.value })}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isCurrent
                                  ? 'bg-[#C9A962] text-white ring-4 ring-[#C9A962]/20'
                                  : isActive
                                  ? 'bg-[#C9A962] text-white'
                                  : 'bg-admin-surface-alt text-admin-muted'
                              }`}
                            >
                              <status.icon className="w-5 h-5" />
                            </button>
                            <span className={`mt-2 text-xs font-medium ${
                              isActive ? 'text-[#C9A962]' : 'text-admin-muted'
                            }`}>
                              {status.label}
                            </span>
                            {status.value === 'shipped' && selectedOrder.shipped_at && (
                              <span className="text-xs text-admin-light">
                                {new Date(selectedOrder.shipped_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                            {status.value === 'completed' && selectedOrder.delivered_at && (
                              <span className="text-xs text-admin-light">
                                {new Date(selectedOrder.delivered_at).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-admin-surface-alt -z-0">
                      <div
                        className="h-full bg-[#C9A962] transition-all"
                        style={{
                          width: `${((getStatusStep(editForm.status) - 1) / 3) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {editForm.status !== 'cancelled' && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setEditForm({ ...editForm, status: 'cancelled' })}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Annuler la commande
                      </button>
                    </div>
                  )}
                  {editForm.status === 'cancelled' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                      <p className="text-red-700 font-medium">Commande annulée</p>
                      <button
                        onClick={() => setEditForm({ ...editForm, status: 'pending' })}
                        className="text-sm text-red-600 hover:underline mt-1"
                      >
                        Réactiver la commande
                      </button>
                    </div>
                  )}
                </div>

                {/* Informations de suivi */}
                <div className="bg-admin-surface-alt rounded-xl p-4">
                  <h3 className="text-sm font-medium text-admin-muted uppercase tracking-wider mb-4">
                    Informations de livraison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-admin-text mb-1">
                        Transporteur
                      </label>
                      <select
                        value={editForm.carrier}
                        onChange={(e) => handleCarrierChange(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
                      >
                        <option value="">Sélectionner...</option>
                        {carrierOptions.map((carrier) => (
                          <option key={carrier.value} value={carrier.value}>
                            {carrier.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-admin-text mb-1">
                        Numéro de suivi
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editForm.tracking_number}
                          onChange={(e) => handleTrackingNumberChange(e.target.value)}
                          className="w-full px-3 py-2 pr-10 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                          placeholder="Ex: 1Z999AA10123456784"
                        />
                        {editForm.tracking_number && (
                          <button
                            onClick={() => copyToClipboard(editForm.tracking_number)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-admin-light hover:text-[#C9A962]"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-admin-text mb-1">
                        Lien de suivi
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={editForm.tracking_url}
                          onChange={(e) => setEditForm({ ...editForm, tracking_url: e.target.value })}
                          className="flex-1 px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
                          placeholder="https://..."
                        />
                        {editForm.tracking_url && (
                          <a
                            href={editForm.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#b8944d] transition-colors flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Tester
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-admin-muted uppercase tracking-wider mb-3">
                      Client
                    </h3>
                    <div className="bg-admin-surface-alt rounded-lg p-4">
                      <p className="font-medium">
                        {selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}
                      </p>
                      <p className="text-admin-muted">{selectedOrder.shipping_address?.email}</p>
                      <p className="text-admin-muted">{selectedOrder.shipping_address?.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-admin-muted uppercase tracking-wider mb-3">
                      Adresse de livraison
                    </h3>
                    <div className="bg-admin-surface-alt rounded-lg p-4">
                      <p>{selectedOrder.shipping_address?.address}</p>
                      <p>{selectedOrder.shipping_address?.postalCode} {selectedOrder.shipping_address?.city}</p>
                      <p>{selectedOrder.shipping_address?.country}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-medium text-admin-muted uppercase tracking-wider mb-3">
                    Articles commandés
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-admin-surface-alt rounded-lg">
                        <div className="w-16 h-16 bg-admin-surface-alt rounded relative overflow-hidden">
                          {item.product?.images?.[0] && (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product?.name || ''}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-admin-muted">{item.size} × {item.quantity}</p>
                        </div>
                        <p className="font-medium">{(item.product?.price || 0) * item.quantity} €</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes admin */}
                <div>
                  <label className="block text-sm font-medium text-admin-muted uppercase tracking-wider mb-2">
                    Notes internes
                  </label>
                  <textarea
                    value={editForm.admin_notes}
                    onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                    className="w-full px-3 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962] resize-none"
                    rows={3}
                    placeholder="Notes visibles uniquement par les administrateurs..."
                  />
                </div>

                {/* Totals */}
                <div className="border-t border-admin-border pt-4">
                  <div className="flex justify-between py-2">
                    <span className="text-admin-muted">Sous-total</span>
                    <span>{selectedOrder.subtotal?.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-admin-muted">
                      {selectedOrder.shipping_method
                        ? (selectedOrder.shipping_method === 'standard'
                            ? 'Livraison (Standard)'
                            : selectedOrder.shipping_method === 'express'
                              ? 'Livraison (Express)'
                              : selectedOrder.shipping_method)
                        : 'Livraison'}
                    </span>
                    <span>{selectedOrder.shipping === 0 ? 'Gratuit' : `${selectedOrder.shipping} €`}</span>
                  </div>
                  {selectedOrder.promo_code && (
                    <div className="flex justify-between py-2 text-green-600">
                      <span className="flex items-center gap-2">
                        Code promo
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-mono">
                          {selectedOrder.promo_code}
                        </span>
                      </span>
                      <span>-{selectedOrder.discount?.toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-semibold">
                    <span>Total</span>
                    <span>{selectedOrder.total?.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-admin-border bg-admin-surface-alt sticky bottom-0">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface transition-colors text-sm"
                  >
                    Fermer
                  </button>
                  <a
                    href={`/admin/commandes/${selectedOrder.id}/bon-livraison`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Bon de livraison
                  </a>
                  <button
                    onClick={saveOrderDetails}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
