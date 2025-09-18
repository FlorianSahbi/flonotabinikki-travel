// src/app/[lang]/timeline/layout.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import HeadlessSyncTracks from '@/components/audio/HeadlessSyncTracks'
import { MapCanvas } from '@/components/timeline'
import { TimelineShellProvider } from '@/app/context/timeline/context'
import { VolumeX, Volume1, Volume2 } from 'lucide-react'

type VolumeLevel = 0 | 1 | 2
const MASTER_GAINS: Record<VolumeLevel, number> = { 0: 0, 1: 0.05, 2: 0.15 }

type Track = { label: string; url: string; gain: number }
const AUDIO_TRACKS: readonly Track[] = [
  { label: 'Overview', url: '/N1.mp3', gain: 1 },
  { label: 'Detail', url: '/N2.mp3', gain: 1 },
] as const

function VolumeFab({
  level,
  onCycle,
}: {
  level: VolumeLevel
  onCycle: () => void
}) {
  const Icon = level === 0 ? VolumeX : level === 1 ? Volume1 : Volume2
  const label = level === 0 ? 'Muted' : level === 1 ? '25%' : '50%'
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
  const [activeAudioTrackIndex, setActiveAudioTrackIndex] = useState(0)
  const [volumeLevel, setVolumeLevel] = useState<VolumeLevel>(2)
  const masterGain = MASTER_GAINS[volumeLevel]

  const isDetailPage =
    typeof window !== 'undefined'
      ? /^\/[^/]+\/timeline\/[^/]+/.test(window.location.pathname)
      : false

  useEffect(() => {
    setActiveAudioTrackIndex(isDetailPage ? 1 : 0)
  }, [isDetailPage])

  const setDetailModeAudio = useCallback((on: boolean) => {
    setActiveAudioTrackIndex(on ? 1 : 0)
  }, [])

  return (
    <TimelineShellProvider
      // goToDetail / backToOverview ne sont plus utilisés (navigation via <Link/>).
      // On fournit des no-op pour respecter le type actuel du provider.
      actions={{
        setDetailModeAudio,
      }}
    >
      <HeadlessSyncTracks
        tracks={AUDIO_TRACKS}
        activeIndex={activeAudioTrackIndex}
        playing={true}
        fadeMs={450}
        masterGain={masterGain}
      />

      <MapCanvas
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
        visible
      />

      <VolumeFab
        level={volumeLevel}
        onCycle={() => setVolumeLevel((v) => ((v + 1) % 3) as VolumeLevel)}
      />

      {children}
    </TimelineShellProvider>
  )
}
