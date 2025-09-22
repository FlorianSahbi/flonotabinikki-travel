'use client'

import { useEffect } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useAttachMapContext } from '@/lib/mapbox/useAttachMapContext'
import VideosPointsLayer from '@/components/map-layers/VideosPointsLayer'
import { easeToPreset } from '@/lib/mapbox/applyPreset'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function FeedMap({
  data,
  activeId,
  center,
  className,
}: {
  data: FeatureCollection<Point, { id: string }>
  activeId?: string | null
  center: [number, number]
  className?: string
}) {
  const { containerRef, api } = useMapbox({
    accessToken: TOKEN,
    interactive: false,
  })
  useAttachMapContext(api)

  useEffect(() => {
    const [lng, lat] = center || [0, 0]
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    easeToPreset(api as any, [lng, lat], 'feed', 350)
  }, [center, api])

  return (
    <div
      className={`h-32 w-32 rounded-xl overflow-hidden relative ${className ?? ''}`}
      aria-label="Mini-map"
    >
      <div ref={containerRef} className="absolute inset-0" />
      <VideosPointsLayer
        getMap={api.getMap}
        data={data}
        activeId={activeId ?? null}
        sourceId="videos-feed"
        layerId="videos-points-feed"
        radius={6}
        strokeWidth={1}
      />
    </div>
  )
}
