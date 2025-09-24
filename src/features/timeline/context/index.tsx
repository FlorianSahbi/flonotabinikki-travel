// @path: src/features/timeline/context/index.tsx
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
import { useAudioCtx } from '@/shared/context/audio/context'
import { useMapCtx } from '@/shared/map/context/MapContext'
import { TimelineAPI, CameraFns } from '@/shared/types'

const TimelineContext = createContext<TimelineAPI | null>(null)
TimelineContext.displayName = 'TimelineContext'

export function TimelineProvider({ children }: { children: ReactNode }) {
  const map = useMapCtx()
  const audio = useAudioCtx()

  const { id } = useParams<{ lang: string; id?: string }>()
  const isDetail = Boolean(id)

  const setDetailModeRef = useRef<(on: boolean) => void>(() => {})
  useEffect(() => {
    setDetailModeRef.current = audio.setDetailModeAudio
  }, [audio.setDetailModeAudio])

  useEffect(() => {
    setDetailModeRef.current(isDetail)
  }, [isDetail])

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
