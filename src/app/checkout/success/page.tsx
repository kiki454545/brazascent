'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { m } from 'framer-motion'
import { CheckCircle, Package, ArrowRight, Mail } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/format'

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

  if (!loading && !sessionId) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <h1 className="text-2xl tracking-[0.1em] uppercase mb-4">Page introuvable</h1>
          <p className="text-muted-foreground mb-8">
            Aucune commande associée à cette page.
          </p>
          <Link href="/parfums" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors">
            Découvrir nos parfums
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-2xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream p-8 md:p-12 shadow-sm text-center"
        >
          {/* Success icon */}
          <m.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </m.div>

          <h1 className="text-2xl md:text-3xl tracking-[0.1em] uppercase mb-4">
            Commande confirmée
          </h1>

          <p className="text-muted-foreground mb-8">
            Merci pour votre achat ! Votre commande a été traitée avec succès.
          </p>

          {loading ? (
            <div className="flex justify-center mb-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessionData ? (
            <div className="bg-muted p-6 mb-8 text-left">
              <h2 className="text-sm tracking-[0.1em] uppercase text-muted-foreground mb-4">
                Détails de la commande
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total payé</span>
                  <span className="font-medium">{formatPrice(sessionData.amountTotal)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className="text-green-600 font-medium">Payé</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Email confirmation */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
            <Mail className="w-4 h-4" />
            <span>Un email de confirmation vous a été envoyé</span>
          </div>

          {/* Next steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 border border-border rounded-lg">
              <Package className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Préparation</p>
              <p className="text-xs text-muted-foreground">Votre commande est en cours de préparation</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Suivi</p>
              <p className="text-xs text-muted-foreground">Vous recevrez un email avec le numéro de suivi</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/compte"
              className="px-6 py-3 border border-border text-sm tracking-[0.15em] uppercase hover:bg-muted transition-colors"
            >
              Mes commandes
            </Link>
            <Link
              href="/parfums"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors"
            >
              Continuer mes achats
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </m.div>
      </div>
    </div>
  )
}
