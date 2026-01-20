'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Search, Filter, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  user_email: string
  user_name: string
  created_at: string
  updated_at: string
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'text-gray-500' },
  normal: { label: 'Normale', color: 'text-blue-500' },
  high: { label: 'Haute', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
}

const categoryLabels: Record<string, string> = {
  general: 'Général',
  order: 'Commande',
  product: 'Produit',
  delivery: 'Livraison',
  refund: 'Remboursement',
  other: 'Autre',
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets Support</h1>
          <p className="text-gray-500">Gérez les demandes des clients</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.total}</p>
              <p className="text-sm text-gray-500">Total tickets</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.open}</p>
              <p className="text-sm text-gray-500">Ouverts</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ticketStats.resolved}</p>
              <p className="text-sm text-gray-500">Résolus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par sujet, email, nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="open">Ouverts</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolus</option>
              <option value="closed">Fermés</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] bg-white"
            >
              <option value="all">Toutes catégories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun ticket trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => {
                  const status = statusLabels[ticket.status] || statusLabels.open
                  const priority = priorityLabels[ticket.priority] || priorityLabels.normal
                  const StatusIcon = status.icon
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                          <p className="text-sm text-gray-500 truncate">#{ticket.id.slice(0, 8)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{ticket.user_name || 'Anonyme'}</p>
                          <p className="text-sm text-gray-500">{ticket.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {categoryLabels[ticket.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">{formatDate(ticket.updated_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="inline-flex items-center gap-1 text-[#C9A962] hover:text-[#19110B] transition-colors"
                        >
                          Voir
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
