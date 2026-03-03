// @path: src/features/explore/useExploreStore.ts
'use client'

import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabaseClient'
import type { FeedItem } from '../feed'

export type FocusSource = 'system' | 'map' | 'stories'
export type ViewMode = 'map' | 'stories'

const MAX_CACHE_SIZE = 20

type State = {
  focusId: string | null
  focusSource: FocusSource
  contextById: Record<string, FeedItem[]>
  contextOrder: string[] // LRU order: most recent at end
  loading: boolean
  viewMode: ViewMode
}

type Actions = {
  /**
   * Définit l’élément actuellement focus (point ou cluster)
   */
  setFocus: (
    id: string | null,
    opts?: { fetch?: boolean; source?: FocusSource }
  ) => void

  /**
   * Injecte manuellement un contexte (utile pour un cluster expand)
   */
  seedContext: (id: string, items: FeedItem[]) => void

  /**
   * Charge un contexte à partir d'un id (RPC feed_get_context_items)
   */
  loadContext: (id: string, opts?: { force?: boolean }) => Promise<void>

  /**
   * Récupère un contexte déjà chargé
   */
  getContextFor: (id: string) => FeedItem[] | undefined

  /**
   * Change le mode d’affichage (map ou stories)
   */
  setViewMode: (m: ViewMode) => void
}

/** Update LRU cache: add/move id to end, evict oldest if needed */
function updateLruCache(
  contextById: Record<string, FeedItem[]>,
  contextOrder: string[],
  id: string,
  items: FeedItem[]
): { contextById: Record<string, FeedItem[]>; contextOrder: string[] } {
  // Remove id if already in order (will re-add at end)
  const newOrder = contextOrder.filter((k) => k !== id)
  newOrder.push(id)

  const newContextById = { ...contextById, [id]: items }

  // Evict oldest entries if over limit
  while (newOrder.length > MAX_CACHE_SIZE) {
    const oldest = newOrder.shift()
    if (oldest) delete newContextById[oldest]
  }

  return { contextById: newContextById, contextOrder: newOrder }
}

export const useExploreStore = create<State & Actions>((set, get) => ({
  focusId: null,
  focusSource: 'system',
  contextById: {},
  contextOrder: [],
  loading: false,
  viewMode: 'map',

  /**
   * Change le focus courant.
   * Si opts.fetch est vrai → on recharge le contexte depuis Supabase.
   */
  setFocus: (id, opts) => {
    const nextSource: FocusSource = opts?.source ?? get().focusSource
    set({ focusId: id, focusSource: nextSource })

    // 🔥 toujours le comportement d’origine : on fetch le contexte
    if (opts?.fetch && id) {
      void get().loadContext(id)
    }
  },

  /**
   * Injecte un contexte déjà construit (cas drill-down cluster)
   */
  seedContext: (id, items) => {
    if (!id) return
    set((state) => {
      const lru = updateLruCache(state.contextById, state.contextOrder, id, items ?? [])
      return lru
    })
  },

  /**
   * Appelle la RPC feed_get_context_items pour reconstruire le feed
   * autour d’un id donné (vidéo ou cluster).
   */
  loadContext: async (id, opts) => {
    if (!id) return

    const cached = get().contextById[id]
    if (cached && !opts?.force) return

    set({ loading: true })
    try {
      const { data, error } = await supabase.rpc('feed_get_context_items', {
        target_id: id,
        range_size: 3,
      })

      if (error) {
        console.error('feed_get_context_items error:', error)
        set({ loading: false })
        return
      }

      const items = Array.isArray(data) ? (data as FeedItem[]) : []

      set((state) => {
        const lru = updateLruCache(state.contextById, state.contextOrder, id, items)
        return { ...lru, loading: false }
      })
    } catch (err) {
      console.error('loadContext failed:', err)
      set({ loading: false })
    }
  },

  getContextFor: (id) => get().contextById[id],
  setViewMode: (m) => set({ viewMode: m }),
}))

// -------- Convenience hooks --------

export const useFocusId = () => useExploreStore((s) => s.focusId)
export const useFocusSource = () => useExploreStore((s) => s.focusSource)

export const useContextForFocus = () => {
  const focusId = useExploreStore((s) => s.focusId)
  const contextById = useExploreStore((s) => s.contextById)
  return focusId ? contextById[focusId] : undefined
}
