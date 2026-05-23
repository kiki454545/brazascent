import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentlyViewedItem {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  image: string
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[]
  add: (item: RecentlyViewedItem) => void
  clear: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== item.id)
          return { items: [item, ...filtered].slice(0, 8) }
        }),
      clear: () => set({ items: [] }),
    }),
    { name: 'braza-recently-viewed' }
  )
)
