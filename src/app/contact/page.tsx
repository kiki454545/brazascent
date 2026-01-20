'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, MessageSquare, Loader2, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settings'

const categories = [
  { value: 'general', label: 'Question générale' },
  { value: 'order', label: 'Commande' },
  { value: 'product', label: 'Produit' },
  { value: 'delivery', label: 'Livraison' },
  { value: 'refund', label: 'Remboursement' },
  { value: 'other', label: 'Autre' },
]

export default function ContactPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { settings } = useSettingsStore()

  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  })

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        // Récupérer les infos du profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        setForm(prev => ({
          ...prev,
          email: user.email || '',
          name: profile?.full_name || user.user_metadata?.full_name || '',
        }))
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!form.name || !form.email || !form.subject || !form.message) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }

      // Créer le ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user?.id || null,
          user_email: form.email,
          user_name: form.name,
          subject: form.subject,
          category: form.category,
          status: 'open',
          priority: 'normal',
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      // Ajouter le premier message
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user?.id || null,
          sender_type: 'user',
          sender_name: form.name,
          message: form.message,
        })

      if (messageError) throw messageError

      setSuccess(true)
      setForm(prev => ({
        ...prev,
        subject: '',
        message: '',
        category: 'general',
      }))
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
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
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-light tracking-[0.15em] uppercase mb-4">
            Contact
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une question ? Un problème avec votre commande ? Notre équipe est là pour vous aider.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-[#F9F6F1] p-8 h-full">
              <h2 className="text-xl tracking-[0.15em] uppercase mb-8">Informations</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#C9A962]/10 rounded-full">
                    <Mail className="w-5 h-5 text-[#C9A962]" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <a href={`mailto:${settings.storeEmail}`} className="text-gray-600 hover:text-[#C9A962] transition-colors">
                      {settings.storeEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#C9A962]/10 rounded-full">
                    <Phone className="w-5 h-5 text-[#C9A962]" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Téléphone</p>
                    <a href={`tel:${settings.storePhone}`} className="text-gray-600 hover:text-[#C9A962] transition-colors">
                      {settings.storePhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#C9A962]/10 rounded-full">
                    <MapPin className="w-5 h-5 text-[#C9A962]" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Adresse</p>
                    <p className="text-gray-600">{settings.storeAddress}</p>
                  </div>
                </div>
              </div>

              {/* Si connecté, lien vers mes tickets */}
              {user && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <Link
                    href="/compte/tickets"
                    className="flex items-center gap-3 text-[#C9A962] hover:text-[#19110B] transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Voir mes tickets</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            {success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium text-green-800 mb-2">
                  Message envoyé !
                </h3>
                <p className="text-green-600 mb-6">
                  Nous avons bien reçu votre demande et vous répondrons dans les plus brefs délais.
                </p>
                {user ? (
                  <Link
                    href="/compte/tickets"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Voir mes tickets
                  </Link>
                ) : (
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    Envoyer un autre message
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {!user && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">
                      <Link href="/connexion" className="font-medium underline">Connectez-vous</Link> pour suivre vos demandes et accéder à l'historique de vos tickets.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] outline-none transition-colors"
                      placeholder="Votre nom"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] outline-none transition-colors"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Catégorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] outline-none transition-colors bg-white"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] outline-none transition-colors"
                      placeholder="Sujet de votre demande"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] outline-none transition-colors resize-none"
                    placeholder="Décrivez votre demande en détail..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
