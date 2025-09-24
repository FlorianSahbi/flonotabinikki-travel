// src/components/explore/ExploreMap.tsx
'use client'

import { useEffect, useMemo } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useAttachMapContext } from '@/lib/mapbox/useAttachMapContext'
import VideosPointsLayer from '@/components/map-layers/VideosPointsLayer'
import { useExploreStore } from '@/lib/state/useExploreStore'

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

  const setViewport = useExploreStore((s) => s.setViewport)
  const storedViewport = useExploreStore((s) => s.viewport)

  const featureById = useMemo(() => {
    const map = new Map<string, { lng: number; lat: number }>()
    for (const f of data.features) {
      if (f.properties?.id && f.geometry?.type === 'Point') {
        const [lng, lat] = f.geometry.coordinates
        map.set(String(f.properties.id), { lng: Number(lng), lat: Number(lat) })
      }
    }
    return map
  }, [data])

  useEffect(() => {
    const m = api.getMap()
    if (!m) return

    const save = () => {
      try {
        const c = m.getCenter()
        setViewport({
          center: [c.lng, c.lat],
          zoom: m.getZoom(),
          pitch: m.getPitch(),
          bearing: m.getBearing(),
        })
      } catch {}
    }

    m.on('moveend', save)
    m.on('zoomend', save)
    m.on('rotateend', save)
    m.on('pitchend', save)

    return () => {
      try {
        m.off('moveend', save)
        m.off('zoomend', save)
        m.off('rotateend', save)
        m.off('pitchend', save)
      } catch {}
    }
  }, [api, setViewport])

  useEffect(() => {
    const m = api.getMap()
    if (!m) return

    const apply = () => {
      try {
        if (storedViewport) {
          m.jumpTo(storedViewport as any)
        }
        if (activeId && featureById.has(activeId)) {
          const { lng, lat } = featureById.get(activeId)!
          const z = storedViewport?.zoom ?? m.getZoom()
          const b = storedViewport?.bearing ?? m.getBearing()
          const p = storedViewport?.pitch ?? m.getPitch()
          m.easeTo({
            center: [lng, lat],
            zoom: z,
            bearing: b,
            pitch: p,
            duration: 400,
            essential: true,
          })
        }
      } catch {}
    }

    if (typeof m.loaded === 'function' && m.loaded()) {
      apply()
    } else {
      m.once('load', apply)
    }
  }, [api, storedViewport, activeId, featureById])

  return (
    <div className={className ?? 'h-full w-full relative'}>
      <div ref={containerRef} className="absolute inset-0" />
      <VideosPointsLayer
        getMap={api.getMap}
        data={data}
        activeId={activeId ?? null}
        onClick={(id, [lng, lat]) => {
          onSelectId?.(id)
          const m = api.getMap()
          try {
            m?.easeTo({
              center: [lng, lat],
              bearing: 0,
              pitch: 50,
              duration: 400,
              essential: true,
            })
          } catch {}
        }}
        radius={5}
        strokeWidth={1}
      />
    </div>
  )
}
