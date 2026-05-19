'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { AccountSidebar } from '@/components/AccountSidebar'
import { useAuthStore } from '@/store/auth'

type Tab = 'login' | 'register'

export default function ComptePage() {
  const router = useRouter()
  const { user, profile, isLoading, isInitialized, initialize, signIn, signUp, signOut, updateProfile } = useAuthStore()

  const [activeTab, setActiveTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')

  // Edit mode for profile
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch(() => {
        // Ignorer les erreurs d'initialisation (AbortError, etc.)
      })
    }
  }, [isInitialized, initialize])

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setPhone(profile.phone || '')
    }
  }, [profile])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    const result = await signUp(email, password, firstName, lastName)
    if (result.error) {
      setError(result.error)
    }
    // L'utilisateur est automatiquement connecté après l'inscription via le store
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const result = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Profil mis à jour avec succès')
      setIsEditing(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  // Si l'utilisateur est connecté, afficher le dashboard
  if (user && profile) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-light tracking-[0.15em] uppercase mb-2">
                Mon Compte
              </h1>
              <p className="text-muted-foreground">
                Bienvenue, {profile.first_name || profile.email}
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <AccountSidebar />
              </div>

              {/* Main content */}
              <div className="lg:col-span-3">
                <div className="bg-cream p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl tracking-[0.1em] uppercase">Informations personnelles</h2>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Modifier
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Prénom</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-2">Nom</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-4 py-3 border border-border bg-muted text-muted-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">Téléphone</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+33 6 00 00 00 00"
                          className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 border border-border text-sm tracking-[0.15em] uppercase hover:bg-muted transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 py-3 border-b">
                        <User className="w-5 h-5 text-muted-foreground/60" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nom complet</p>
                          <p>{profile.first_name} {profile.last_name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 py-3 border-b">
                        <Mail className="w-5 h-5 text-muted-foreground/60" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p>{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 py-3">
                        <span className="w-5 h-5 text-muted-foreground/60 text-center">📞</span>
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p>{profile.phone || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Formulaire de connexion/inscription
  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-md mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cream p-8 lg:p-12 shadow-sm"
        >
          {/* Tabs */}
          <div className="flex mb-8 border-b">
            <button
              onClick={() => {
                setActiveTab('login')
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 pb-4 text-sm tracking-[0.15em] uppercase transition-colors ${
                activeTab === 'login'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground/60 hover:text-muted-foreground'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setActiveTab('register')
                setError(null)
                setSuccess(null)
              }}
              className={`flex-1 pb-4 text-sm tracking-[0.15em] uppercase transition-colors ${
                activeTab === 'register'
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-muted-foreground/60 hover:text-muted-foreground'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
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

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#C9A962]" />
                  <span className="text-muted-foreground">Se souvenir de moi</span>
                </label>
                <Link href="/mot-de-passe-oublie" className="text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Connexion...' : (
                  <>
                    Se connecter
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className="w-full px-4 py-3 border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email *</label>
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

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Mot de passe *</label>
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

              <div className="text-sm">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" required className="w-4 h-4 mt-0.5 accent-[#C9A962]" />
                  <span className="text-muted-foreground">
                    J&apos;accepte les{' '}
                    <Link href="/cgv" className="text-primary hover:underline">
                      conditions générales de vente
                    </Link>{' '}
                    et la{' '}
                    <Link href="/confidentialite" className="text-primary hover:underline">
                      politique de confidentialité
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Création...' : (
                  <>
                    Créer mon compte
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
