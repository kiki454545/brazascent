'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Plus, Edit2, Trash2, Check, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

interface Address {
  id: string
  label: string
  street: string
  city: string
  postal_code: string
  country: string
  is_default: boolean
}

export default function AdressesPage() {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    label: 'Domicile',
    street: '',
    city: '',
    postal_code: '',
    country: 'France',
  })

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/compte')
    }
  }, [isInitialized, user, router])

  useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) return

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('addresses')
          .insert({
            ...formData,
            user_id: user.id,
            is_default: addresses.length === 0,
          })

        if (error) throw error
      }

      await fetchAddresses()
      resetForm()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
    }
  }

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      street: address.street,
      city: address.city,
      postal_code: address.postal_code,
      country: address.country,
    })
    setEditingId(address.id)
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) return

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchAddresses()
    } catch (err) {
      console.error('Error deleting address:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    if (!user) return

    try {
      // Remove default from all
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Set new default
      await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)

      await fetchAddresses()
    } catch (err) {
      console.error('Error setting default:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      label: 'Domicile',
      street: '',
      city: '',
      postal_code: '',
      country: 'France',
    })
    setEditingId(null)
    setIsAdding(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F9F6F1]">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back link */}
          <Link
            href="/compte"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#C9A962] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au compte
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light tracking-[0.15em] uppercase">
              Mes Adresses
            </h1>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white text-sm tracking-[0.1em] uppercase hover:bg-[#C9A962] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white p-8 shadow-sm mb-8"
            >
              <h2 className="text-xl tracking-[0.1em] uppercase mb-6">
                {editingId ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Nom de l&apos;adresse</label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none transition-colors"
                  >
                    <option value="Domicile">Domicile</option>
                    <option value="Bureau">Bureau</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Adresse</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    required
                    placeholder="123 rue Example"
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Code postal</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      required
                      placeholder="75001"
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Ville</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="Paris"
                      className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Pays</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 focus:border-[#C9A962] focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#19110B] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#C9A962] transition-colors"
                  >
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 text-sm tracking-[0.15em] uppercase hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Addresses list */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-white p-12 shadow-sm text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-6">Vous n&apos;avez pas encore d&apos;adresse enregistrée</p>
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#19110B] text-white text-sm tracking-[0.1em] uppercase hover:bg-[#C9A962] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une adresse
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-[#C9A962] mt-1" />
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">{address.label}</span>
                          {address.is_default && (
                            <span className="px-2 py-0.5 bg-[#C9A962] text-white text-xs uppercase">
                              Par défaut
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">{address.street}</p>
                        <p className="text-gray-600">
                          {address.postal_code} {address.city}
                        </p>
                        <p className="text-gray-600">{address.country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="p-2 text-gray-400 hover:text-[#C9A962] transition-colors"
                          title="Définir par défaut"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-gray-400 hover:text-[#C9A962] transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
