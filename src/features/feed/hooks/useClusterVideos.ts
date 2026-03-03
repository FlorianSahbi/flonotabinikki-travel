// @path: src/features/feed/hooks/useClusterVideos.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabaseClient'
import type { FeedItem } from '../types'

type ClusterVideoRow = {
  id: string
  lat: number
  lng: number
  recorded_at_local: string
  main_url: string
  poster_url: string
  title: string
  description: string
  preview_url: string
}

// Simple in-memory cache with LRU-like behavior
const MAX_CACHE_SIZE = 10
const videoCache = new Map<string, FeedItem[]>()
const cacheOrder: string[] = []

function getFromCache(clusterId: string): FeedItem[] | undefined {
  return videoCache.get(clusterId)
}

function setInCache(clusterId: string, items: FeedItem[]) {
  // Remove if exists (will re-add at end)
  const idx = cacheOrder.indexOf(clusterId)
  if (idx !== -1) cacheOrder.splice(idx, 1)

  cacheOrder.push(clusterId)
  videoCache.set(clusterId, items)

  // Evict oldest if over limit
  while (cacheOrder.length > MAX_CACHE_SIZE) {
    const oldest = cacheOrder.shift()
    if (oldest) videoCache.delete(oldest)
  }
}

export function useClusterVideos(
  clusterId: string | null,
  opts?: { enabled?: boolean; limit?: number }
) {
  const { enabled = true, limit } = opts ?? {}

  const [items, setItems] = useState<FeedItem[]>(() =>
    clusterId ? getFromCache(clusterId) ?? [] : []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!clusterId || !enabled) return

    // Check cache first
    const cached = getFromCache(clusterId)
    if (cached) {
      setItems(cached)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchVideos() {
      if (!clusterId) return
      let query = supabase
        .from('videos')
        .select('id, lat, lng, recorded_at_local, main_url, poster_url, title, description, preview_url')
        .eq('cluster_id', clusterId)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('recorded_at_local', { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error: fetchError } = await query

      if (cancelled) return

      if (fetchError) {
        setError(new Error(fetchError.message))
        setLoading(false)
        return
      }

      const feedItems: FeedItem[] = ((data as ClusterVideoRow[]) ?? []).map((v, idx) => ({
        kind: 'video' as const,
        id: v.id,
        lat: Number(v.lat),
        lng: Number(v.lng),
        recorded_at: v.recorded_at_local ?? '',
        main_url: v.main_url ?? '',
        poster_url: v.poster_url ?? '',
        title: v.title ?? '',
        description: v.description ?? '',
        preview: v.preview_url ?? '',
        position: idx,
      }))

      setInCache(clusterId!, feedItems)
      setItems(feedItems)
      setLoading(false)
    }

    fetchVideos()

    return () => {
      cancelled = true
    }
  }, [clusterId, enabled, limit])

  const refetch = useCallback(async () => {
    if (!clusterId) return []

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('id, lat, lng, recorded_at_local, main_url, poster_url, title, description, preview_url')
        .eq('cluster_id', clusterId)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('recorded_at_local', { ascending: true })

      if (fetchError) {
        setError(new Error(fetchError.message))
        setLoading(false)
        return []
      }

      const feedItems: FeedItem[] = ((data as ClusterVideoRow[]) ?? []).map((v, idx) => ({
        kind: 'video' as const,
        id: v.id,
        lat: Number(v.lat),
        lng: Number(v.lng),
        recorded_at: v.recorded_at_local ?? '',
        main_url: v.main_url ?? '',
        poster_url: v.poster_url ?? '',
        title: v.title ?? '',
        description: v.description ?? '',
        preview: v.preview_url ?? '',
        position: idx,
      }))

      setInCache(clusterId, feedItems)
      setItems(feedItems)
      setLoading(false)
      return feedItems
    } catch (e) {
      setError(e as Error)
      setLoading(false)
      return []
    }
  }, [clusterId])

  return { items, loading, error, refetch }
}

// Imperative fetch for use outside React components
export async function fetchClusterVideos(clusterId: string): Promise<FeedItem[]> {
  // Check cache first
  const cached = getFromCache(clusterId)
  if (cached) return cached

  const { data, error } = await supabase
    .from('videos')
    .select('id, lat, lng, recorded_at_local, main_url, poster_url, title, description, preview_url')
    .eq('cluster_id', clusterId)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('recorded_at_local', { ascending: true })

  if (error || !data?.length) return []

  const feedItems: FeedItem[] = (data as ClusterVideoRow[]).map((v, idx) => ({
    kind: 'video' as const,
    id: v.id,
    lat: Number(v.lat),
    lng: Number(v.lng),
    recorded_at: v.recorded_at_local ?? '',
    main_url: v.main_url ?? '',
    poster_url: v.poster_url ?? '',
    title: v.title ?? '',
    description: v.description ?? '',
    preview: v.preview_url ?? '',
    position: idx,
  }))

  setInCache(clusterId, feedItems)
  return feedItems
}
