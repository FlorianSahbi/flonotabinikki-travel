'use client'

import { useEffect } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useAttachMapContext } from '@/lib/mapbox/useAttachMapContext'
import VideosPointsLayer from '@/components/map-layers/VideosPointsLayer'
import { easeToPreset } from '@/lib/mapbox/applyPreset'
import { useExploreStore } from '@/lib/state/useExploreStore'

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

  const setViewMode = useExploreStore((s) => s.setViewMode)

  useEffect(() => {
    const [lng, lat] = center || [0, 0]
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    easeToPreset(api as any, [lng, lat], 'feed', 350)
  }, [center, api])

  return (
    <div
      className={`relative flex w-32 flex-col items-center ${className ?? ''}`}
      aria-label="Mini-map"
    >
      <div className="relative h-32 w-32 overflow-hidden rounded-xl">
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

      {/* bouton SOUS la map */}
      <button
        onClick={() => setViewMode('map')}
        className="mt-2 rounded border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-neutral-900/80"
      >
        ← Carte
      </button>
    </div>
  )
}
