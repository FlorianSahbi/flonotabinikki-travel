import { supabase } from '@/lib/supabaseClient'
import StoriesFeed from '@/components/stories/StoriesFeed'
import DesktopRedirect from '@/components/stories/DesktopRedirect'
import { FeedItem } from '@/lib/feed'

export default async function StoriesPage({
  params,
}: {
  params: { id: string; lang: string }
}) {
  const storyId = params.id
  const lang = params.lang

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
    <div className="h-dvh w-screen bg-black">
      {/* Desktop (≥ md): on ne reste PAS sur /stories; on redirige vers /explore */}
      <div className="hidden md:block h-full w-full">
        <DesktopRedirect focusId={storyId} lang={lang} />
      </div>

      {/* Mobile (< md): on affiche bien la page /stories */}
      <div className="md:hidden h-full w-full">
        <StoriesFeed
          initialId={storyId}
          initialItems={contextItems as FeedItem[]}
        />
      </div>
    </div>
  )
}
