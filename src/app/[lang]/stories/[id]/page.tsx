import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'
import type { Tables } from '@/types/supabase'

type VideoLite = Pick<
  Tables<'videos'>,
  'id' | 'bucket_url' | 'recorded_at' | 'lat' | 'lng' | 'position'
>

async function getContextVideos(id: string): Promise<VideoLite[]> {
  const { data, error } = await supabase.rpc('get_context_videos', {
    target_id: id,
    range_size: 3, // -3..+3 => 7 vidéos
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as VideoLite[]
}

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const initialVideos = await getContextVideos(id)

  if (!initialVideos.length) {
    return <div className="p-6 text-white">Aucune vidéo</div>
  }

  return <StoriesFeed initialId={id} initialVideos={initialVideos} />
}
