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

    // Réessayer en cas d'AbortError (problème connu avec React 19)
    let data = null
    let error = null
    let retries = 0
    const maxRetries = 3

    while (retries < maxRetries) {
      try {
        const result = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        data = result.data
        error = result.error

        // Si c'est une AbortError, réessayer
        if (error && isAbortError(error)) {
          console.log('fetchProfile: AbortError, retrying...', retries + 1)
          retries++
          await new Promise(resolve => setTimeout(resolve, 100 * retries))
          continue
        }
        break
      } catch (err: any) {
        if (isAbortError(err) && retries < maxRetries - 1) {
          console.log('fetchProfile: caught AbortError, retrying...', retries + 1)
          retries++
          await new Promise(resolve => setTimeout(resolve, 100 * retries))
          continue
        }
        console.error('fetchProfile catch error:', err)
        return
      }
    }

    console.log('fetchProfile result:', { data, errorCode: error?.code, errorMessage: error?.message })

    if (error) {
      // Si le profil n'existe pas, le créer automatiquement
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating one...')

        // Réessayer la création aussi en cas d'AbortError
        let newProfile = null
        let createError = null
        retries = 0

        while (retries < maxRetries) {
          try {
            const result = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email || '',
              })
              .select()
              .single()

            newProfile = result.data
            createError = result.error

            if (createError && isAbortError(createError)) {
              console.log('createProfile: AbortError, retrying...', retries + 1)
              retries++
              await new Promise(resolve => setTimeout(resolve, 100 * retries))
              continue
            }
            break
          } catch (err: any) {
            if (isAbortError(err) && retries < maxRetries - 1) {
              retries++
              await new Promise(resolve => setTimeout(resolve, 100 * retries))
              continue
            }
            console.error('createProfile catch error:', err)
            return
          }
        }

        console.log('Create profile result:', { newProfile, createError })

        if (createError) {
          console.error('Error creating profile:', createError)
          return
        }

        if (newProfile) {
          console.log('Setting new profile:', newProfile)
          set({ profile: newProfile })
        }
        return
      }

      if (!isAbortError(error)) {
        console.error('Fetch profile error:', error)
      }
      return
    }

    if (data) {
      console.log('Setting existing profile:', data)
      set({ profile: data })
    }
  },
}))
