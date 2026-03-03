// @path: src/features/explore/ExploreMap.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import VideosPointsLayer from '@/shared/map/layers/VideosPointsLayer'
import { useMapbox, View } from '@/shared/map/hooks/useMapbox'
import { useAttachMapContext } from '@/shared/map/hooks/useAttachMapContext'

type Props = {
  accessToken?: string
  data: FeatureCollection<Point, { id: string; kind?: 'video' | 'cluster' }>
  activeId?: string | null
  onPointClick?: (
    id: string,
    lngLat: [number, number],
    kind?: 'video' | 'cluster'
  ) => void
  onSelectId?: (
    id: string,
    meta?: { kind?: 'video' | 'cluster'; lngLat?: [number, number] }
  ) => void | Promise<void>
  onReady?: (api: { getMap: () => any | null }) => void
  className?: string
}

export default function ExploreMap({
  accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string,
  data,
  activeId,
  onPointClick,
  onSelectId,
  onReady,
  className = '',
}: Props) {
  const { containerRef, api } = useMapbox({ accessToken, interactive: true })

  // Connect map to MapContext so StoriesFeed can control camera
  useAttachMapContext(api)

  const storedViewportRef = useRef<Partial<View> | null>(null)

  useEffect(() => {
    onReady?.({ getMap: api.getMap })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = (
    id: string,
    lngLat: [number, number],
    kind?: 'video' | 'cluster'
  ) => {
    onPointClick?.(id, lngLat, kind)
    onSelectId?.(id, kind ? { kind, lngLat } : { lngLat })

    const m = api.getMap()
    if (m) {
      try {
        const c = m.getCenter?.()
        const z = m.getZoom?.()
        const b = m.getBearing?.()
        const p = m.getPitch?.()

        storedViewportRef.current = {
          ...(c ? { center: [c.lng, c.lat] as [number, number] } : {}),
          ...(typeof z === 'number' ? { zoom: z } : {}),
          ...(typeof b === 'number' ? { bearing: b } : {}),
          ...(typeof p === 'number' ? { pitch: p } : {}),
        }
      } catch {
        /* no-op */
      }
    }

    // ⚠️ Pas de zoom/easeTo ici : tu as demandé de ne pas bouger la caméra au clic.
  }

  return (
    <div className={['relative h-full w-full', className].join(' ')}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-label="Explore map"
      />
      <VideosPointsLayer
        getMap={api.getMap}
        data={data}
        {...(activeId != null ? { activeId } : {})}
        onClick={handleClick}
        radius={5}
        strokeWidth={1}
      />
    </div>
  )
}
