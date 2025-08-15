import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'
import { FeedItem } from '@/lib/feed'

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const { id } = await params

  const { data, error } = await supabase.rpc('feed_get_context_items', {
    target_id: id,
    range_size: 3,
  })

  if (error) {
    console.error('Supabase error fetching cluster:', error)
    return (
      <div className="p-6 text-white">
        Erreur lors du chargement des stories.
      </div>
    )
  }
  if (!data) return <div className="p-6 text-white">Feed introuvable.</div>

  return <StoriesFeed initialId={id} initialItems={data as FeedItem[]} />
}
