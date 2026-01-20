import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_admin: boolean
}

interface AuthStore {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    // Si déjà initialisé, ne rien faire
    if (get().isInitialized) return

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      }

      // Écouter les changements d'auth
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user })
          await get().fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null })
        }
      })

      set({ isInitialized: true })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ isInitialized: true })
    }
  },

  signUp: async (email, password, firstName, lastName) => {
    set({ isLoading: true })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false })
        return { error: error.message }
      }

      if (data.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: firstName || null,
            last_name: lastName || null,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        set({ user: data.user })
        await get().fetchProfile()
      }

      set({ isLoading: false })
      return { error: null }
    } catch (error: any) {
      set({ isLoading: false })
      return { error: error.message || 'Une erreur est survenue' }
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false })
        if (error.message === 'Invalid login credentials') {
          return { error: 'Email ou mot de passe incorrect' }
        }
        return { error: error.message }
      }

      if (data.user) {
        set({ user: data.user })
        await get().fetchProfile()
      }

      set({ isLoading: false })
      return { error: null }
    } catch (error: any) {
      set({ isLoading: false })
      return { error: error.message || 'Une erreur est survenue' }
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
    set({ user: null, profile: null, isLoading: false })
  },

  updateProfile: async (data) => {
    const { user } = get()
    if (!user) return { error: 'Non connecté' }

    set({ isLoading: true })

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', user.id)

      if (error) {
        set({ isLoading: false })
        return { error: error.message }
      }

      await get().fetchProfile()
      set({ isLoading: false })
      return { error: null }
    } catch (error: any) {
      set({ isLoading: false })
      return { error: error.message || 'Une erreur est survenue' }
    }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (!isAbortError(error)) {
          console.error('Fetch profile error:', error)
        }
        return
      }

      if (data) {
        set({ profile: data })
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Fetch profile error:', error)
      }
    }
  },
}))
