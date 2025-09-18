// src/app/context/timeline/context.ts
'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { View as CameraView } from '@/lib/mapbox/utils'

export type MoveOpts = { duration?: number; keepBearingOnViewChange?: boolean }

export type TimelineShellAPI = {
  status: 'loading' | 'ready' | 'idle'
  isMapReady: boolean
  flyTo(v: CameraView, opts?: MoveOpts): void
  easeTo(v: CameraView, opts?: MoveOpts): void
  jumpTo(v: CameraView, opts?: { keepBearingOnViewChange?: boolean }): void
  setDetailModeAudio(on: boolean): void

  __setMapStatus(status: 'loading' | 'ready' | 'idle'): void
  __setCameraFns(fns: {
    flyTo(v: CameraView, opts?: MoveOpts): void
    easeTo(v: CameraView, opts?: MoveOpts): void
    jumpTo(v: CameraView, opts?: { keepBearingOnViewChange?: boolean }): void
  }): void
}

const TimelineShellContext = createContext<TimelineShellAPI | null>(null)

export function TimelineShellProvider({
  children,
  actions,
}: {
  children: ReactNode
  actions: Pick<TimelineShellAPI, 'setDetailModeAudio'>
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'idle'>('loading')
  const [cameraFns, setCameraFns] = useState<
    Pick<TimelineShellAPI, 'flyTo' | 'easeTo' | 'jumpTo'>
  >({
    flyTo: () => {},
    easeTo: () => {},
    jumpTo: () => {},
  })

  const value = useMemo<TimelineShellAPI>(
    () => ({
      status,
      isMapReady: status === 'ready' || status === 'idle',
      ...cameraFns,
      ...actions,
      __setMapStatus: setStatus,
      __setCameraFns: setCameraFns,
    }),
    [status, cameraFns, actions]
  )

  return (
    <TimelineShellContext.Provider value={value}>
      {children}
    </TimelineShellContext.Provider>
  )
}

export const useTimelineShell = () => {
  const ctx = useContext(TimelineShellContext)
  if (!ctx) throw new Error('TimelineShellContext Provider missing')
  return ctx
}
