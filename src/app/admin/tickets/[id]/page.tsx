'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Loader2, Clock, CheckCircle, AlertCircle, User, Shield, Mail, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Ticket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  user_id: string | null
  user_email: string
  user_name: string
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_type: 'user' | 'admin'
  sender_name: string
  message: string
  created_at: string
}

const statusOptions = [
  { value: 'open', label: 'Ouvert', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'resolved', label: 'Résolu', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Fermé', color: 'bg-gray-100 text-gray-700' },
]

const priorityOptions = [
  { value: 'low', label: 'Basse', color: 'text-gray-500' },
  { value: 'normal', label: 'Normale', color: 'text-blue-500' },
  { value: 'high', label: 'Haute', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-500' },
]

const categoryLabels: Record<string, string> = {
  general: 'Question générale',
  order: 'Commande',
  product: 'Produit',
  delivery: 'Livraison',
  refund: 'Remboursement',
  other: 'Autre',
}

export default function AdminTicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [admin, setAdmin] = useState<any>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setAdmin(user)
        fetchTicketData()
      }
    }
    checkAdmin()
  }, [ticketId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicketData = async () => {
    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

      if (ticketError) throw ticketError
      setTicket(ticketData)

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTicket = async (field: 'status' | 'priority', value: string) => {
    if (!ticket) return
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ [field]: value })
        .eq('id', ticketId)

      if (error) throw error
      setTicket({ ...ticket, [field]: value })
    } catch (error) {
      console.error('Error updating ticket:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !ticket) return

    setSending(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', admin.id)
        .single()

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: admin.id,
          sender_type: 'admin',
          sender_name: profile?.full_name || 'Support BrazaScent',
          message: newMessage.trim(),
        })

      if (error) throw error

      // Si le ticket est ouvert, le passer en cours
      if (ticket.status === 'open') {
        await handleUpdateTicket('status', 'in_progress')
      }

      setNewMessage('')
      fetchTicketData()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
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

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return formatDate(dateString)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Ticket non trouvé</p>
        <Link href="/admin/tickets" className="text-[#C9A962] hover:underline mt-4 inline-block">
          Retour aux tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux tickets
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="text-gray-500">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender_type === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] ${
                      message.sender_type === 'admin'
                        ? 'bg-[#C9A962] text-white'
                        : 'bg-gray-100'
                    } p-4 rounded-lg`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-medium text-sm ${message.sender_type === 'admin' ? 'text-white' : 'text-gray-900'}`}>
                        {message.sender_type === 'admin' ? 'Vous' : message.sender_name}
                      </span>
                    </div>
                    <p className={`text-sm whitespace-pre-wrap ${message.sender_type === 'admin' ? 'text-white/90' : 'text-gray-700'}`}>
                      {message.message}
                    </p>
                    <p className={`text-xs mt-2 ${message.sender_type === 'admin' ? 'text-white/60' : 'text-gray-400'}`}>
                      {formatMessageDate(message.created_at)}
                    </p>
                  </div>
                  {message.sender_type === 'admin' && (
                    <div className="w-10 h-10 rounded-full bg-[#C9A962] flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendMessage} className="bg-white rounded-xl shadow-sm border p-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={4}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#C9A962] resize-none mb-4"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-[#C9A962] text-white rounded-lg hover:bg-[#19110B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Informations client</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{ticket.user_name || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${ticket.user_email}`} className="text-sm text-[#C9A962] hover:underline">
                  {ticket.user_email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{formatDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Détails du ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Catégorie</label>
                <p className="text-gray-900">{categoryLabels[ticket.category]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Statut</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleUpdateTicket('status', e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] bg-white disabled:opacity-50"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Priorité</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handleUpdateTicket('priority', e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] bg-white disabled:opacity-50"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-medium text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleUpdateTicket('status', 'resolved')}
                disabled={updating || ticket.status === 'resolved'}
                className="w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Marquer comme résolu
              </button>
              <button
                onClick={() => handleUpdateTicket('status', 'closed')}
                disabled={updating || ticket.status === 'closed'}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Fermer le ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
