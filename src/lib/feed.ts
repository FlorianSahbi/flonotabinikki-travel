import { supabase } from '@/lib/supabaseClient'

export type FeedVideoItem = {
  kind: 'video'
  id: string
  recorded_at: string
  lat: number | null
  lng: number | null
  position: number | null
  bucket_url: string
  title?: null
  description?: null
  preview?: null
}

export type FeedClusterItem = {
  kind: 'cluster'
  id: string
  recorded_at: string
  lat: number | null
  lng: number | null
  position: number | null
  title: string | null
  description: string | null
  preview: string | null
  bucket_url?: null
}

export type FeedItem = FeedVideoItem | FeedClusterItem

// Fallback helpers si les RPC "new" ne sont pas encore présents.
// On se rabat sur les RPC historiques et on retourne des items "video".
async function fallbackGetContextVideos(
  targetId: string,
  rangeSize = 3
): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('get_context_videos', {
    target_id: targetId,
    range_size: rangeSize,
  })
  if (error) throw new Error(error.message)
  const arr = (data ?? []) as Array<{
    id: string
    recorded_at: string
    lat: number | null
    lng: number | null
    position: number | null
    bucket_url: string
  }>
  return arr.map((v) => ({
    kind: 'video',
    id: v.id,
    recorded_at: v.recorded_at,
    lat: v.lat,
    lng: v.lng,
    position: v.position,
    bucket_url: v.bucket_url,
    title: null,
    description: null,
    preview: null,
  }))
}

async function fallbackGetVideosAfter(
  refTime: string,
  limit = 5
): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('get_videos_after', {
    ref_time: refTime,
    lim: limit,
  })
  if (error) throw new Error(error.message)
  const arr = (data ?? []) as Array<{
    id: string
    recorded_at: string
    lat: number | null
    lng: number | null
    position: number | null
    bucket_url: string
  }>
  return arr.map((v) => ({
    kind: 'video',
    id: v.id,
    recorded_at: v.recorded_at,
    lat: v.lat,
    lng: v.lng,
    position: v.position,
    bucket_url: v.bucket_url,
    title: null,
    description: null,
    preview: null,
  }))
}

async function fallbackGetVideosBefore(
  refTime: string,
  limit = 5
): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('get_videos_before', {
    ref_time: refTime,
    lim: limit,
  })
  if (error) throw new Error(error.message)
  const arr = (
    (data ?? []) as Array<{
      id: string
      recorded_at: string
      lat: number | null
      lng: number | null
      position: number | null
      bucket_url: string
    }>
  ).reverse()
  return arr.map((v) => ({
    kind: 'video',
    id: v.id,
    recorded_at: v.recorded_at,
    lat: v.lat,
    lng: v.lng,
    position: v.position,
    bucket_url: v.bucket_url,
    title: null,
    description: null,
    preview: null,
  }))
}

export async function feedGetContextItems(
  targetId: string,
  rangeSize = 3
): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('feed_get_context_items', {
    target_id: targetId,
    range_size: rangeSize,
  })
  if (error) {
    // fallback si la fonction n'existe pas encore sur la DB
    if (String(error.message || '').includes('Could not find the function')) {
      return fallbackGetContextVideos(targetId, rangeSize)
    }
    throw new Error(error.message)
  }
  return (data ?? []) as FeedItem[]
}

export async function feedGetItemsAfter(
  refRecordedAt: string,
  limit = 5,
  skipClusterId?: string
): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('feed_get_items_after', {
    ref_time: refRecordedAt,
    lim: limit,
    skip_cluster_id: skipClusterId ?? null,
  })
  if (error) {
    if (String(error.message || '').includes('Could not find the function')) {
      return fallbackGetVideosAfter(refRecordedAt, limit)
    }
    throw new Error(error.message)
  }
  return (data ?? []) as FeedItem[]
}

export async function feedGetItemsBefore(
  refRecordedAt: string,
  limit = 5,
  skipClusterId?: string
): Promise<FeedItem[]> {
  const { data, error } = await supabase.rpc('feed_get_items_before', {
    ref_time: refRecordedAt,
    lim: limit,
    skip_cluster_id: skipClusterId ?? null,
  })
  if (error) {
    if (String(error.message || '').includes('Could not find the function')) {
      return fallbackGetVideosBefore(refRecordedAt, limit)
    }
    throw new Error(error.message)
  }
  return (data ?? []) as FeedItem[]
}
