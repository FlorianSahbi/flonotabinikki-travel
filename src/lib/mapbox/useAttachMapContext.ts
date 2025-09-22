// src/lib/mapbox/useAttachMapContext.ts
'use client'

import { useEffect } from 'react'
import type { CameraFns } from '@/types/app'
import { useMapCtx } from '@/app/context/map/context'

export function useAttachMapContext(
  api: CameraFns & { getMap: () => any | null }
) {
  const { __setStatus, __setCameraFns } = useMapCtx()

  useEffect(() => {
    __setCameraFns({ flyTo: api.flyTo, easeTo: api.easeTo, jumpTo: api.jumpTo })
    __setStatus('ready')
    return () => __setStatus('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api])
}
