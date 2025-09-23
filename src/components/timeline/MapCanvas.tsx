// src/components/timeline/MapCanvas.tsx
'use client'

import { useEffect } from 'react'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useMapCtx } from '@/app/context/map/context'

/**
 * Minimal Map container (status driven here).
 * - Style/initial state come from Studio.
 * - Non-interactive; camera is controlled by context.
 * - Single source of truth for map status via Mapbox 'load'/'idle'.
 */
type Props = {
  accessToken: string
  visible?: boolean
}

export default function MapCanvas({ accessToken, visible = true }: Props) {
  const { __setStatus, __setCameraFns } = useMapCtx()

  // Instantiate map (hook only creates the map and exposes camera helpers)
  const { containerRef, api } = useMapbox({ accessToken })

  // Expose camera helpers to MapContext
  useEffect(() => {
    __setCameraFns({
      flyTo: api.flyTo,
      easeTo: api.easeTo,
      jumpTo: api.jumpTo,
    })
    return () => {
      __setCameraFns({
        flyTo: () => {},
        easeTo: () => {},
        jumpTo: () => {},
      })
    }
  }, [api.flyTo, api.easeTo, api.jumpTo, __setCameraFns])

  // Drive status: loading -> ready -> idle
  useEffect(() => {
    __setStatus('loading')

    let disposed = false
    let attached = false

    const onLoad = () => __setStatus('ready')
    const onIdle = () => __setStatus('idle')

    function attachWhenReady() {
      if (disposed) return
      const map = api.getMap()
      if (!map) {
        // map not created yet (async import) → try next frame
        requestAnimationFrame(attachWhenReady)
        return
      }

      attached = true

      // If already loaded (fast refresh / cache warm), derive a consistent state immediately.
      const hasLoaded = typeof (map as any).loaded === 'function'
      const hasTiles = typeof (map as any).areTilesLoaded === 'function'
      if (hasLoaded && (map as any).loaded()) {
        const tilesOk = hasTiles ? (map as any).areTilesLoaded() : false
        __setStatus(tilesOk ? 'idle' : 'ready')
      }

      map.on('load', onLoad)
      map.on('idle', onIdle)
    }

    attachWhenReady()

    return () => {
      disposed = true
      const map = api.getMap()
      if (attached && map) {
        map.off('load', onLoad)
        map.off('idle', onIdle)
      }
    }
  }, [api, __setStatus])

  return (
    <div
      ref={containerRef}
      style={{
        display: visible ? 'block' : 'none',
        position: 'fixed',
        inset: 0,
      }}
      aria-hidden={!visible}
    />
  )
}
