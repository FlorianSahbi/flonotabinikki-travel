// @path: src/features/explore/useExploreStore.ts
'use client'

import { create } from 'zustand'
import { supabase } from '@/shared/lib/supabaseClient'
import { Viewport } from 'next'
import { FeedItem } from '../feed'

export type FocusSource = 'system' | 'map' | 'stories'
export type ViewMode = 'map' | 'stories'

type State = {
  focusId: string | null
  focusSource: FocusSource
  contextById: Record<string, FeedItem[]>
  viewport: Viewport | null
  loading: boolean

  viewMode: ViewMode
}

type Actions = {
  setFocus: (
    id: string | null,
    opts?: { fetch?: boolean; source?: FocusSource }
  ) => void
  seedContext: (id: string, items: FeedItem[]) => void
  loadContext: (id: string, opts?: { force?: boolean }) => Promise<void>
  setViewport: (v: Viewport | null) => void
  getContextFor: (id: string) => FeedItem[] | undefined
  setViewMode: (m: ViewMode) => void
}

export const useExploreStore = create<State & Actions>((set, get) => ({
  focusId: null,
  focusSource: 'system',
  contextById: {},
  viewport: null,
  loading: false,

  setFocus: (id, opts) => {
    const nextSource: FocusSource = opts?.source ?? get().focusSource
    set({ focusId: id, focusSource: nextSource })
    if (opts?.fetch && id) {
      void get().loadContext(id)
    }
  },

  seedContext: (id, items) => {
    if (!id) return
    set((state) => ({
      contextById: { ...state.contextById, [id]: items ?? [] },
    }))
  },

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
        set({ loading: false })
        return
      }
      const items = Array.isArray(data) ? (data as FeedItem[]) : []
      set((state) => ({
        contextById: { ...state.contextById, [id]: items },
        loading: false,
      }))
    } catch {
      set({ loading: false })
    }
  },

  setViewport: (v) => set({ viewport: v }),
  getContextFor: (id) => get().contextById[id],

  viewMode: 'map',
  setViewMode: (m) => set({ viewMode: m }),
}))

export const useFocusId = () => useExploreStore((s) => s.focusId)
export const useFocusSource = () => useExploreStore((s) => s.focusSource)

export const useContextForFocus = () => {
  const focusId = useExploreStore((s) => s.focusId)
  const contextById = useExploreStore((s) => s.contextById)
  return focusId ? contextById[focusId] : undefined
}
