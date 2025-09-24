// @path: src/features/explore/ExploreMap.tsx
'use client'

import { useRef } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import { CAM_PRESET } from '@/shared/map/utils/cameraPresets'
import VideosPointsLayer from '@/shared/map/layers/VideosPointsLayer'
import { useMapbox, View } from '@/shared/map/hooks/useMapbox'

type Props = {
  accessToken?: string
  data: FeatureCollection<Point, { id: string }>
  activeId?: string | null
  onPointClick?: (id: string, lngLat: [number, number]) => void
  onSelectId?: (id: string) => void | Promise<void>
  className?: string
}

export default function ExploreMap({
  accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string,
  data,
  activeId,
  onPointClick,
  onSelectId,
  className = '',
}: Props) {
  const { containerRef, api } = useMapbox({ accessToken, interactive: true })

  const storedViewportRef = useRef<Partial<View> | null>(null)

  const handleClick = (id: string, lngLat: [number, number]) => {
    onPointClick?.(id, lngLat)
    onSelectId?.(id)

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

    api.easeTo(
      {
        center: [lngLat[0], lngLat[1]],
        zoom: CAM_PRESET.detail.zoom,
        pitch: CAM_PRESET.detail.pitch,
        bearing: CAM_PRESET.detail.bearing,
      },
      { duration: 700 }
    )
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
