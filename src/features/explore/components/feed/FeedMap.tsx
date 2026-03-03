// @path: src/features/explore/components/feed/FeedMap.tsx
'use client'

import { useEffect } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import { useAttachMapContext } from '@/shared/map/hooks/useAttachMapContext'
import VideosPointsLayer from '@/shared/map/layers/VideosPointsLayer'
import { easeToPreset } from '@/shared/map/utils/applyPreset'
import { useExploreStore } from '@/features/explore/useExploreStore'
import { useMapbox } from '@/shared/map/hooks/useMapbox'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function FeedMap({
  data,
  activeId,
  center,
  className,
}: {
  data: FeatureCollection<Point, { id: string; kind?: 'video' | 'cluster' }>
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
    const [lng, lat] = center || [NaN, NaN]
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

    const m = api.getMap()
    const doEase = () => {
      try {
        easeToPreset(api as any, [lng, lat], 'feed', 250)
      } catch {}
    }

    if (m) {
      doEase()
      if (typeof m.loaded === 'function' && !m.loaded()) {
        const onLoad = () => doEase()
        m.once('load', onLoad)
      }
    } else {
      const mm = api.getMap()
      if (mm && typeof mm.once === 'function') {
        const onLoad = () => doEase()
        mm.once('load', onLoad)
      }
    }
  }, [api, center])

  useEffect(() => {
    const m = api.getMap()
    if (!m) return

    const ensureLayer = () => {
      if (!m.getSource('videos-feed')) return

      if (!m.getLayer('videos-points-feed--active')) {
        try {
          m.addLayer({
            id: 'videos-points-feed--active',
            type: 'circle',
            source: 'videos-feed',
            filter: ['==', ['get', 'id'], '__none__'],
            paint: {
              'circle-radius': 8,
              'circle-color': '#3b82f6',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
              'circle-opacity': 1,
            },
          })
        } catch {}
      }

      try {
        m.setFilter('videos-points-feed--active', [
          '==',
          ['get', 'id'],
          activeId ?? '__none__',
        ])
      } catch {}

      try {
        m.moveLayer('videos-points-feed--active')
      } catch {}
    }

    const onStyleData = () => ensureLayer()

    if (typeof m.loaded === 'function' && m.loaded()) {
      ensureLayer()
    } else {
      m.once('load', ensureLayer)
    }
    m.on('styledata', onStyleData)

    return () => {
      try {
        m.off('styledata', onStyleData)
      } catch {}
    }
  }, [api, activeId])

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

      <button
        onClick={() => setViewMode('map')}
        className="mt-2 rounded border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-neutral-900/80"
      >
        ← Carte
      </button>
    </div>
  )
}
