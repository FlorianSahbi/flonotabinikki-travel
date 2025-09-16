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
import { VolumeX, Volume1, Volume2 } from 'lucide-react'

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

type VolumeLevel = 0 | 1 | 2 // 0 = mute, 1 = mid, 2 = max
const gainFromLevel = (lvl: VolumeLevel) =>
  lvl === 0 ? 0 : lvl === 1 ? 0.05 : 0.15

function VolumeFab({
  level,
  onCycle,
}: {
  level: VolumeLevel
  onCycle: () => void
}) {
  const Icon = level === 0 ? VolumeX : level === 1 ? Volume1 : Volume2
  const label = level === 0 ? 'Muet' : level === 1 ? '25%' : '50%'
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`Volume ${label}`}
      title={`Volume ${label}`}
      className="fixed z-50 right-4 bottom-4 md:top-4 md:bottom-auto rounded-full border border-white/20 bg-white/10 p-2 text-white/90 backdrop-blur transition hover:bg-white/16 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
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

  const [volumeLevel, setVolumeLevel] = useState<VolumeLevel>(2) // 50% par défaut (mapping ci-dessus)
  const masterGain = useMemo(() => gainFromLevel(volumeLevel), [volumeLevel])

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

  const ready = useCallback(async () => {
    if (isReadyRef.current) return
    if (mapRef.current?.ready) {
      await mapRef.current.ready()
      isReadyRef.current = true
      flushQueue()
      return
    }
    await new Promise<void>((resolve) => {
      const id = setInterval(() => {
        if (isReadyRef.current) {
          clearInterval(id)
          resolve()
        }
      }, 50)
    })
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

  const api = useMemo<TimelineShellAPI>(
    () => ({
      ready,
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
        masterGain={masterGain}
      />

      <MapCanvas
        ref={mapRef}
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
        visible
        onReady={onMapReady}
      />

      <VolumeFab
        level={volumeLevel}
        onCycle={() => setVolumeLevel((v) => ((v + 1) % 3) as VolumeLevel)}
      />

      {children}
    </TimelineShellContext.Provider>
  )
}
