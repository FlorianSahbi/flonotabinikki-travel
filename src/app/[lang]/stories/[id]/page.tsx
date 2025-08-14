import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'
import type { FeedItem } from '@/lib/feed'

async function getContextItems(id: string): Promise<FeedItem[]> {
  // On tente le RPC "new". Si absent, on mappe via l'ancien RPC côté front (fallback dans lib/feed si tu préfères).
  const { data, error } = await supabase.rpc('feed_get_context_items', {
    target_id: id,
    range_size: 3,
  })
  if (error) {
    // fallback minimal: appelle l'ancien RPC et mappe en items "video"
    if (String(error.message || '').includes('Could not find the function')) {
      const { data: legacy, error: legacyErr } = await supabase.rpc(
        'get_context_videos',
        {
          target_id: id,
          range_size: 3,
        }
      )
      if (legacyErr) throw new Error(legacyErr.message)
      const arr = (legacy ?? []) as Array<{
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
    throw new Error(error.message)
  }
  return (data ?? []) as FeedItem[]
}

export default async function StoriesPage({
  params,
}: {
  params: { id: string; lang: string }
}) {
  const { id } = params
  const initialItems = await getContextItems(id)
  if (!initialItems.length)
    return <div className="p-6 text-white">Aucune vidéo</div>
  return <StoriesFeed initialId={id} initialItems={initialItems} />
}
