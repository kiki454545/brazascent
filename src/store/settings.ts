import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AnnouncementMessage {
  id: string
  text: string
  enabled: boolean
}

interface Settings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  freeShippingThreshold: number
  standardShippingPrice: number
  expressShippingPrice: number
  taxRate: number
  enableNotifications: boolean
  enableEmailConfirmation: boolean
  maintenanceMode: boolean
  notificationEmails: string[]
  announcementMessages: AnnouncementMessage[]
  announcementSpeed: number
}

interface SettingsStore {
  settings: Settings
  isLoaded: boolean
  fetchSettings: () => Promise<void>
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
  taxRate: 20,
  enableNotifications: true,
  enableEmailConfirmation: false,
  maintenanceMode: false,
  notificationEmails: [],
  announcementMessages: [
    { id: '1', text: 'Livraison offerte dès 65€ d\'achat', enabled: true },
    { id: '2', text: 'Échantillons offerts dès 120€ d\'achat', enabled: true }
  ],
  announcementSpeed: 4
}

// Helper pour ignorer les AbortError
const isAbortError = (error: any): boolean => {
  if (!error) return false
  const message = error.message || ''
  return error.name === 'AbortError' ||
         message.includes('AbortError') ||
         message.includes('signal is aborted')
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,

  fetchSettings: async () => {
    // Ne pas recharger si déjà chargé
    if (get().isLoaded) return

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')

      if (error) {
        // Ignorer les erreurs d'annulation
        if (isAbortError(error)) {
          set({ isLoaded: true })
          return
        }
        console.error('Error fetching settings:', error)
        set({ isLoaded: true })
        return
      }

      if (data && data.length > 0) {
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
            loadedSettings.freeShippingThreshold = shipping.freeShippingThreshold as number ?? defaultSettings.freeShippingThreshold
            loadedSettings.standardShippingPrice = shipping.standardShippingPrice as number ?? defaultSettings.standardShippingPrice
            loadedSettings.expressShippingPrice = shipping.expressShippingPrice as number ?? defaultSettings.expressShippingPrice
          } else if (row.key === 'payment') {
            const payment = row.value as Record<string, unknown>
            loadedSettings.taxRate = payment.taxRate as number ?? defaultSettings.taxRate
          } else if (row.key === 'notifications') {
            const notifications = row.value as Record<string, unknown>
            loadedSettings.enableNotifications = notifications.enableNotifications as boolean ?? defaultSettings.enableNotifications
            loadedSettings.enableEmailConfirmation = notifications.enableEmailConfirmation as boolean ?? defaultSettings.enableEmailConfirmation
            loadedSettings.maintenanceMode = notifications.maintenanceMode as boolean ?? defaultSettings.maintenanceMode
            loadedSettings.notificationEmails = (notifications.notificationEmails as string[]) ?? defaultSettings.notificationEmails
          } else if (row.key === 'announcements') {
            const announcements = row.value as Record<string, unknown>
            loadedSettings.announcementMessages = (announcements.messages as AnnouncementMessage[]) ?? defaultSettings.announcementMessages
            loadedSettings.announcementSpeed = (announcements.speed as number) ?? defaultSettings.announcementSpeed
          }
        })

        set({ settings: { ...defaultSettings, ...loadedSettings }, isLoaded: true })
      } else {
        set({ isLoaded: true })
      }
    } catch (err: any) {
      // Ignorer les erreurs d'annulation
      if (isAbortError(err)) {
        set({ isLoaded: true })
        return
      }
      console.error('Error:', err)
      set({ isLoaded: true })
    }
  }
}))
