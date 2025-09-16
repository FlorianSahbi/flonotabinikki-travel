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

type Cmd =
  | {
      kind: 'fly'
      view: any
      opts?:
        | { duration?: number; keepBearingOnViewChange?: boolean }
        | undefined
    }
  | {
      kind: 'ease'
      view: any
      opts?:
        | { duration?: number; keepBearingOnViewChange?: boolean }
        | undefined
    }
  | {
      kind: 'jump'
      view: any
      opts?: { keepBearingOnViewChange?: boolean } | undefined
    }

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
  const isDetailPage =
    parts.length >= 3 && parts[1] === 'timeline' && !!parts[2]

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

  const isReadyRef = useRef(false)
  const queueRef = useRef<Cmd[]>([])

  const flushQueue = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const q = queueRef.current
    queueRef.current = []
    for (const cmd of q) {
      if (cmd.kind === 'fly') map.flyTo(cmd.view, cmd.opts)
      else if (cmd.kind === 'ease') map.easeTo(cmd.view, cmd.opts)
      else map.jumpTo(cmd.view, cmd.opts)
    }
  }, [])

  const onMapReady = useCallback(() => {
    isReadyRef.current = true
    mapRef.current?.jumpTo(JAPAN_OVERVIEW)
    flushQueue()
  }, [flushQueue])

  const flyTo = useCallback<TimelineShellAPI['flyTo']>((view, opts) => {
    if (isReadyRef.current) mapRef.current?.flyTo(view, opts)
    else queueRef.current.push({ kind: 'fly', view, opts })
  }, [])

  const easeTo = useCallback<TimelineShellAPI['easeTo']>((view, opts) => {
    if (isReadyRef.current) mapRef.current?.easeTo(view, opts)
    else queueRef.current.push({ kind: 'ease', view, opts })
  }, [])

  const jumpTo = useCallback<TimelineShellAPI['jumpTo']>((view, opts) => {
    if (isReadyRef.current) mapRef.current?.jumpTo(view, opts)
    else queueRef.current.push({ kind: 'jump', view, opts })
  }, [])

  // ✅ ajoute ready() pour satisfaire le type TimelineShellAPI
  const ready = useCallback(async () => {
    // délègue à MapCanvas si dispo, sinon résout immédiatement
    if (mapRef.current?.ready) {
      await mapRef.current.ready()
    }
  }, [])

  const api = useMemo<TimelineShellAPI>(
    () => ({
      ready, // ⬅️ important
      flyTo,
      easeTo,
      jumpTo,
      setDetailModeAudio,
      goToDetail,
      backToOverview,
    }),
    [
      ready,
      flyTo,
      easeTo,
      jumpTo,
      setDetailModeAudio,
      goToDetail,
      backToOverview,
    ]
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
        onReady={onMapReady}
      />

      {children}
    </TimelineShellContext.Provider>
  )
}
