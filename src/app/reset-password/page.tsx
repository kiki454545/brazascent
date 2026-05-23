'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      }
      setIsChecking(false)
    })

    // Fallback si l'événement ne se déclenche pas dans les 3s
    const timeout = setTimeout(() => setIsChecking(false), 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    setIsLoading(false)

    if (error) {
      setError('Erreur lors de la mise à jour. Le lien a peut-être expiré.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/compte'), 2000)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background flex items-start justify-center">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="bg-cream p-8 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">Vérification du lien...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-cream p-8 shadow-sm text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.
            </p>
            <Link
              href="/mot-de-passe-oublie"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Réinitialiser mon mot de passe
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-md mx-auto px-6">
        <div className="bg-cream p-8 lg:p-12 shadow-sm">
          <h1 className="text-2xl font-light tracking-[0.15em] uppercase mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          {success ? (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm text-center">
              Mot de passe mis à jour ! Redirection en cours...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimum 6 caractères"
                    className="w-full pl-12 pr-12 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Répéter le mot de passe"
                    className="w-full pl-12 pr-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Enregistrement...' : (
                  <>
                    Enregistrer le mot de passe
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
