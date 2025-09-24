// @path: src/shared/map/layers/VideosPointsLayer.tsx
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
}: {
  getMap: () => any | null
  data: FeatureCollection<Point, { id: string }>
  activeId?: string | null
  onClick?: (id: string, lngLat: [number, number]) => void
  sourceId?: string
  layerId?: string
  radius?: number
  strokeWidth?: number
}) {
  const ensureBaseSourceAndLayer = (map: any) => {
    const src = map.getSource(sourceId) as any
    if (!src) {
      map.addSource(sourceId, { type: 'geojson', data })
    } else {
      try {
        src.setData(data)
      } catch {}
    }

    if (!map.getLayer(layerId)) {
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
    } else {
      try {
        map.setPaintProperty(layerId, 'circle-radius', radius)
        map.setPaintProperty(layerId, 'circle-stroke-width', strokeWidth)
        map.setPaintProperty(layerId, 'circle-stroke-color', '#fff')
        map.setPaintProperty(layerId, 'circle-opacity', 0.95)
      } catch {}
    }

    try {
      map.triggerRepaint?.()
      map.resize?.()
      requestAnimationFrame(() => map.resize?.())
    } catch {}
  }

  useEffect(() => {
    let disposed = false
    let cancelRaf: number | null = null
    let offLoad: (() => void) | null = null

    const waitForMap = () => {
      const map = getMap()
      if (!map) {
        cancelRaf = requestAnimationFrame(waitForMap)
        return
      }

      const init = () => {
        if (!disposed) ensureBaseSourceAndLayer(map)
      }

      if (map.isStyleLoaded?.()) init()
      else {
        const onLoad = () => init()
        map.once?.('load', onLoad)
        offLoad = () => {
          try {
            map.off?.('load', onLoad)
          } catch {}
        }
      }

      const onStyleData = () => {
        if (!disposed) ensureBaseSourceAndLayer(map)
      }
      map.on('styledata', onStyleData)

      return () => {
        try {
          map.off('styledata', onStyleData)
        } catch {}
        if (offLoad) offLoad()
      }
    }

    const cleanup = waitForMap()

    return () => {
      disposed = true
      if (cancelRaf !== null) cancelAnimationFrame(cancelRaf)
      if (cleanup) cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getMap, sourceId, layerId, radius, strokeWidth, data])

  useEffect(() => {
    let cancelRaf: number | null = null
    let removeStyleListener: (() => void) | null = null
    const activeLayerId = `${layerId}--active`

    const ensureActiveLayer = () => {
      const map = getMap()
      if (!map) {
        cancelRaf = requestAnimationFrame(ensureActiveLayer)
        return
      }
      if (!map.getSource(sourceId)) {
        cancelRaf = requestAnimationFrame(ensureActiveLayer)
        return
      }

      if (!map.getLayer(activeLayerId)) {
        try {
          map.addLayer({
            id: activeLayerId,
            type: 'circle',
            source: sourceId,
            filter: ['==', ['get', 'id'], '__none__'],
            paint: {
              'circle-radius': Math.max(radius + 2, radius * 1.4),
              'circle-color': BLUE,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': Math.max(strokeWidth + 1, 2),
              'circle-opacity': 1,
            },
          })
        } catch {}
      }

      try {
        map.setFilter(activeLayerId, [
          '==',
          ['get', 'id'],
          activeId ?? '__none__',
        ])
      } catch {}

      try {
        map.moveLayer(activeLayerId)
      } catch {}

      const onStyleData = () => {
        try {
          if (!map.getLayer(activeLayerId)) return ensureActiveLayer()
          map.setFilter(activeLayerId, [
            '==',
            ['get', 'id'],
            activeId ?? '__none__',
          ])
          map.moveLayer(activeLayerId)
        } catch {}
      }
      map.on('styledata', onStyleData)
      removeStyleListener = () => {
        try {
          map.off('styledata', onStyleData)
        } catch {}
      }
    }

    ensureActiveLayer()

    return () => {
      if (cancelRaf !== null) cancelAnimationFrame(cancelRaf)
      if (removeStyleListener) removeStyleListener()
    }
  }, [getMap, sourceId, layerId, activeId, radius, strokeWidth])

  useEffect(() => {
    let cancelRaf: number | null = null
    const tick = () => {
      const map = getMap()
      if (!map) {
        cancelRaf = requestAnimationFrame(tick)
        return
      }
      const src = map.getSource(sourceId) as any
      if (src?.setData) {
        try {
          src.setData(data)
          map.triggerRepaint?.()
        } catch {}
      }
    }
    tick()
    return () => {
      if (cancelRaf !== null) cancelAnimationFrame(cancelRaf)
    }
  }, [getMap, sourceId, data])

  useEffect(() => {
    if (!onClick) return
    let cancelRaf: number | null = null
    let remove: (() => void) | null = null

    const arm = () => {
      const map = getMap()
      if (!map) {
        cancelRaf = requestAnimationFrame(arm)
        return
      }

      const handleClick = (e: any) => {
        try {
          const feats = map.queryRenderedFeatures(e.point, {
            layers: [layerId],
          })
          const f = feats && feats[0]
          const id = f?.properties?.id as string | undefined
          if (!id) return
          const [lng, lat] = f.geometry.coordinates
          try {
            map.getCanvas().style.cursor = ''
          } catch {}
          onClick(id, [lng, lat])
        } catch {}
      }

      const handleMove = (e: any) => {
        try {
          const feats = map.queryRenderedFeatures(e.point, {
            layers: [layerId],
          })
          const hasHit = feats && feats.length > 0
          map.getCanvas().style.cursor = hasHit ? 'pointer' : ''
        } catch {}
      }

      map.on('click', handleClick)
      map.on('mousemove', handleMove)
      remove = () => {
        try {
          map.off('click', handleClick)
        } catch {}
        try {
          map.off('mousemove', handleMove)
        } catch {}
        try {
          map.getCanvas().style.cursor = ''
        } catch {}
      }
    }

    arm()
    return () => {
      if (cancelRaf !== null) cancelAnimationFrame(cancelRaf)
      if (remove) remove()
    }
  }, [getMap, layerId, onClick])

  useEffect(() => {
    let cancelRaf: number | null = null
    const tick = () => {
      const map = getMap()
      if (!map) {
        cancelRaf = requestAnimationFrame(tick)
        return
      }
      const expr: any = [
        'case',
        ['==', ['get', 'id'], activeId ?? '__none__'],
        ORANGE,
        ORANGE,
      ]
      try {
        map.setPaintProperty(layerId, 'circle-color', expr)
      } catch {}
    }
    tick()
    return () => {
      if (cancelRaf !== null) cancelAnimationFrame(cancelRaf)
    }
  }, [getMap, activeId, layerId])

  return null
}
