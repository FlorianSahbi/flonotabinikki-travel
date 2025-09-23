// src/components/explore/ExploreMap.tsx
'use client'

import type { FeatureCollection, Point } from 'geojson'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useAttachMapContext } from '@/lib/mapbox/useAttachMapContext' // ⬅️ (re)import
import VideosPointsLayer from '@/components/map-layers/VideosPointsLayer'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function ExploreMap({
  data,
  activeId,
  onSelectId,
  className,
}: {
  data: FeatureCollection<Point, { id: string }>
  activeId?: string | null
  onSelectId?: (id: string) => void
  className?: string
}) {
  const { containerRef, api } = useMapbox({
    accessToken: TOKEN,
    interactive: true,
  })
  useAttachMapContext(api)

  return (
    <div className={className ?? 'h-full w-full relative'}>
      <div ref={containerRef} className="absolute inset-0" />
      <VideosPointsLayer
        getMap={api.getMap}
        data={data}
        activeId={activeId ?? null}
        onClick={(id, [lng, lat]) => {
          onSelectId?.(id)
          api.easeTo(
            { center: [lng, lat], bearing: 0, pitch: 50 },
            { duration: 400 }
          )
        }}
        radius={5}
        strokeWidth={1}
      />
    </div>
  )
}
