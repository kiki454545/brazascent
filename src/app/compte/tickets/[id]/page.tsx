'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Loader2, Clock, CheckCircle, AlertCircle, User, Shield } from 'lucide-react'
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

interface Message {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_type: 'user' | 'admin'
  sender_name: string
  message: string
  created_at: string
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

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion?redirect=/compte/tickets')
        return
      }
      setUser(user)
      fetchTicketData()
    }
    checkAuth()
  }, [router, ticketId])

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
      router.push('/compte/tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !ticket || ticket.status === 'closed') return

    setSending(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: 'user',
          sender_name: profile?.full_name || user.email,
          message: newMessage.trim(),
        })

      if (error) throw error

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
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A962]" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <p>Ticket non trouvé</p>
      </div>
    )
  }

  const status = statusLabels[ticket.status] || statusLabels.open
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/compte/tickets"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#C9A962] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux tickets
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-light tracking-wide mb-2">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
                <span>{categoryLabels[ticket.category]}</span>
                <span>•</span>
                <span>Créé le {formatDate(ticket.created_at)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#F9F6F1] p-6 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto"
        >
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender_type === 'admin' && (
                  <div className="w-10 h-10 rounded-full bg-[#C9A962] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] ${
                    message.sender_type === 'user'
                      ? 'bg-[#19110B] text-white'
                      : 'bg-white border border-gray-200'
                  } p-4 rounded-lg`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-medium text-sm ${message.sender_type === 'user' ? 'text-[#C9A962]' : 'text-[#C9A962]'}`}>
                      {message.sender_type === 'admin' ? 'Support BrazaScent' : message.sender_name}
                    </span>
                  </div>
                  <p className={`text-sm whitespace-pre-wrap ${message.sender_type === 'user' ? 'text-gray-100' : 'text-gray-700'}`}>
                    {message.message}
                  </p>
                  <p className={`text-xs mt-2 ${message.sender_type === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                    {formatMessageDate(message.created_at)}
                  </p>
                </div>
                {message.sender_type === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        {/* Reply Form */}
        {ticket.status !== 'closed' ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSendMessage}
            className="flex gap-4"
          >
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={3}
              className="flex-1 px-4 py-3 border border-gray-300 focus:border-[#C9A962] outline-none transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-3 bg-[#19110B] text-white hover:bg-[#C9A962] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </motion.form>
        ) : (
          <div className="text-center py-6 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Ce ticket est fermé et ne peut plus recevoir de messages.</p>
            <Link
              href="/contact"
              className="inline-block mt-4 text-[#C9A962] hover:text-[#19110B] transition-colors"
            >
              Ouvrir un nouveau ticket
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
