'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { m } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Eye,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { supabase, supabaseFetch } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  slug: string
  brand: string
  price: number
  original_price?: number
  price_by_size?: Record<string, number>
  stock_by_size?: Record<string, number>
  images: string[]
  stock: number
  category?: string
  collection?: string
  is_new?: boolean
  is_bestseller?: boolean
  is_active?: boolean
  is_promo?: boolean
  display_order?: number
}

// Calculer la valeur totale du stock (prix × quantité pour chaque taille)
const calculateStockValue = (product: Product): number => {
  const priceBySize = typeof product.price_by_size === 'string'
    ? JSON.parse(product.price_by_size)
    : (product.price_by_size || {})
  const stockBySize = typeof product.stock_by_size === 'string'
    ? JSON.parse(product.stock_by_size)
    : (product.stock_by_size || {})

  let totalValue = 0
  for (const size of Object.keys(stockBySize)) {
    const price = priceBySize[size] || 0
    const qty = stockBySize[size] || 0
    totalValue += price * qty
  }
  return totalValue
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [isFromSupabase, setIsFromSupabase] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabaseFetch<Product[]>('products', {
          order: { column: 'display_order', ascending: true }
        })

        if (!isMounted) return

        if (error) {
          console.error('Error fetching products:', error)
          setProducts([])
        } else if (data) {
          setProducts(data)
          setIsFromSupabase(true)
        } else {
          setProducts([])
        }
      } catch (error) {
        if (isMounted) console.error('Error fetching products:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [])

  const refetchProducts = async () => {
    const { data, error } = await supabaseFetch<Product[]>('products', {
      order: { column: 'display_order', ascending: true }
    })

    if (!error && data) {
      setProducts(data)
    }
  }

  const handleDelete = async (productId: string) => {
    setDeleting(true)
    setDeleteError(null)

    try {
      // Supprimer le produit dans Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('Error deleting product:', error)
        setDeleteError(`Erreur lors de la suppression: ${error.message}. Vérifiez les politiques RLS dans Supabase.`)
        return
      }

      // Mettre à jour l'état local seulement si la suppression a réussi
      setProducts(products.filter(p => p.id !== productId))
      setDeleteModal(null)
    } catch (err) {
      console.error('Error:', err)
      setDeleteError('Une erreur inattendue est survenue')
    } finally {
      setDeleting(false)
    }
  }

  const moveProduct = async (productId: string, direction: 'up' | 'down') => {
    const currentIndex = products.findIndex(p => p.id === productId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= products.length) return

    const currentProduct = products[currentIndex]
    const targetProduct = products[targetIndex]

    // Échanger les display_order
    const currentOrder = currentProduct.display_order ?? currentIndex
    const targetOrder = targetProduct.display_order ?? targetIndex

    try {
      // Mettre à jour les deux produits dans Supabase
      await Promise.all([
        supabase
          .from('products')
          .update({ display_order: targetOrder })
          .eq('id', currentProduct.id),
        supabase
          .from('products')
          .update({ display_order: currentOrder })
          .eq('id', targetProduct.id)
      ])

      // Mettre à jour l'état local
      const newProducts = [...products]
      newProducts[currentIndex] = { ...targetProduct, display_order: currentOrder }
      newProducts[targetIndex] = { ...currentProduct, display_order: targetOrder }
      setProducts(newProducts)
    } catch (error) {
      console.error('Error moving product:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
    } else {
      setSelectedProducts([...selectedProducts, productId])
    }
  }

  const toggleProductBadge = async (productId: string, field: 'is_bestseller' | 'is_new' | 'out_of_stock' | 'is_promo' | 'is_active') => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    try {
      let updateData: Record<string, any> = {}

      if (field === 'is_bestseller') {
        updateData = { is_bestseller: !product.is_bestseller }
      } else if (field === 'is_new') {
        updateData = { is_new: !product.is_new }
      } else if (field === 'is_promo') {
        updateData = { is_promo: !product.is_promo }
      } else if (field === 'is_active') {
        updateData = { is_active: product.is_active === false ? true : false }
      } else if (field === 'out_of_stock') {
        const isCurrentlyOutOfStock = product.stock === 0 || product.stock == null
        updateData = { stock: isCurrentlyOutOfStock ? 1 : 0 }
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()

      if (error) {
        console.error('Error toggling badge:', error)
        return
      }

      setProducts(products.map(p => {
        if (p.id === productId) {
          if (field === 'is_bestseller') return { ...p, is_bestseller: !p.is_bestseller }
          if (field === 'is_new') return { ...p, is_new: !p.is_new }
          if (field === 'is_promo') return { ...p, is_promo: !p.is_promo }
          if (field === 'is_active') return { ...p, is_active: p.is_active === false ? true : false }
          if (field === 'out_of_stock') return { ...p, stock: (p.stock === 0 || p.stock == null) ? 1 : 0 }
        }
        return p
      }))
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = !categoryFilter || product.category === categoryFilter
    return matchSearch && matchCategory
  })

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
          <h1 className="text-2xl font-semibold">Produits</h1>
          <p className="text-admin-muted">{products.length} produits au total</p>
        </div>
        <Link
          href="/admin/produits/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </Link>
      </div>

      {/* Info banner for local products */}
      {!isFromSupabase && products.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <div className="w-5 h-5 text-amber-600 mt-0.5">⚠️</div>
          <div>
            <p className="font-medium text-amber-800">Données de démonstration</p>
            <p className="text-sm text-amber-700">
              Ces produits sont des exemples locaux. Ajoutez vos propres produits via le bouton &quot;Ajouter un produit&quot; pour qu&apos;ils soient enregistrés dans Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-admin-surface rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-admin-light" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]"
          >
            <option value="">Toutes les catégories</option>
            <option value="Eau de Parfum">Eau de Parfum</option>
            <option value="Extrait de Parfum">Extrait de Parfum</option>
          </select>
          <select className="px-4 py-2 bg-admin-input border border-admin-border text-admin-text rounded-lg focus:outline-none focus:border-[#C9A962]">
            <option value="">Tous les statuts</option>
            <option value="in-stock">En stock</option>
            <option value="low-stock">Stock faible</option>
            <option value="out-of-stock">Rupture</option>
          </select>
        </div>
      </div>

      {/* Products table */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-admin-surface rounded-xl shadow-sm overflow-hidden"
      >
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-admin-surface-alt">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredProducts.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-admin-border accent-[#C9A962]"
                    />
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-admin-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-admin-surface-alt">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 rounded border-admin-border accent-[#C9A962]"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => moveProduct(product.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0
                              ? 'text-admin-light cursor-not-allowed'
                              : 'text-admin-muted hover:text-[#C9A962] hover:bg-admin-surface-alt'
                          }`}
                          title="Monter"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => moveProduct(product.id, 'down')}
                          disabled={index === filteredProducts.length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === filteredProducts.length - 1
                              ? 'text-admin-light cursor-not-allowed'
                              : 'text-admin-muted hover:text-[#C9A962] hover:bg-admin-surface-alt'
                          }`}
                          title="Descendre"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative bg-admin-surface-alt rounded-lg overflow-hidden">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-admin-muted">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => toggleProductBadge(product.id, 'is_new')}
                          disabled={!isFromSupabase}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            product.is_new
                              ? 'bg-[#C9A962]/20 text-[#C9A962] ring-1 ring-[#C9A962]'
                              : 'bg-admin-surface-alt text-admin-light hover:bg-admin-surface-alt'
                          } ${!isFromSupabase ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={product.is_new ? 'Retirer Nouveau' : 'Ajouter Nouveau'}
                        >
                          Nouveau
                        </button>
                        <button
                          onClick={() => toggleProductBadge(product.id, 'is_bestseller')}
                          disabled={!isFromSupabase}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            product.is_bestseller
                              ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-400'
                              : 'bg-admin-surface-alt text-admin-light hover:bg-admin-surface-alt'
                          } ${!isFromSupabase ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={product.is_bestseller ? 'Retirer Bestseller' : 'Ajouter Bestseller'}
                        >
                          Bestseller
                        </button>
                        <button
                          onClick={() => toggleProductBadge(product.id, 'out_of_stock')}
                          disabled={!isFromSupabase}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            product.stock === 0
                              ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                              : 'bg-admin-surface-alt text-admin-light hover:bg-admin-surface-alt'
                          } ${!isFromSupabase ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={product.stock === 0 ? 'Remettre en stock' : 'Mettre en rupture'}
                        >
                          Rupture
                        </button>
                        <button
                          onClick={() => toggleProductBadge(product.id, 'is_promo')}
                          disabled={!isFromSupabase}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            product.is_promo
                              ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                              : 'bg-admin-surface-alt text-admin-light hover:bg-admin-surface-alt'
                          } ${!isFromSupabase ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                          title={product.is_promo ? 'Retirer Promo' : 'Mettre en Promo'}
                        >
                          Promo
                        </button>
                        <button
                          onClick={() => toggleProductBadge(product.id, 'is_active')}
                          disabled={!isFromSupabase}
                          title={product.is_active === false ? 'Activer le produit' : 'Désactiver le produit'}
                          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-all ${
                            !isFromSupabase ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                          } ${
                            product.is_active === false
                              ? 'bg-admin-surface-alt text-admin-light'
                              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-400'
                          }`}
                        >
                          <span className={`relative inline-flex w-7 h-4 rounded-full transition-colors flex-shrink-0 ${
                            product.is_active === false ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500'
                          }`}>
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                              product.is_active === false ? 'translate-x-0.5' : 'translate-x-3.5'
                            }`} />
                          </span>
                          Actif
                        </button>
                      </div>
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
                        {isFromSupabase ? (
                          <Link
                            href={`/admin/produits/${product.id}`}
                            className="p-2 text-admin-light hover:text-[#C9A962] transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        ) : (
                          <span
                            className="p-2 text-admin-light cursor-not-allowed"
                            title="Ajoutez d'abord ce produit dans Supabase"
                          >
                            <Edit className="w-4 h-4" />
                          </span>
                        )}
                        <button
                          onClick={() => setDeleteModal(product.id)}
                          className="p-2 text-admin-light hover:text-red-600 transition-colors"
                          title="Supprimer"
                          disabled={!isFromSupabase}
                        >
                          <Trash2 className="w-4 h-4" />
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
            <Package className="w-12 h-12 text-admin-light mx-auto mb-4" />
            <p className="text-admin-muted mb-4">Aucun produit trouvé</p>
            <Link
              href="/admin/produits/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#19110B] text-white rounded-lg hover:bg-[#C9A962] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter votre premier produit
            </Link>
          </div>
        )}
      </m.div>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-admin-surface rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-medium mb-2">Supprimer ce produit ?</h3>
            <p className="text-admin-muted mb-4">
              Cette action est irréversible. Le produit sera définitivement supprimé.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {deleteError}
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setDeleteModal(null)
                  setDeleteError(null)
                }}
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
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}
