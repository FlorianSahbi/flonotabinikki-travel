'use client'

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { useParams } from 'next/navigation'
import type { CameraFns, TimelineAPI } from '@/types/app'
import { useAudioCtx } from '@/app/context/audio/context'
import { useMapCtx } from '@/app/context/map/context'

const TimelineContext = createContext<TimelineAPI | null>(null)
TimelineContext.displayName = 'TimelineContext'

/**
 * TimelineProvider
 * - Thin façade combining Map + Audio concerns for timeline pages.
 * - Exposes *stable* camera fns via refs so consumers don't re-render
 *   just because the underlying map handlers change identity.
 * - Keeps Audio track (overview/detail) in sync with the URL.
 */
export function TimelineProvider({ children }: { children: ReactNode }) {
  const map = useMapCtx()
  const audio = useAudioCtx()

  // Detect detail page via dynamic route param
  const { id } = useParams<{ lang: string; id?: string }>()
  const isDetail = Boolean(id)

  /** Keep audio track in sync with URL (detail vs overview) using a ref
   *  so changes to the setter's identity can't cause effect loops. */
  const setDetailModeRef = useRef<(on: boolean) => void>(() => {})
  useEffect(() => {
    setDetailModeRef.current = audio.setDetailModeAudio
  }, [audio.setDetailModeAudio])

  useEffect(() => {
    setDetailModeRef.current(isDetail)
  }, [isDetail])

  // Stable camera wrappers (forward calls to the latest refs)
  const flyRef = useRef<CameraFns['flyTo']>(() => {})
  const easeRef = useRef<CameraFns['easeTo']>(() => {})
  const jumpRef = useRef<CameraFns['jumpTo']>(() => {})

  useEffect(() => {
    flyRef.current = map.flyTo
  }, [map.flyTo])
  useEffect(() => {
    easeRef.current = map.easeTo
  }, [map.easeTo])
  useEffect(() => {
    jumpRef.current = map.jumpTo
  }, [map.jumpTo])

  const flyTo = useCallback<CameraFns['flyTo']>((v, o) => {
    return flyRef.current(v, o)
  }, [])
  const easeTo = useCallback<CameraFns['easeTo']>((v, o) => {
    return easeRef.current(v, o)
  }, [])
  const jumpTo = useCallback<CameraFns['jumpTo']>((v, o) => {
    return jumpRef.current(v, o)
  }, [])

  const setDetailModeAudio = useCallback((on: boolean) => {
    return setDetailModeRef.current(on)
  }, [])

  const value: TimelineAPI = useMemo(
    () => ({
      status: map.status,
      isMapReady: map.isReady,
      flyTo,
      easeTo,
      jumpTo,
      setDetailModeAudio,
    }),
    [map.status, map.isReady, flyTo, easeTo, jumpTo, setDetailModeAudio]
  )

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  )
}

export const useTimelineCtx = () => {
  const ctx = useContext(TimelineContext)
  if (!ctx) throw new Error('TimelineContext Provider missing')
  return ctx
}
