// Shared types used across Audio / Map / Timeline contexts.
// Keep these small and dependency-free to avoid cycles.

import { CameraView } from '@/components/timeline'

export type { View as CameraView } from '@/lib/mapbox/utils'

// --- Map status --------------------------------------------------------------

export const MAP_STATUS = ['loading', 'ready', 'idle'] as const
export type MapStatus = (typeof MAP_STATUS)[number]

// --- Camera movement options -------------------------------------------------

export type MoveOpts = {
  duration?: number
  keepBearingOnViewChange?: boolean
}

// --- Camera function bundle --------------------------------------------------

export type CameraFns = {
  flyTo(v: CameraView, opts?: MoveOpts): void
  easeTo(v: CameraView, opts?: MoveOpts): void
  jumpTo(v: CameraView, opts?: { keepBearingOnViewChange?: boolean }): void
}

// --- Audio -------------------------------------------------------------------

export type VolumeLevel = 0 | 1 | 2
export type Track = Readonly<{ label: string; url: string; gain: number }>

export const MASTER_GAINS: Record<VolumeLevel, number> = {
  0: 0,
  1: 0.05,
  2: 0.15,
}

export const DEFAULT_TRACKS: readonly Track[] = [
  { label: 'Overview', url: '/N1.mp3', gain: 1 },
  { label: 'Detail', url: '/N2.mp3', gain: 1 },
] as const

export type AudioAPI = {
  tracks: readonly Track[]
  volumeLevel: VolumeLevel
  masterGain: number
  activeIndex: number
  playing: boolean
  setVolumeLevel(v: VolumeLevel): void
  cycleVolume(): void
  setActiveIndex(i: number): void
  setDetailModeAudio(on: boolean): void
  setPlaying(on: boolean): void
}

// --- Map API (context surface) ----------------------------------------------

export type MapAPI = CameraFns & {
  status: MapStatus
  isReady: boolean
  __setStatus(s: MapStatus): void
  __setCameraFns(fns: CameraFns): void
}

// --- Timeline API (context surface) -----------------------------------------

export type TimelineAPI = CameraFns & {
  status: MapStatus
  isMapReady: boolean
  setDetailModeAudio(on: boolean): void
}
