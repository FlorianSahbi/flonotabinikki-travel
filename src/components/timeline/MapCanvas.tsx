// src/components/timeline/MapCanvas.tsx
'use client'

import { useEffect, useCallback } from 'react'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useMapCtx } from '@/app/context/map/context'

type Props = {
  accessToken: string
  visible?: boolean
  style?: string
  initialView?: import('@/lib/mapbox/utils').View
  interactive?: boolean
}

export function MapCanvas({
  accessToken,
  visible = true,
  style,
  initialView,
  interactive = false,
}: Props) {
  const { __setStatus, __setCameraFns } = useMapCtx()

  const onReady = useCallback(() => {
    __setStatus('ready')
  }, [__setStatus])

  const opts: Parameters<typeof useMapbox>[0] = { accessToken, onReady }
  if (style !== undefined) opts.style = style
  if (initialView !== undefined) opts.initialView = initialView
  if (interactive !== undefined) opts.interactive = interactive

  const { containerRef, api } = useMapbox(opts)

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

  useEffect(() => {
    const map = api.getMap()
    if (!map) return

    const onLoad = () => __setStatus('ready')
    const onIdle = () => __setStatus('idle')

    try {
      if (map.loaded?.()) {
        const tilesOk =
          typeof map.areTilesLoaded === 'function'
            ? map.areTilesLoaded()
            : false
        __setStatus(tilesOk ? 'idle' : 'ready')
      }
    } catch {
      /* no-op */
    }

    map.once?.('load', onLoad)
    map.on?.('idle', onIdle)

    return () => {
      map.off?.('idle', onIdle)
      map.off?.('load', onLoad)
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
