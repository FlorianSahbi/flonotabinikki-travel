// src/components/timeline/MapCanvas.tsx
'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { useMapbox, type MapAPI } from '@/lib/mapbox/useMapbox'
import type { View } from '@/lib/mapbox/utils'

export type MapCanvasHandle = MapAPI

type Props = {
  accessToken: string
  style?: string
  visible: boolean
  className?: string
  onReady?: () => void
  initialView?: View
}

const MapCanvas = forwardRef<MapCanvasHandle, Props>(function MapCanvas(
  { accessToken, style, visible, className = '', onReady, initialView },
  ref
) {
  const { containerRef, api } = useMapbox({
    accessToken,
    ...(style !== undefined ? { style } : {}),
    ...(initialView !== undefined ? { initialView } : {}),
    ...(onReady !== undefined ? { onReady } : {}),
  })

  useImperativeHandle(ref, () => api, [api])

  return (
    <div
      className={`fixed inset-0 -z-10 pointer-events-none transition-opacity duration-500 ${className}`}
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  )
})

export default MapCanvas
