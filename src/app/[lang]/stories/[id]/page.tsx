// src/app/[lang]/stories/[id]/page.tsx
import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'
import { FeedItem } from '@/lib/feed'

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>
}) {
  const { id: storyId } = await params

  const { data: contextItems, error } = await supabase.rpc(
    'feed_get_context_items',
    { target_id: storyId, range_size: 3 }
  )

  if (error) {
    console.error('[supabase] feed_get_context_items:', error)
    return <div className="p-6 text-white">Error loading stories.</div>
  }
  if (!contextItems) {
    return <div className="p-6 text-white">Feed not found.</div>
  }

  return (
    <StoriesFeed
      initialId={storyId}
      initialItems={contextItems as FeedItem[]}
    />
  )
}
