'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, Package, ArrowRight, Mail } from 'lucide-react'
import { useCartStore } from '@/store/cart'

interface SessionData {
  customerEmail: string
  amountTotal: number
  paymentStatus: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { clearCart } = useCartStore()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vider le panier après un paiement réussi
    clearCart()
  }, [clearCart])

  useEffect(() => {
    if (sessionId) {
      // Récupérer les infos de la session Stripe
      fetch(`/api/checkout/session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.session) {
            setSessionData({
              customerEmail: data.session.customer_email,
              amountTotal: data.session.amount_total / 100,
              paymentStatus: data.session.payment_status,
            })
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [sessionId])

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F9F6F1]">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 shadow-sm text-center"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl md:text-3xl tracking-[0.1em] uppercase mb-4">
            Commande confirmée
          </h1>

          <p className="text-gray-600 mb-8">
            Merci pour votre achat ! Votre commande a été traitée avec succès.
          </p>

          {loading ? (
            <div className="flex justify-center mb-8">
              <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessionData ? (
            <div className="bg-[#F9F6F1] p-6 mb-8 text-left">
              <h2 className="text-sm tracking-[0.1em] uppercase text-gray-500 mb-4">
                Détails de la commande
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total payé</span>
                  <span className="font-medium">{sessionData.amountTotal.toLocaleString('fr-FR')} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut</span>
                  <span className="text-green-600 font-medium">Payé</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Email confirmation */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
            <Mail className="w-4 h-4" />
            <span>Un email de confirmation vous a été envoyé</span>
          </div>

          {/* Next steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 border border-gray-200 rounded-lg">
              <Package className="w-6 h-6 text-[#C9A962] mx-auto mb-2" />
              <p className="text-sm font-medium">Préparation</p>
              <p className="text-xs text-gray-500">Votre commande est en cours de préparation</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <Mail className="w-6 h-6 text-[#C9A962] mx-auto mb-2" />
              <p className="text-sm font-medium">Suivi</p>
              <p className="text-xs text-gray-500">Vous recevrez un email avec le numéro de suivi</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/compte"
              className="px-6 py-3 border border-gray-300 text-sm tracking-[0.15em] uppercase hover:bg-gray-50 transition-colors"
            >
              Mes commandes
            </Link>
            <Link
              href="/parfums"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
            >
              Continuer mes achats
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
