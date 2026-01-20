'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  created_at: string
  updated_at: string
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
}

const categoryLabels: Record<string, string> = {
  general: 'Question générale',
  order: 'Commande',
  product: 'Produit',
  delivery: 'Livraison',
  refund: 'Remboursement',
  other: 'Autre',
}

export default function TicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion?redirect=/compte/tickets')
        return
      }
      setUser(user)
      fetchTickets(user.id)
    }
    checkAuth()
  }, [router])

  const fetchTickets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-2">
              Mes Tickets
            </h1>
            <p className="text-gray-600">
              Suivez vos demandes et échangez avec notre équipe
            </p>
          </div>
          <Link
            href="/contact"
            className="flex items-center gap-2 px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau ticket
          </Link>
        </motion.div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-[#F9F6F1]"
          >
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">Aucun ticket</h2>
            <p className="text-gray-500 mb-6">
              Vous n'avez pas encore créé de ticket de support
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un ticket
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {tickets.map((ticket, index) => {
              const status = statusLabels[ticket.status] || statusLabels.open
              const StatusIcon = status.icon
              return (
                <Link
                  key={ticket.id}
                  href={`/compte/tickets/${ticket.id}`}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 p-6 hover:border-[#C9A962] hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {categoryLabels[ticket.category]}
                          </span>
                        </div>
                        <h3 className="font-medium text-lg mb-1 truncate group-hover:text-[#C9A962] transition-colors">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Créé le {formatDate(ticket.created_at)}
                          {ticket.updated_at !== ticket.created_at && (
                            <span> • Mis à jour le {formatDate(ticket.updated_at)}</span>
                          )}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#C9A962] transition-colors flex-shrink-0" />
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </motion.div>
        )}

        {/* Back to account */}
        <div className="mt-8 pt-8 border-t">
          <Link
            href="/compte"
            className="text-gray-500 hover:text-[#C9A962] transition-colors"
          >
            ← Retour à mon compte
          </Link>
        </div>
      </div>
    </div>
  )
}
