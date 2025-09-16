// src/app/context/timeline/context.ts
'use client'

import { createContext, useContext } from 'react'
import type { CameraView } from '@/components/timeline/timeline.data'

export type TimelineShellAPI = {
  flyTo: (
    view: CameraView,
    opts?: { duration?: number; keepBearingOnViewChange?: boolean }
  ) => void
  easeTo: (
    view: CameraView,
    opts?: { duration?: number; keepBearingOnViewChange?: boolean }
  ) => void
  jumpTo: (
    view: CameraView,
    opts?: { keepBearingOnViewChange?: boolean }
  ) => void

  setDetailModeAudio: (on: boolean) => void
  goToDetail: (id: number) => void
  backToOverview: () => void
}

export const JAPAN_OVERVIEW: CameraView = {
  center: [134, 35],
  zoom: 4,
  pitch: 25,
  bearing: 0,
}

export const TimelineShellContext = createContext<TimelineShellAPI | null>(null)

export function useTimelineShell(): TimelineShellAPI {
  const ctx = useContext(TimelineShellContext)
  if (!ctx)
    throw new Error(
      'useTimelineShell must be used within <TimelineShellContext.Provider>'
    )
  return ctx
}
