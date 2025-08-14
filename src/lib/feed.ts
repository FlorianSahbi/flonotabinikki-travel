import { supabase } from '@/lib/supabaseClient'

// Type harmonisé pour tout le feed
export type FeedItem = {
  id: string
  lat: number
  lng: number
  kind: 'cluster' | 'video'
  title: string | null
  preview: string | null
  position: number
  bucket_url: string | null
  description: string | null
  recorded_at: string
}

// Fallback helpers si les RPC "new" ne sont pas encore présents.
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
    lat: v.lat ?? 0,
    lng: v.lng ?? 0,
    position: v.position ?? 0,
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
    lat: v.lat ?? 0,
    lng: v.lng ?? 0,
    position: v.position ?? 0,
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
    lat: v.lat ?? 0,
    lng: v.lng ?? 0,
    position: v.position ?? 0,
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
  const params: { ref_time: string; lim: number; skip_cluster_id?: string } = {
    ref_time: refRecordedAt,
    lim: limit,
  }
  if (skipClusterId) {
    params.skip_cluster_id = skipClusterId
  }

  const { data, error } = await supabase.rpc('feed_get_items_after', params)
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
  const params: { ref_time: string; lim: number; skip_cluster_id?: string } = {
    ref_time: refRecordedAt,
    lim: limit,
  }
  if (skipClusterId) {
    params.skip_cluster_id = skipClusterId
  }

  const { data, error } = await supabase.rpc('feed_get_items_before', params)
  if (error) {
    if (String(error.message || '').includes('Could not find the function')) {
      return fallbackGetVideosBefore(refRecordedAt, limit)
    }
    throw new Error(error.message)
  }
  return (data ?? []) as FeedItem[]
}
