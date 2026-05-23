'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Gift, Copy, Check, Loader2, Share2, Users } from 'lucide-react'
import { AccountSidebar } from '@/components/AccountSidebar'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

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
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [loyaltyHistory, setLoyaltyHistory] = useState<{ reason: string; points: number; created_at: string }[]>([])
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemedCode, setRedeemedCode] = useState<{ code: string; discountEuros: number; newBalance: number } | null>(null)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralCopied, setReferralCopied] = useState(false)

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

  const fetchLoyalty = async () => {
    if (!user) return
    const [{ data: allData }, { data: historyData }] = await Promise.all([
      supabase.from('loyalty_points').select('points').eq('user_id', user.id),
      supabase.from('loyalty_points').select('points, reason, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])
    if (allData) setLoyaltyPoints(allData.reduce((sum, r) => sum + r.points, 0))
    if (historyData) setLoyaltyHistory(historyData)
  }

  const fetchReferralCode = async () => {
    if (!user) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/referral/code', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setReferralCode(json.code)
    }
  }

  useEffect(() => {
    fetchLoyalty()
    fetchReferralCode()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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

  const handleRedeemPoints = async () => {
    setRedeemLoading(true)
    setRedeemError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })
      const data = await res.json()
      if (!res.ok) {
        setRedeemError(data.error || 'Erreur lors de l\'échange')
      } else {
        setRedeemedCode(data)
        setLoyaltyPoints(data.newBalance)
        await fetchLoyalty()
      }
    } catch {
      setRedeemError('Erreur de connexion')
    } finally {
      setRedeemLoading(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // Si l'utilisateur est connecté, afficher le dashboard
  if (user && profile) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-background">
        <div className="px-6 sm:px-10 lg:px-20">
          <div>
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
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 text-sm">
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

                {/* Programme fidélité */}
                <div className="bg-cream p-8 shadow-sm mt-6">
                  <div className="flex items-center gap-3 mb-5">
                    <Gift className="w-5 h-5 text-primary" />
                    <h2 className="text-xl tracking-[0.1em] uppercase">Programme Fidélité</h2>
                  </div>

                  {/* Solde + conversion */}
                  <div className="flex items-center gap-6 p-5 border border-primary/20 bg-primary/5 mb-5">
                    <div className="text-center min-w-[80px]">
                      <p className="text-3xl font-light text-primary">{loyaltyPoints}</p>
                      <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">Points</p>
                    </div>
                    <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
                      <p>Vous gagnez <strong className="text-foreground">1 point par euro</strong> dépensé.</p>
                      <p className="mt-1"><strong className="text-foreground">100 points</strong> = code promo <strong className="text-foreground">5€</strong> de réduction.</p>
                    </div>
                  </div>

                  {/* Bouton échange */}
                  {loyaltyPoints >= 100 && !redeemedCode && (
                    <div className="mb-5">
                      <button
                        onClick={handleRedeemPoints}
                        disabled={redeemLoading}
                        className="w-full py-3 bg-foreground text-background text-sm tracking-[0.15em] uppercase hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {redeemLoading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours…</>
                        ) : (
                          <><Gift className="w-4 h-4" /> Échanger {Math.floor(loyaltyPoints / 100) * 100} pts contre {Math.floor(loyaltyPoints / 100) * 5}€</>
                        )}
                      </button>
                      {redeemError && <p className="text-xs text-red-500 mt-2">{redeemError}</p>}
                    </div>
                  )}

                  {/* Code généré */}
                  {redeemedCode && (
                    <div className="mb-5 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium mb-2">Votre code promo de {redeemedCode.discountEuros}€ :</p>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 font-mono text-lg font-bold text-green-800 dark:text-green-300 tracking-wider">{redeemedCode.code}</span>
                        <button
                          onClick={() => handleCopyCode(redeemedCode.code)}
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Copier"
                        >
                          {codeCopied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4 text-green-600 dark:text-green-400" />}
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Valable 90 jours — utilisable lors de votre prochain achat. Nouveau solde : {redeemedCode.newBalance} pts.</p>
                    </div>
                  )}

                  {/* Historique */}
                  {loyaltyHistory.length > 0 && (
                    <div>
                      <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-3">Historique récent</p>
                      <div className="space-y-2">
                        {loyaltyHistory.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                            <span className="text-muted-foreground">{entry.reason}</span>
                            <span className={`font-medium ${entry.points < 0 ? 'text-red-500' : 'text-primary'}`}>
                              {entry.points > 0 ? '+' : ''}{entry.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loyaltyPoints === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Passez votre première commande pour commencer à cumuler des points !
                    </p>
                  )}
                </div>

                {/* Parrainage */}
                {referralCode && (
                  <div className="bg-cream p-8 shadow-sm mt-6">
                    <div className="flex items-center gap-3 mb-5">
                      <Users className="w-5 h-5 text-primary" />
                      <h2 className="text-xl tracking-[0.1em] uppercase">Parrainez un ami</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                      Partagez votre code unique avec un ami. Il bénéficiera de <strong className="text-foreground">10% de réduction</strong> sur sa première commande, et vous recevrez <strong className="text-foreground">50 points</strong> de fidélité dès qu&apos;il aura validé sa commande.
                    </p>

                    {/* Code */}
                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 mb-4">
                      <span className="flex-1 font-mono text-xl font-bold tracking-[0.2em] text-primary">
                        {referralCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralCode)
                          setReferralCopied(true)
                          setTimeout(() => setReferralCopied(false), 2000)
                        }}
                        className="p-2 hover:bg-primary/10 rounded transition-colors"
                        title="Copier le code"
                      >
                        {referralCopied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
                      </button>
                    </div>

                    {/* Partager le lien */}
                    <button
                      onClick={() => {
                        const url = `https://brazascent.com/parfums?ref=${referralCode}`
                        if (navigator.share) {
                          navigator.share({ title: 'Braza Scent — 10% de réduction', text: `Utilise mon code ${referralCode} pour avoir 10% sur ta première commande !`, url })
                        } else {
                          navigator.clipboard.writeText(url)
                          setReferralCopied(true)
                          setTimeout(() => setReferralCopied(false), 2000)
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-border hover:border-primary text-sm tracking-[0.1em] uppercase transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Partager mon lien de parrainage
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Formulaire de connexion/inscription
  return (
    <div className="min-h-screen pt-32 pb-24 bg-background">
      <div className="max-w-md mx-auto px-6">
        <div className="bg-cream p-8 lg:p-12 shadow-sm animate-fade-in-up">
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
        </div>
      </div>
    </div>
  )
}
