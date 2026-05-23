'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Tag, Eye, Percent, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  original_price?: number | null
  price_by_size?: Record<string, number>
  images: string[]
  stock: number
  is_active?: boolean
  is_promo?: boolean
}

function getMinPrice(product: Product): number {
  const prices = Object.values(product.price_by_size ?? {}).filter((v): v is number => typeof v === 'number' && v > 0)
  return prices.length > 0 ? Math.min(...prices) : product.price
}

function getDiscount(product: Product): number | null {
  if (!product.original_price || product.original_price <= 0) return null
  const minPrice = getMinPrice(product)
  if (minPrice <= 0) return null
  return Math.round((1 - minPrice / product.original_price) * 100)
}

export default function AdminPromosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetchPromos()
  }, [])

  const fetchPromos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, brand, price, original_price, price_by_size, images, stock, is_active, is_promo')
      .eq('is_promo', true)
      .order('name', { ascending: true })
    setProducts(data ?? [])
    setLoading(false)
  }

  const togglePromo = async (productId: string) => {
    await supabase.from('products').update({ is_promo: false }).eq('id', productId)
    setProducts(products.filter(p => p.id !== productId))
  }

  const handleDelete = async (productId: string) => {
    setDeleting(true)
    setDeleteError(null)
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      setDeleteError(`Erreur: ${error.message}`)
      setDeleting(false)
      return
    }
    setProducts(products.filter(p => p.id !== productId))
    setDeleteModal(null)
    setDeleting(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tag className="w-6 h-6 text-red-500" />
            Produits en Promo
          </h1>
          <p className="text-admin-muted mt-1">{products.length} produit{products.length !== 1 ? 's' : ''} en promotion</p>
        </div>
        <Link
          href="/admin/produits/nouveau?promo=true"
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau produit promo
        </Link>
      </div>

      {/* Tip */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <Percent className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-red-700">
          <p className="font-medium">Comment ça marche</p>
          <p className="mt-1">Un produit promo affiche un badge rouge &quot;Promo&quot; sur la boutique, ainsi que le <strong>prix barré</strong> à côté du prix promo. Pour ajouter le prix barré, modifie le produit et coche &quot;Promo&quot;.</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-admin-surface rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-light" />
          <input
            type="text"
            placeholder="Rechercher un produit promo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
          />
        </div>
      </div>

      {/* Table */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-admin-surface rounded-xl shadow-sm overflow-hidden"
      >
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-admin-surface-alt">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Prix barré</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Prix promo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Réduction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filtered.map((product) => {
                  const minPrice = getMinPrice(product)
                  const discount = getDiscount(product)
                  return (
                    <tr key={product.id} className="hover:bg-admin-surface-alt">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 relative bg-admin-surface-alt rounded-lg overflow-hidden flex-shrink-0">
                            {product.images[0] && (
                              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-admin-muted">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.original_price ? (
                          <span className="text-admin-muted line-through">{product.original_price.toFixed(2)} €</span>
                        ) : (
                          <span className="text-admin-light text-sm italic">Non défini</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-red-600">{minPrice.toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4">
                        {discount !== null ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">-{discount}%</span>
                        ) : (
                          <span className="text-admin-light text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.is_active === false ? (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Inactif</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Actif</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/parfum/${product.slug}`}
                            target="_blank"
                            className="p-2 text-admin-light hover:text-admin-muted transition-colors"
                            title="Voir sur le site"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/produits/${product.id}`}
                            className="p-2 text-admin-light hover:text-[#C9A962] transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => togglePromo(product.id)}
                            className="p-2 text-admin-light hover:text-orange-500 transition-colors"
                            title="Retirer de la promo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal(product.id)}
                            className="p-2 text-admin-light hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-admin-light mx-auto mb-4" />
            <p className="text-admin-muted mb-2">Aucun produit en promo</p>
            <p className="text-sm text-admin-light mb-6">
              Créez un nouveau produit promo ou activez le badge &quot;Promo&quot; sur un produit existant.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/admin/produits/nouveau?promo=true"
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouveau produit promo
              </Link>
              <Link
                href="/admin/produits"
                className="flex items-center gap-2 px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors text-sm"
              >
                Gérer les produits
              </Link>
            </div>
          </div>
        )}
      </m.div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-admin-surface rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-medium mb-2">Supprimer ce produit ?</h3>
            <p className="text-admin-muted mb-4">Cette action est irréversible.</p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{deleteError}</div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => { setDeleteModal(null); setDeleteError(null) }}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-admin-border rounded-lg hover:bg-admin-surface-alt transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Suppression...</> : 'Supprimer'}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
