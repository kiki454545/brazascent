'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { CartItem } from '@/types'

export default function CartRecoverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const { clearCart, addItem } = useCartStore()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function recover() {
      try {
        const res = await fetch(`/api/cart/recover/${token}`)
        const data = await res.json()

        if (!res.ok) {
          setMessage(data.error || 'Lien invalide ou expiré')
          setStatus('error')
          return
        }

        const items: CartItem[] = data.items || []
        if (items.length === 0) {
          setMessage('Panier vide')
          setStatus('error')
          return
        }

        clearCart()
        for (const item of items) {
          addItem(item.product, item.selectedSize, item.quantity)
        }

        router.replace('/panier')
      } catch {
        setMessage('Une erreur est survenue')
        setStatus('error')
      }
    }

    recover()
  }, [token, clearCart, addItem, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        {status === 'loading' ? (
          <>
            <div className="w-10 h-10 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Restauration de votre panier…</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">Lien expiré</p>
            <p className="text-muted-foreground mb-6">{message}</p>
            <a
              href="/parfums"
              className="inline-block px-6 py-3 bg-[#C9A962] text-white rounded-lg hover:bg-[#b8944d] transition-colors text-sm font-medium"
            >
              Découvrir nos parfums
            </a>
          </>
        )}
      </div>
    </div>
  )
}
