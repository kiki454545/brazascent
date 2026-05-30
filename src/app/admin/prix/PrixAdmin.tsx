'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, ChevronRight, Save, Check, Calculator } from 'lucide-react'

const MARGES = { bas: 1.5, milieu: 1.85, haut: 2.3 }
const FOURNITURES_DEFAULT = 2
const ENVOI_DEFAULT = 5.9
const NB_DECANTS_DEFAULT = 2

interface Produit {
  id: string
  name: string
  brand: string
  price_by_size: Record<string, number>
  sizes: string[]
  bottle_price: number
  bottle_ml: number
}

function parseMl(size: string): number {
  return parseFloat(size.replace('ml', '').trim()) || 0
}

function round05(n: number) {
  return Math.ceil(n / 0.5) * 0.5
}

function calcPrix(flaconPrix: number, flaconMl: number, vol: number, fournitures: number, envoi: number, nbDecants: number) {
  const coutMl = flaconPrix / flaconMl
  const coutParfum = coutMl * vol
  const fraisPartages = fournitures + envoi / nbDecants
  const coutTotal = coutParfum + fraisPartages
  return {
    coutTotal: +coutTotal.toFixed(2),
    bas: round05(coutTotal * MARGES.bas),
    milieu: round05(coutTotal * MARGES.milieu),
    haut: round05(coutTotal * MARGES.haut),
    margeBas: +(round05(coutTotal * MARGES.bas) - coutTotal).toFixed(2),
    margeMilieu: +(round05(coutTotal * MARGES.milieu) - coutTotal).toFixed(2),
    margeHaut: +(round05(coutTotal * MARGES.haut) - coutTotal).toFixed(2),
  }
}

function MargeTag({ val }: { val: number }) {
  const cls = val >= 5
    ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
    : val >= 0
    ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40 border-red-200 dark:border-red-800'
  return (
    <span className={`text-[10px] border rounded px-1.5 py-0.5 ${cls}`}>
      {val >= 0 ? '+' : ''}{val}€
    </span>
  )
}

function LigneProduit({
  produit,
  fournitures,
  envoi,
  nbDecants,
  onUpdate,
}: {
  produit: Produit
  fournitures: number
  envoi: number
  nbDecants: number
  onUpdate: (id: string, priceBySize: Record<string, number>, bottlePrice: number, bottleMl: number) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editPrices, setEditPrices] = useState<Record<string, number>>({ ...produit.price_by_size })
  const [bottlePrice, setBottlePrice] = useState(produit.bottle_price || 0)
  const [bottleMl, setBottleMl] = useState(produit.bottle_ml || 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasFlacon = bottlePrice > 0 && bottleMl > 0

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(produit.id, editPrices, bottlePrice, bottleMl)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const sizes = produit.sizes?.length ? produit.sizes : Object.keys(produit.price_by_size)

  return (
    <div className="border border-admin-border rounded-lg mb-2 overflow-hidden bg-admin-surface">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-admin-surface-alt transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 text-[#C9A962] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <span className="flex-1 text-sm text-admin-text">{produit.name}</span>
        {hasFlacon && (
          <span className="text-xs text-admin-muted">
            {(bottlePrice / bottleMl).toFixed(2)}€/ml
          </span>
        )}
        <span className="text-xs text-admin-muted hidden sm:block">
          {sizes.map(s => editPrices[s] > 0 ? `${s}: ${editPrices[s]}€` : null).filter(Boolean).join(' · ')}
        </span>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-admin-border space-y-4">
          {/* Infos flacon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-admin-muted mb-1 uppercase tracking-wide">
                Prix flacon d&apos;achat (€)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={bottlePrice || ''}
                placeholder="ex: 180"
                onChange={e => setBottlePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-admin-input border border-admin-border rounded-lg text-admin-text focus:outline-none focus:border-[#C9A962]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-admin-muted mb-1 uppercase tracking-wide">
                Volume flacon (ml)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={bottleMl || ''}
                placeholder="ex: 100"
                onChange={e => setBottleMl(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-admin-input border border-admin-border rounded-lg text-admin-text focus:outline-none focus:border-[#C9A962]"
              />
            </div>
          </div>

          {/* Calculs par taille */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sizes.map(size => {
              const vol = parseMl(size)
              const calc = hasFlacon ? calcPrix(bottlePrice, bottleMl, vol, fournitures, envoi, nbDecants) : null
              return (
                <div
                  key={size}
                  className="bg-admin-surface-alt border border-admin-border rounded-lg p-3 space-y-2"
                >
                  <div className="text-xs font-semibold text-[#C9A962] uppercase tracking-widest">
                    Format {size}
                  </div>

                  {calc && (
                    <div className="space-y-1 text-xs text-admin-muted">
                      <div>
                        Coût total :{' '}
                        <strong className="text-admin-text">{calc.coutTotal}€</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400">Plancher : {calc.bas}€</span>
                        <MargeTag val={calc.margeBas} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 dark:text-amber-400">Conseillé : {calc.milieu}€</span>
                        <MargeTag val={calc.margeMilieu} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-orange-600 dark:text-orange-400">Premium : {calc.haut}€</span>
                        <MargeTag val={calc.margeHaut} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] text-admin-muted mb-1 uppercase tracking-wide">
                      Prix site (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editPrices[size] ?? 0}
                      onChange={e =>
                        setEditPrices(prev => ({ ...prev, [size]: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full px-2 py-1.5 text-sm bg-admin-input border border-admin-border rounded text-admin-text focus:outline-none focus:border-[#C9A962]"
                    />
                    {calc && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {[
                          { p: calc.bas, label: '↓', cls: 'border-emerald-400/40 text-emerald-600 dark:text-emerald-400' },
                          { p: calc.milieu, label: '✦', cls: 'border-amber-400/40 text-amber-600 dark:text-amber-400' },
                          { p: calc.haut, label: '↑', cls: 'border-orange-400/40 text-orange-600 dark:text-orange-400' },
                        ].map(({ p, label, cls }) => (
                          <button
                            key={p}
                            onClick={() => setEditPrices(prev => ({ ...prev, [size]: p }))}
                            className={`text-[10px] px-1.5 py-0.5 rounded border bg-transparent cursor-pointer ${cls}`}
                          >
                            {label} {p}€
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#C9A962] text-white hover:bg-[#b8954e]'
              }`}
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Sauvegardé</>
              ) : saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
              ) : (
                <><Save className="w-4 h-4" /> Changer le prix</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BlocMarque({
  marque,
  produits,
  fournitures,
  envoi,
  nbDecants,
  onUpdate,
}: {
  marque: string
  produits: Produit[]
  fournitures: number
  envoi: number
  nbDecants: number
  onUpdate: (id: string, priceBySize: Record<string, number>, bottlePrice: number, bottleMl: number) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-3 border border-[#C9A962]/30 rounded-xl overflow-hidden">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-admin-surface hover:bg-admin-surface-alt transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 text-[#C9A962] flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
        <span className="flex-1 font-medium tracking-wide text-admin-text">{marque}</span>
        <span className="text-xs bg-[#C9A962]/15 text-[#C9A962] rounded-full px-2.5 py-0.5">
          {produits.length} parfum{produits.length > 1 ? 's' : ''}
        </span>
      </div>
      {open && (
        <div className="p-3 border-t border-admin-border bg-admin-surface">
          {produits.map(p => (
            <LigneProduit
              key={p.id}
              produit={p}
              fournitures={fournitures}
              envoi={envoi}
              nbDecants={nbDecants}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PrixAdmin() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fournitures, setFournitures] = useState(FOURNITURES_DEFAULT)
  const [envoi, setEnvoi] = useState(ENVOI_DEFAULT)
  const [nbDecants, setNbDecants] = useState(NB_DECANTS_DEFAULT)
  const [search, setSearch] = useState('')

  const fetchProduits = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, price, price_by_size, sizes, bottle_price, bottle_ml')
        .eq('is_active', true)
        .order('brand')
        .order('name')
      if (error) throw error
      setProduits((data || []).map(row => ({
        id: row.id,
        name: row.name || '',
        brand: row.brand || '',
        price_by_size: (row.price_by_size as Record<string, number>) || {},
        sizes: (row.sizes as string[]) || [],
        bottle_price: row.bottle_price || 0,
        bottle_ml: row.bottle_ml || 0,
      })))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePrix = useCallback(async (
    id: string,
    priceBySize: Record<string, number>,
    bottlePrice: number,
    bottleMl: number
  ) => {
    const { error } = await supabase
      .from('products')
      .update({ price_by_size: priceBySize, bottle_price: bottlePrice, bottle_ml: bottleMl })
      .eq('id', id)
    if (error) throw error
    setProduits(prev =>
      prev.map(p => p.id === id ? { ...p, price_by_size: priceBySize, bottle_price: bottlePrice, bottle_ml: bottleMl } : p)
    )
  }, [])

  useEffect(() => {
    fetchProduits()
  }, [fetchProduits])

  const parMarque = produits.reduce<Record<string, Produit[]>>((acc, p) => {
    if (!acc[p.brand]) acc[p.brand] = []
    acc[p.brand].push(p)
    return acc
  }, {})

  const marques = Object.keys(parMarque).sort()
  const marquesFiltrees = search
    ? marques.filter(m =>
        m.toLowerCase().includes(search.toLowerCase()) ||
        parMarque[m].some(p => p.name.toLowerCase().includes(search.toLowerCase()))
      )
    : marques

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <Calculator className="w-5 h-5 text-[#C9A962]" />
        </div>
        <div>
          <h1 className="text-xl font-light tracking-[0.1em] text-admin-text">Calculateur de prix</h1>
          <p className="text-sm text-admin-muted">
            Renseignez le prix et volume du flacon d&apos;achat pour obtenir des suggestions de prix de vente
          </p>
        </div>
      </div>

      {/* Paramètres de coûts */}
      <div className="bg-admin-surface border border-admin-border rounded-xl p-4">
        <p className="text-xs font-medium text-admin-muted uppercase tracking-widest mb-3">
          Paramètres de calcul (partagés)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Frais d'envoi (€)", val: envoi, set: setEnvoi, step: 0.5 },
            { label: 'Fournitures / décant (€)', val: fournitures, set: setFournitures, step: 0.5 },
            { label: 'Décants moy. / commande', val: nbDecants, set: setNbDecants, step: 1 },
          ].map(({ label, val, set, step }) => (
            <div key={label}>
              <label className="block text-xs text-admin-muted mb-1">{label}</label>
              <input
                type="number"
                min="0"
                step={step}
                value={val}
                onChange={e => set(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-admin-input border border-admin-border rounded-lg text-admin-text focus:outline-none focus:border-[#C9A962]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher une marque ou un parfum..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-admin-surface border border-admin-border rounded-xl text-admin-text focus:outline-none focus:border-[#C9A962] focus:ring-1 focus:ring-[#C9A962]/30"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 text-admin-muted">
          <div className="w-6 h-6 border-2 border-[#C9A962] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Chargement des produits...
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
          Erreur : {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-xs text-admin-muted">
            {marques.length} marque{marques.length > 1 ? 's' : ''} · {produits.length} produits
          </p>
          {marquesFiltrees.map(marque => (
            <BlocMarque
              key={marque}
              marque={marque}
              produits={
                search
                  ? parMarque[marque].filter(
                      p =>
                        p.name.toLowerCase().includes(search.toLowerCase()) ||
                        marque.toLowerCase().includes(search.toLowerCase())
                    )
                  : parMarque[marque]
              }
              fournitures={fournitures}
              envoi={envoi}
              nbDecants={nbDecants}
              onUpdate={updatePrix}
            />
          ))}
        </>
      )}
    </div>
  )
}
