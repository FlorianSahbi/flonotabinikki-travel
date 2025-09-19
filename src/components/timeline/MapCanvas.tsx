// src/components/timeline/MapCanvas.tsx
'use client'

import { useEffect, useCallback } from 'react'
import { useMapbox } from '@/lib/mapbox/useMapbox'
import { useTimelineShell } from '@/app/context/timeline/context'

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
  const { __setMapStatus, __setCameraFns } = useTimelineShell()

  const onReady = useCallback(() => {
    __setMapStatus('ready')
  }, [__setMapStatus])

  const mapboxOpts = {
    accessToken,
    interactive,
    onReady,
    ...(style !== undefined ? { style } : {}),
    ...(initialView !== undefined ? { initialView } : {}),
  }

  const { containerRef, api } = useMapbox(
    mapboxOpts as Parameters<typeof useMapbox>[0]
  )

  useEffect(() => {
    __setMapStatus('loading')
    __setCameraFns({
      flyTo: api.flyTo,
      easeTo: api.easeTo,
      jumpTo: api.jumpTo,
    })

    const map = api.getMap()
    const onIdle = () => __setMapStatus('idle')
    map?.on?.('idle', onIdle)

    return () => {
      map?.off?.('idle', onIdle)
      __setMapStatus('loading')
      __setCameraFns({ flyTo: () => {}, easeTo: () => {}, jumpTo: () => {} })
    }
  }, [api, __setMapStatus, __setCameraFns])

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
