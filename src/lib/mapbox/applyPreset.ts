// src/lib/mapbox/applyPreset.ts
'use client'

import { CAM_PRESET } from './cameraPresets'

type CtxLike = {
  easeTo: (view: any, opts?: { duration?: number }) => void
}

export function easeToPreset(
  ctx: CtxLike,
  center: [number, number],
  preset: keyof typeof CAM_PRESET,
  duration = 400
) {
  const p = CAM_PRESET[preset]
  ctx.easeTo(
    { center, zoom: p.zoom, pitch: p.pitch, bearing: p.bearing },
    { duration }
  )
}
