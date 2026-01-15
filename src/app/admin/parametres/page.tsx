'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Truck,
  Bell,
  Save,
  Check,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Mail,
  Plus,
  X,
  Trash2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Settings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  freeShippingThreshold: number
  standardShippingPrice: number
  expressShippingPrice: number
  enableExpressShipping: boolean
  enableNotifications: boolean
  enableEmailConfirmation: boolean
  maintenanceMode: boolean
  notificationEmails: string[]
}

const defaultSettings: Settings = {
  storeName: 'Braza Scent',
  storeEmail: 'contact@brazascent.com',
  storePhone: '+33 1 23 45 67 89',
  storeAddress: '123 Avenue des Champs-Élysées, 75008 Paris',
  currency: 'EUR',
  freeShippingThreshold: 150,
  standardShippingPrice: 9.90,
  expressShippingPrice: 14.90,
  enableExpressShipping: true,
  enableNotifications: true,
  enableEmailConfirmation: false,
  maintenanceMode: false,
  notificationEmails: []
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [originalSettings, setOriginalSettings] = useState<Settings>(defaultSettings)
  const [showExitModal, setShowExitModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  // Charger les paramètres depuis Supabase
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')

      if (error) {
        console.error('Error fetching settings:', error)
        // Utiliser les paramètres par défaut si la table n'existe pas
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        // Combiner tous les paramètres
        const loadedSettings: Partial<Settings> = {}

        data.forEach((row) => {
          if (row.key === 'store') {
            const store = row.value as Record<string, unknown>
            loadedSettings.storeName = store.storeName as string || defaultSettings.storeName
            loadedSettings.storeEmail = store.storeEmail as string || defaultSettings.storeEmail
            loadedSettings.storePhone = store.storePhone as string || defaultSettings.storePhone
            loadedSettings.storeAddress = store.storeAddress as string || defaultSettings.storeAddress
            loadedSettings.currency = store.currency as string || defaultSettings.currency
          } else if (row.key === 'shipping') {
            const shipping = row.value as Record<string, unknown>
            loadedSettings.freeShippingThreshold = shipping.freeShippingThreshold as number || defaultSettings.freeShippingThreshold
            loadedSettings.standardShippingPrice = shipping.standardShippingPrice as number || defaultSettings.standardShippingPrice
            loadedSettings.expressShippingPrice = shipping.expressShippingPrice as number || defaultSettings.expressShippingPrice
            loadedSettings.enableExpressShipping = shipping.enableExpressShipping as boolean ?? defaultSettings.enableExpressShipping
          } else if (row.key === 'notifications') {
            const notifications = row.value as Record<string, unknown>
            loadedSettings.enableNotifications = notifications.enableNotifications as boolean ?? defaultSettings.enableNotifications
            loadedSettings.enableEmailConfirmation = notifications.enableEmailConfirmation as boolean ?? defaultSettings.enableEmailConfirmation
            loadedSettings.maintenanceMode = notifications.maintenanceMode as boolean ?? defaultSettings.maintenanceMode
            loadedSettings.notificationEmails = (notifications.notificationEmails as string[]) ?? defaultSettings.notificationEmails
          }
        })

        const mergedSettings = { ...defaultSettings, ...loadedSettings }
        setSettings(mergedSettings)
        setOriginalSettings(mergedSettings)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Vérifier si des modifications ont été faites
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  // Bloquer la navigation si modifications non sauvegardées
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Intercepter les clics sur les liens de navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (link && hasChanges) {
        const href = link.getAttribute('href')
        if (href && href.startsWith('/') && !href.startsWith('/admin/parametres')) {
          e.preventDefault()
          setPendingNavigation(href)
          setShowExitModal(true)
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [hasChanges])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Sauvegarder chaque catégorie de paramètres
      const updates = [
        {
          key: 'store',
          value: {
            storeName: settings.storeName,
            storeEmail: settings.storeEmail,
            storePhone: settings.storePhone,
            storeAddress: settings.storeAddress,
            currency: settings.currency
          }
        },
        {
          key: 'shipping',
          value: {
            freeShippingThreshold: settings.freeShippingThreshold,
            standardShippingPrice: settings.standardShippingPrice,
            expressShippingPrice: settings.expressShippingPrice,
            enableExpressShipping: settings.enableExpressShipping
          }
        },
        {
          key: 'notifications',
          value: {
            enableNotifications: settings.enableNotifications,
            enableEmailConfirmation: settings.enableEmailConfirmation,
            maintenanceMode: settings.maintenanceMode,
            notificationEmails: settings.notificationEmails
          }
        }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert(
            { key: update.key, value: update.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          )

        if (error) {
          throw error
        }
      }

      setSaved(true)
      setOriginalSettings(settings)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Erreur lors de la sauvegarde. Vérifiez que la table settings existe dans Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(originalSettings)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const addNotificationEmail = () => {
    setEmailError(null)

    if (!newEmail.trim()) {
      setEmailError('Veuillez entrer une adresse email')
      return
    }

    if (!validateEmail(newEmail)) {
      setEmailError('Adresse email invalide')
      return
    }

    if (settings.notificationEmails.includes(newEmail.toLowerCase())) {
      setEmailError('Cette adresse email existe déjà')
      return
    }

    setSettings({
      ...settings,
      notificationEmails: [...settings.notificationEmails, newEmail.toLowerCase()]
    })
    setNewEmail('')
  }

  const removeNotificationEmail = (emailToRemove: string) => {
    setSettings({
      ...settings,
      notificationEmails: settings.notificationEmails.filter(email => email !== emailToRemove)
    })
  }

  const handleDiscardAndNavigate = () => {
    setSettings(originalSettings)
    setShowExitModal(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    }
  }

  const handleSaveAndNavigate = async () => {
    await handleSave()
    setShowExitModal(false)
    if (pendingNavigation) {
      setTimeout(() => router.push(pendingNavigation), 100)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A962] mx-auto mb-4" />
          <p className="text-gray-500">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-gray-500">Configurez votre boutique</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Store info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#C9A962]/10 rounded-lg">
            <Store className="w-5 h-5 text-[#C9A962]" />
          </div>
          <h2 className="text-lg font-medium">Informations de la boutique</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la boutique
            </label>
            <input
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de contact
            </label>
            <input
              type="email"
              value={settings.storeEmail}
              onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.storePhone}
              onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Devise
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
              <option value="GBP">Livre Sterling (£)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse
            </label>
            <input
              type="text"
              value={settings.storeAddress}
              onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>
        </div>
      </motion.div>

      {/* Shipping */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Truck className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-lg font-medium">Livraison</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seuil livraison gratuite (€)
            </label>
            <input
              type="number"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix livraison standard (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.standardShippingPrice}
              onChange={(e) => setSettings({ ...settings, standardShippingPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix livraison express (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.expressShippingPrice}
              onChange={(e) => setSettings({ ...settings, expressShippingPrice: parseFloat(e.target.value) || 0 })}
              disabled={!settings.enableExpressShipping}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] ${!settings.enableExpressShipping ? 'bg-gray-100 text-gray-400' : ''}`}
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium">Livraison express</p>
              <p className="text-sm text-gray-500">Proposer la livraison express aux clients (1-2 jours ouvrés)</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableExpressShipping}
              onChange={(e) => setSettings({ ...settings, enableExpressShipping: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 accent-[#C9A962]"
            />
          </label>
        </div>
      </motion.div>

      
      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Bell className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-lg font-medium">Notifications et options</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium">Notifications par email</p>
              <p className="text-sm text-gray-500">Recevoir les alertes de nouvelles commandes</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 accent-[#C9A962]"
            />
          </label>

          {/* Section emails de notification */}
          {settings.enableNotifications && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gray-50 rounded-lg space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <p className="font-medium text-sm">Emails de notification des commandes</p>
              </div>
              <p className="text-xs text-gray-500">
                Ces adresses recevront un email à chaque nouvelle commande.
              </p>

              {/* Liste des emails */}
              {settings.notificationEmails.length > 0 && (
                <div className="space-y-2">
                  {settings.notificationEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#C9A962]" />
                        <span className="text-sm">{email}</span>
                      </div>
                      <button
                        onClick={() => removeNotificationEmail(email)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Ajouter un email */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value)
                      setEmailError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addNotificationEmail()
                      }
                    }}
                    placeholder="exemple@email.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962] text-sm ${
                      emailError ? 'border-red-500' : ''
                    }`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1">{emailError}</p>
                  )}
                </div>
                <button
                  onClick={addNotificationEmail}
                  className="px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Ajouter</span>
                </button>
              </div>

              {settings.notificationEmails.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Aucun email configuré. Ajoutez au moins une adresse pour recevoir les notifications de commandes.
                </p>
              )}
            </motion.div>
          )}

          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium">Confirmation par email</p>
              <p className="text-sm text-gray-500">Les utilisateurs doivent confirmer leur email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableEmailConfirmation}
              onChange={(e) => setSettings({ ...settings, enableEmailConfirmation: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 accent-[#C9A962]"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-red-50 rounded-lg cursor-pointer">
            <div>
              <p className="font-medium text-red-700">Mode maintenance</p>
              <p className="text-sm text-red-500">Le site sera inaccessible aux visiteurs</p>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 accent-red-500"
            />
          </label>
        </div>
      </motion.div>

      {/* Sticky save bar */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t shadow-lg z-40"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Vous avez des modifications non sauvegardées</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-[#19110B] text-white hover:bg-[#C9A962]'
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-5 h-5" />
                      Enregistré !
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold">Modifications non sauvegardées</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Vous avez des modifications non sauvegardées. Que souhaitez-vous faire ?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSaveAndNavigate}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Sauvegarder et quitter
                </button>
                <button
                  onClick={handleDiscardAndNavigate}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Annuler les modifications
                </button>
                <button
                  onClick={() => {
                    setShowExitModal(false)
                    setPendingNavigation(null)
                  }}
                  disabled={saving}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  Rester sur la page
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
