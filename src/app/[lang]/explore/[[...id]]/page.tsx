// @path: src/app/[lang]/explore/[[...id]]/page.tsx
import ExploreShellClient from '@/features/explore/ExploreShellClient'
import { supabase } from '@/shared/lib/supabaseClient'
import type { FeedItem } from '@/features/feed'
import type { FeatureCollection, Point } from 'geojson'

type MapPoint = {
  id: string
  lat: number
  lng: number
  kind: 'video' | 'cluster'
}

export default async function ExplorePage({
  params,
}: {
  params: Promise<{ lang: string; id?: string[] }>
}) {
  const { id } = await params
  const initialFocusId = id?.[0] ?? null

  // v2: on lit la vue "map_points_simple" (clusters + vidéos sans cluster)
  const { data: points } = await supabase
    .from('map_points_simple')
    .select('id, lat, lng, kind')

  const items = (points ?? []) as MapPoint[]

  // Pour le composant ExploreShellClient, on garde le shape minimal (id,lat,lng)
  const plainPoints = items.map((p) => ({
    id: p.id,
    lat: Number(p.lat),
    lng: Number(p.lng),
  }))

  // GeoJSON avec "kind" en propriété (pour styliser différemment si tu veux)
  const videosGeoJSON: FeatureCollection<
    Point,
    { id: string; kind: 'video' | 'cluster' }
  > = {
    type: 'FeatureCollection',
    features: items.map((p) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [Number(p.lng), Number(p.lat)],
      },
      properties: { id: p.id, kind: p.kind },
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
        points={plainPoints}
        videosGeoJSON={videosGeoJSON}
        initialFocusId={initialFocusId}
        initialContextItems={contextItems}
      />
    </div>
  )
}
