import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/types/supabase'

export type FeedItem =
  Database['public']['Functions']['feed_get_context_items']['Returns'][0]

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
    throw new Error(error.message)
  }

  return (data ?? []) as FeedItem[]
}
