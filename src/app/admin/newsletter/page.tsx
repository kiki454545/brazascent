'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Users,
  Send,
  Trash2,
  Download,
  Search,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
  source: string
}

interface SentEmail {
  id: string
  subject: string
  content: string
  sent_at: string
  recipients_count: number
  status: string
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'subscribers' | 'compose' | 'history'>('subscribers')
  const [searchQuery, setSearchQuery] = useState('')

  // Compose form state
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [sendMessage, setSendMessage] = useState('')

  // Preview modal
  const [previewEmail, setPreviewEmail] = useState<SentEmail | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subscribersRes, emailsRes] = await Promise.all([
        supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('subscribed_at', { ascending: false }),
        supabase
          .from('newsletter_emails')
          .select('*')
          .order('sent_at', { ascending: false })
          .limit(50)
      ])

      if (subscribersRes.data) setSubscribers(subscribersRes.data)
      if (emailsRes.data) setSentEmails(emailsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) return

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id)

      if (!error) {
        setSubscribers(subscribers.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          is_active: !currentStatus,
          unsubscribed_at: !currentStatus ? null : new Date().toISOString()
        })
        .eq('id', id)

      if (!error) {
        setSubscribers(subscribers.map(s =>
          s.id === id ? { ...s, is_active: !currentStatus } : s
        ))
      }
    } catch (error) {
      console.error('Error updating subscriber:', error)
    }
  }

  const handleSendNewsletter = async () => {
    if (!subject.trim() || !content.trim()) {
      setSendStatus('error')
      setSendMessage('Veuillez remplir le sujet et le contenu')
      return
    }

    const activeSubscribers = subscribers.filter(s => s.is_active)
    if (activeSubscribers.length === 0) {
      setSendStatus('error')
      setSendMessage('Aucun abonné actif')
      return
    }

    if (!confirm(`Envoyer cet email à ${activeSubscribers.length} abonnés ?`)) return

    setSending(true)
    setSendStatus('idle')

    try {
      // Appeler l'API pour envoyer les emails
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          content,
          recipients: activeSubscribers.map(s => s.email)
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Sauvegarder l'email dans l'historique
        const { data: emailRecord } = await supabase
          .from('newsletter_emails')
          .insert({
            subject,
            content,
            recipients_count: activeSubscribers.length,
            status: 'sent'
          })
          .select()
          .single()

        if (emailRecord) {
          setSentEmails([emailRecord, ...sentEmails])
        }

        setSendStatus('success')
        setSendMessage(`Email envoyé avec succès à ${activeSubscribers.length} abonnés !`)
        setSubject('')
        setContent('')
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending newsletter:', error)
      setSendStatus('error')
      setSendMessage('Erreur lors de l\'envoi. Veuillez réessayer.')
    } finally {
      setSending(false)
    }
  }

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter(s => s.is_active)
    const csv = 'Email,Date d\'inscription,Source\n' +
      activeSubscribers.map(s =>
        `${s.email},${new Date(s.subscribed_at).toLocaleDateString('fr-FR')},${s.source}`
      ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = subscribers.filter(s => s.is_active).length

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
          <h1 className="text-2xl font-semibold">Newsletter</h1>
          <p className="text-gray-500">
            {activeCount} abonnés actifs · {sentEmails.length} emails envoyés
          </p>
        </div>
        <button
          onClick={exportSubscribers}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          Exporter CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscribers.length}</p>
              <p className="text-sm text-gray-500">Total abonnés</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-gray-500">Abonnés actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentEmails.length}</p>
              <p className="text-sm text-gray-500">Emails envoyés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'subscribers'
                ? 'text-[#C9A962]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5" />
            Abonnés
            {activeTab === 'subscribers' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'compose'
                ? 'text-[#C9A962]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Send className="w-5 h-5" />
            Envoyer un email
            {activeTab === 'compose' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-[#C9A962]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-5 h-5" />
            Historique
            {activeTab === 'history' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A962]"
              />
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#C9A962]/20 focus:border-[#C9A962] outline-none"
                />
              </div>

              {/* Subscribers List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Source</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Statut</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">{subscriber.email}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(subscriber.subscribed_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                            {subscriber.source}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(subscriber.id, subscriber.is_active)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              subscriber.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {subscriber.is_active ? 'Actif' : 'Désabonné'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(subscriber.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredSubscribers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Aucun abonné trouvé
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compose Tab */}
          {activeTab === 'compose' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Cet email sera envoyé à {activeCount} abonnés actifs</p>
                  <p className="mt-1">Assurez-vous que le contenu est correct avant d'envoyer.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet de l'email
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Découvrez notre nouvelle collection..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A962]/20 focus:border-[#C9A962] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de l'email
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écrivez votre message ici...

Vous pouvez utiliser du HTML basique pour la mise en forme."
                  rows={12}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9A962]/20 focus:border-[#C9A962] outline-none resize-none font-mono text-sm"
                />
              </div>

              {sendMessage && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  sendStatus === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {sendStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {sendMessage}
                </div>
              )}

              <button
                onClick={handleSendNewsletter}
                disabled={sending || !subject.trim() || !content.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A962] text-white rounded-lg hover:bg-[#B8994D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {sending ? 'Envoi en cours...' : 'Envoyer la newsletter'}
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {sentEmails.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucun email envoyé pour le moment
                </div>
              ) : (
                <div className="space-y-3">
                  {sentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{email.subject}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{new Date(email.sent_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          <span>·</span>
                          <span>{email.recipients_count} destinataires</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPreviewEmail(email)}
                        className="p-2 text-gray-500 hover:bg-white rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setPreviewEmail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Aperçu de l'email</h3>
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-500">Sujet</p>
                  <p className="font-medium">{previewEmail.subject}</p>
                </div>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewEmail.content }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
