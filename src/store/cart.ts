'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'
import posthog from 'posthog-js'

export interface CartPromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  pendingPromoCode: CartPromoCode | null
  addItem: (product: Product, size: string, quantity?: number) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotal: () => number
  getItemCount: () => number
  setPendingPromo: (code: CartPromoCode | null) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      pendingPromoCode: null,

      addItem: (product, size, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id && item.selectedSize === size
          )

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id && item.selectedSize === size
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }

          return {
            items: [...state.items, { product, quantity, selectedSize: size }],
          }
        })
        posthog.capture('add_to_cart', {
          product_id: product.id,
          product_name: product.name,
          product_brand: product.brand,
          size,
          quantity,
          price: (product.priceBySize && product.priceBySize[size] > 0)
            ? product.priceBySize[size]
            : product.price,
        })
      },

      removeItem: (productId, size) => {
        const removedItem = get().items.find(
          (item) => item.product.id === productId && item.selectedSize === size
        )
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.product.id === productId && item.selectedSize === size)
          ),
        }))
        if (removedItem) {
          posthog.capture('remove_from_cart', {
            product_id: productId,
            product_name: removedItem.product.name,
            size,
            quantity: removedItem.quantity,
          })
        }
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.selectedSize === size
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [], pendingPromoCode: null }),

      setPendingPromo: (code) => set({ pendingPromoCode: code }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotal: () => {
        return get().items.reduce((total, item) => {
          // Utiliser le prix par taille si disponible
          const priceBySize = item.product.priceBySize
          const sizePrice = priceBySize && priceBySize[item.selectedSize] > 0
            ? priceBySize[item.selectedSize]
            : item.product.price
          return total + sizePrice * item.quantity
        }, 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'brazascent-cart',
    }
  )
)
