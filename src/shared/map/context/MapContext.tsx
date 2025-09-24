// @path: src/shared/map/context/MapContext.tsx
'use client'

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { CameraFns, MapAPI, MapStatus } from '@/shared/types/app'

const MapContext = createContext<MapAPI | null>(null)
MapContext.displayName = 'MapContext'

export function MapProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MapStatus>('loading')

  const flyRef = useRef<CameraFns['flyTo']>(() => {})
  const easeRef = useRef<CameraFns['easeTo']>(() => {})
  const jumpRef = useRef<CameraFns['jumpTo']>(() => {})

  const flyTo = useCallback<CameraFns['flyTo']>(
    (v, o) => flyRef.current(v, o),
    []
  )
  const easeTo = useCallback<CameraFns['easeTo']>(
    (v, o) => easeRef.current(v, o),
    []
  )
  const jumpTo = useCallback<CameraFns['jumpTo']>(
    (v, o) => jumpRef.current(v, o),
    []
  )

  const __setStatus = useCallback((s: MapStatus) => setStatus(s), [])
  const __setCameraFns = useCallback((fns: CameraFns) => {
    flyRef.current = fns.flyTo
    easeRef.current = fns.easeTo
    jumpRef.current = fns.jumpTo
  }, [])

  const value: MapAPI = useMemo(
    () => ({
      status,
      isReady: status === 'ready' || status === 'idle',
      flyTo,
      easeTo,
      jumpTo,
      __setStatus,
      __setCameraFns,
    }),
    [status, flyTo, easeTo, jumpTo, __setStatus, __setCameraFns]
  )

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

export const useMapCtx = () => {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('MapProvider missing')
  return ctx
}
