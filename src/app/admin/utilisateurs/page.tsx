'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Users,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Eye,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionMenu, setActionMenu] = useState<{ userId: string; x: number; y: number } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setActionMenu(null)
    if (actionMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [actionMenu])

  const openActionMenu = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setActionMenu({
      userId,
      x: rect.right - 192, // 192px = largeur du menu (w-48)
      y: rect.bottom + 4
    })
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId)

      if (!error) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        ))
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
    setActionMenu(null)
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const adminCount = users.filter(u => u.is_admin).length
  const regularCount = users.filter(u => !u.is_admin).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <p className="text-gray-500">{users.length} utilisateurs inscrits</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{users.length}</p>
              <p className="text-sm text-gray-500">Total utilisateurs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{adminCount}</p>
              <p className="text-sm text-gray-500">Administrateurs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{regularCount}</p>
              <p className="text-sm text-gray-500">Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#C9A962]"
          />
        </div>
      </div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm"
      >
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C9A962] rounded-full flex items-center justify-center text-white font-medium">
                          {user.first_name?.[0] || user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`
                              : 'Non renseigné'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-gray-500 mt-1">
                            <Phone className="w-4 h-4" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Client
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-gray-400 hover:text-[#C9A962] transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => openActionMenu(e, user.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </motion.div>

      {/* Action menu dropdown - position fixe */}
      {actionMenu && (
        <div
          className="fixed w-48 bg-white rounded-lg shadow-xl border z-[100] py-1"
          style={{ top: actionMenu.y, left: actionMenu.x }}
        >
          {(() => {
            const user = users.find(u => u.id === actionMenu.userId)
            if (!user) return null
            return (
              <button
                onClick={() => {
                  toggleAdmin(user.id, user.is_admin)
                  setActionMenu(null)
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                {user.is_admin ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Retirer les droits admin
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Promouvoir admin
                  </>
                )}
              </button>
            )
          })()}
        </div>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Détails utilisateur</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#C9A962] rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {selectedUser.first_name?.[0] || selectedUser.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-medium">
                    {selectedUser.first_name || selectedUser.last_name
                      ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`
                      : 'Non renseigné'}
                  </p>
                  {selectedUser.is_admin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                      <Shield className="w-3 h-3" />
                      Administrateur
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedUser.phone || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date d&apos;inscription</p>
                    <p className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex gap-4">
                <button
                  onClick={() => {
                    toggleAdmin(selectedUser.id, selectedUser.is_admin)
                    setSelectedUser(null)
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                    selectedUser.is_admin
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {selectedUser.is_admin ? (
                    <>
                      <ShieldOff className="w-4 h-4" />
                      Retirer admin
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Promouvoir admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
