// @path: src/app/[lang]/explore/[[...id]]/page.tsx
import ExploreShellClient from '@/features/explore/ExploreShellClient'
import { supabase } from '@/shared/lib/supabaseClient'
import type { FeedItem } from '@/features/feed'

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ lang: string; id?: string[] }>
}) {
  const { id } = await params
  const initialFocusId = id?.[0] ?? null

  const { data: videosWithCoordinates } = await supabase
    .from('videos')
    .select('id, lat, lng')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  const videos = (videosWithCoordinates ?? []) as {
    id: string
    lat: number
    lng: number
  }[]

  const videosGeoJSON = {
    type: 'FeatureCollection' as const,
    features: videos.map((p) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [Number(p.lng), Number(p.lat)],
      },
      properties: { id: p.id as string },
    })),
  }

  let contextItems: FeedItem[] = []
  if (initialFocusId) {
    const { data = [] } = await supabase.rpc('feed_get_context_items', {
      target_id: initialFocusId,
      range_size: 3,
    })
    contextItems = data as FeedItem[]
  }

  return (
    <div className="h-dvh w-screen bg-black">
      <ExploreShellClient
        points={videos}
        videosGeoJSON={videosGeoJSON}
        initialFocusId={initialFocusId}
        initialContextItems={contextItems}
      />
    </div>
  )
}
