// src/app/[lang]/timeline/layout.tsx
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import HeadlessSyncTracks from '@/components/audio/HeadlessSyncTracks'
import { MapCanvas } from '@/components/timeline'
import type { MapCanvasHandle } from '@/components/timeline/MapCanvas'
import {
  TimelineShellContext,
  JAPAN_OVERVIEW,
  type TimelineShellAPI,
} from '@/app/context/timeline/context'

const AUDIO_TRACKS = [
  { label: 'Overview', url: '/N1.mp3', gain: 1 },
  { label: 'Detail', url: '/N2.mp3', gain: 1 },
] as const

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const mapRef = useRef<MapCanvasHandle>(null)

  const [activeAudioTrackIndex, setActiveAudioTrackIndex] = useState(0)
  const audioPlayingRef = useRef(true)

  const parts = pathname?.split('/').filter(Boolean) ?? []
  const currentLang = parts[0] ?? 'en'
  const isDetailPage = parts.length >= 3 && parts[1] === 'timeline' && parts[2]

  useEffect(() => {
    setActiveAudioTrackIndex(isDetailPage ? 1 : 0)
  }, [isDetailPage])

  const setDetailModeAudio = useCallback((on: boolean) => {
    setActiveAudioTrackIndex(on ? 1 : 0)
  }, [])

  const getCurrentSearch = () =>
    typeof window !== 'undefined' ? window.location.search : ''

  const goToDetail = useCallback(
    (id: number) => {
      router.push(`/${currentLang}/timeline/${id}${getCurrentSearch()}`)
    },
    [router, currentLang]
  )

  const backToOverview = useCallback(() => {
    router.push(`/${currentLang}/timeline${getCurrentSearch()}`, {
      scroll: false,
    })
  }, [router, currentLang])

  const flyTo = useCallback<TimelineShellAPI['flyTo']>(
    (view, opts) => mapRef.current?.flyTo(view, opts),
    []
  )
  const easeTo = useCallback<TimelineShellAPI['easeTo']>(
    (view, opts) => mapRef.current?.easeTo(view, opts),
    []
  )
  const jumpTo = useCallback<TimelineShellAPI['jumpTo']>(
    (view, opts) => mapRef.current?.jumpTo(view, opts),
    []
  )

  useEffect(() => {
    mapRef.current?.jumpTo(JAPAN_OVERVIEW)
  }, [])

  const api = useMemo<TimelineShellAPI>(
    () => ({
      flyTo,
      easeTo,
      jumpTo,
      setDetailModeAudio,
      goToDetail,
      backToOverview,
    }),
    [flyTo, easeTo, jumpTo, setDetailModeAudio, goToDetail, backToOverview]
  )

  return (
    <TimelineShellContext.Provider value={api}>
      <HeadlessSyncTracks
        tracks={AUDIO_TRACKS as any}
        activeIndex={activeAudioTrackIndex}
        playing={audioPlayingRef.current}
        fadeMs={450}
      />

      <MapCanvas
        ref={mapRef}
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
        visible
      />

      {children}
    </TimelineShellContext.Provider>
  )
}
