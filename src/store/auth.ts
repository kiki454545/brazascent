import { create } from 'zustand'
import { supabase, isAbortError } from '@/lib/supabase'
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
      // Réessayer getSession en cas d'AbortError (problème connu avec React 19)
      let session = null
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries) {
        try {
          const { data } = await supabase.auth.getSession()
          session = data.session
          break
        } catch (err) {
          if (isAbortError(err) && retries < maxRetries - 1) {
            retries++
            await new Promise(resolve => setTimeout(resolve, 100))
            continue
          }
          throw err
        }
      }

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
      // Ignorer les AbortError pour l'initialisation
      if (!isAbortError(error)) {
        console.error('Auth initialization error:', error)
      }
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
      // Réessayer en cas d'AbortError (problème connu avec React 19)
      let data = null
      let error = null
      let retries = 0
      const maxRetries = 3

      while (retries < maxRetries) {
        try {
          const result = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          data = result.data
          error = result.error
          break
        } catch (err: any) {
          if (isAbortError(err) && retries < maxRetries - 1) {
            retries++
            await new Promise(resolve => setTimeout(resolve, 100))
            continue
          }
          throw err
        }
      }

      if (error) {
        set({ isLoading: false })
        if (error.message === 'Invalid login credentials') {
          return { error: 'Email ou mot de passe incorrect' }
        }
        return { error: error.message }
      }

      if (data?.user) {
        console.log('SignIn success, user:', data.user.id)
        set({ user: data.user })
        await get().fetchProfile()
        console.log('After fetchProfile, profile:', get().profile)
      } else {
        console.log('SignIn: no user in data', data)
      }

      set({ isLoading: false })
      return { error: null }
    } catch (error: any) {
      set({ isLoading: false })
      // Ignorer les AbortError pour l'UX
      if (isAbortError(error)) {
        return { error: 'Erreur de connexion, veuillez réessayer' }
      }
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
    if (!user) {
      console.log('fetchProfile: no user')
      return
    }

    console.log('fetchProfile: fetching for user', user.id)

    // Utiliser fetch directement pour éviter les AbortError de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      // Récupérer le token de session pour l'authentification
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      const response = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${accessToken || supabaseKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pgrst.object+json', // Pour obtenir un seul objet
          },
        }
      )

      console.log('fetchProfile response status:', response.status)

      if (response.status === 406) {
        // Pas de profil trouvé, le créer
        console.log('Profile not found (406), creating one...')

        const createResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey!,
              'Authorization': `Bearer ${accessToken || supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email || '',
            }),
          }
        )

        console.log('Create profile response status:', createResponse.status)

        if (createResponse.ok) {
          const newProfile = await createResponse.json()
          console.log('Setting new profile:', newProfile)
          // Le résultat est un tableau, prendre le premier élément
          set({ profile: Array.isArray(newProfile) ? newProfile[0] : newProfile })
        } else {
          const errorText = await createResponse.text()
          console.error('Error creating profile:', errorText)
        }
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Fetch profile error:', response.status, errorText)
        return
      }

      const data = await response.json()
      console.log('Setting existing profile:', data)
      set({ profile: data })
    } catch (error) {
      console.error('fetchProfile catch error:', error)
    }
  },
}))
