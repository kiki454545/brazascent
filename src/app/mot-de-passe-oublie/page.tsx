'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsLoading(false)

    if (error) {
      setError('Une erreur est survenue. Vérifiez votre adresse email.')
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-md mx-auto px-6">
        <Link
          href="/compte"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>

        <div className="bg-cream p-8 lg:p-12 shadow-sm">
          <h1 className="text-2xl font-light tracking-[0.15em] uppercase mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {success ? (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm">
                Un email a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
              </div>
              <Link href="/compte" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="votre@email.com"
                    className="w-full pl-12 pr-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Envoi en cours...' : (
                  <>
                    Envoyer le lien
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
