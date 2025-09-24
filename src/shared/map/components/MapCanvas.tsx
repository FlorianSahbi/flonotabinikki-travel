// @path: src/shared/map/components/MapCanvas.tsx
'use client'

import { useEffect } from 'react'
import { useMapCtx } from '@/shared/map/context/MapContext'
import { useMapbox } from '../hooks/useMapbox'

type Props = { accessToken: string; visible?: boolean }

export default function MapCanvas({ accessToken, visible = true }: Props) {
  const { __setStatus, __setCameraFns } = useMapCtx()
  const { containerRef, api } = useMapbox({ accessToken })

  useEffect(() => {
    __setCameraFns({ flyTo: api.flyTo, easeTo: api.easeTo, jumpTo: api.jumpTo })
    return () => {
      __setCameraFns({ flyTo: () => {}, easeTo: () => {}, jumpTo: () => {} })
    }
  }, [api.flyTo, api.easeTo, api.jumpTo, __setCameraFns])

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
        requestAnimationFrame(attachWhenReady)
        return
      }
      attached = true

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
