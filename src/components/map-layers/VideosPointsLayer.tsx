'use client'

import { useEffect } from 'react'
import type { FeatureCollection, Point } from 'geojson'

const ORANGE = '#FF5722'
const BLUE = '#3B82F6'

export default function VideosPointsLayer({
  getMap,
  data,
  activeId,
  onClick,
  sourceId = 'videos',
  layerId = 'videos-points',
  radius = 5,
  strokeWidth = 1,
  waitMs = 2000,
  pollEveryMs = 50,
}: {
  getMap: () => any | null
  data: FeatureCollection<Point, { id: string }>
  activeId?: string | null
  onClick?: (id: string, lngLat: [number, number]) => void
  sourceId?: string
  layerId?: string
  radius?: number
  strokeWidth?: number
  waitMs?: number
  pollEveryMs?: number
}) {
  useEffect(() => {
    let removeClick: (() => void) | null = null
    let interval: number | null = null
    let timeout: number | null = null
    let mounted = true

    const addNow = (map: any) => {
      if (!mounted) return

      const src = map.getSource(sourceId) as any
      if (!src) map.addSource(sourceId, { type: 'geojson', data })
      else
        try {
          src.setData(data)
        } catch {}

      if (!map.getLayer(layerId)) {
        try {
          map.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': radius,
              'circle-stroke-width': strokeWidth,
              'circle-stroke-color': '#fff',
              'circle-opacity': 0.95,
              'circle-color': ORANGE,
            },
          })
        } catch {}
      } else {
        try {
          map.setPaintProperty(layerId, 'circle-radius', radius)
          map.setPaintProperty(layerId, 'circle-stroke-width', strokeWidth)
          map.setPaintProperty(layerId, 'circle-stroke-color', '#fff')
          map.setPaintProperty(layerId, 'circle-opacity', 0.95)
        } catch {}
      }

      if (onClick) {
        const handler = (e: any) => {
          const f = e.features?.[0]
          const id = f?.properties?.id as string | undefined
          if (!id) return
          const [lng, lat] = f.geometry.coordinates
          onClick(id, [lng, lat])
        }
        map.on('click', layerId, handler)
        map.on(
          'mouseenter',
          layerId,
          () => (map.getCanvas().style.cursor = 'pointer')
        )
        map.on('mouseleave', layerId, () => (map.getCanvas().style.cursor = ''))
        removeClick = () => {
          map.off('click', layerId, handler)
          map.off('mouseenter', layerId, () => {})
          map.off('mouseleave', layerId, () => {})
        }
      }
    }

    const tryAdd = () => {
      const map = getMap()
      if (!map) return
      if (map.isStyleLoaded?.()) addNow(map)
      else map.once?.('load', () => addNow(map))
      if (interval !== null) {
        clearInterval(interval)
        interval = null
      }
      if (timeout !== null) {
        clearTimeout(timeout)
        timeout = null
      }
    }

    tryAdd()
    interval = window.setInterval(tryAdd, Math.max(10, pollEveryMs))
    timeout = window.setTimeout(
      () => {
        if (interval !== null) {
          clearInterval(interval)
          interval = null
        }
      },
      Math.max(pollEveryMs, waitMs)
    )

    return () => {
      mounted = false
      if (interval !== null) clearInterval(interval)
      if (timeout !== null) clearTimeout(timeout)
      if (removeClick) removeClick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getMap, sourceId, layerId, radius, strokeWidth, onClick])

  useEffect(() => {
    const map = getMap()
    if (!map) return
    const src = map.getSource(sourceId) as any
    if (src?.setData) {
      try {
        src.setData(data)
      } catch {}
    }
  }, [getMap, sourceId, data])

  useEffect(() => {
    const map = getMap()
    if (!map) return
    const expr: any = [
      'case',
      ['==', ['get', 'id'], activeId ?? '__none__'],
      BLUE,
      ORANGE,
    ]
    try {
      map.setPaintProperty(layerId, 'circle-color', expr)
    } catch {}
  }, [getMap, activeId, layerId])

  return null
}
