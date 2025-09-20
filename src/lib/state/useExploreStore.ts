'use client'

import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import type { FeedItem } from '@/lib/feed'
import { supabase } from '@/lib/supabaseClient'

type Viewport = { lng: number; lat: number; zoom: number }
type FocusSource = 'map' | 'stories' | 'system'

type State = {
  focusId: string | null
  focusSource: FocusSource
  contextById: Record<string, FeedItem[] | undefined>
  viewport?: Viewport
  loading: boolean
}

type Actions = {
  setFocus: (
    id: string | null,
    opts?: { fetch?: boolean; syncUrl?: boolean; source?: FocusSource }
  ) => void
  loadContext: (id: string, opts?: { force?: boolean }) => Promise<void>
  seedContext: (id: string, items: FeedItem[]) => void
  hydrateFromUrl: () => void
  setViewport: (v?: Viewport) => void
  getContextFor: (id: string) => FeedItem[] | undefined
}

export const useExploreStore = create<State & Actions>((set, get) => ({
  focusId: null,
  focusSource: 'system',
  contextById: {},
  viewport: undefined,
  loading: false,

  setFocus: (id, opts) => {
    const { fetch = true, syncUrl = true, source = 'system' } = opts ?? {}
    set({ focusId: id ?? null, focusSource: source })

    if (syncUrl) {
      const url = new URL(window.location.href)
      if (id) url.searchParams.set('focus', id)
      else url.searchParams.delete('focus')
      window.history.replaceState(null, '', url.toString())
    }

    if (id && fetch) void get().loadContext(id)
  },

  async loadContext(id: string, opts?: { force?: boolean }) {
    const force = !!opts?.force
    const cached = get().contextById[id]
    if (!force && cached) return
    set({ loading: true })
    const { data, error } = await supabase.rpc('feed_get_context_items', {
      target_id: id,
      range_size: 3,
    })
    if (!error && data) {
      set((s) => ({
        contextById: { ...s.contextById, [id]: data as FeedItem[] },
        loading: false,
      }))
    } else {
      set({ loading: false })
    }
  },

  seedContext: (id, items) =>
    set((s) => ({ contextById: { ...s.contextById, [id]: items } })),

  hydrateFromUrl: () => {
    const id = new URL(window.location.href).searchParams.get('focus')
    if (id)
      get().setFocus(id, { fetch: true, syncUrl: false, source: 'system' })
  },

  setViewport: (v) => set({ viewport: v ?? undefined }),

  getContextFor: (id: string) => get().contextById[id],
}))

export const useFocusId = () => useExploreStore((s) => s.focusId)
export const useFocusSource = () => useExploreStore((s) => s.focusSource)
export const useContextForFocus = () =>
  useExploreStore(
    (s) => (s.focusId ? s.contextById[s.focusId] : undefined),
    shallow
  )
export const useLoading = () => useExploreStore((s) => s.loading)
