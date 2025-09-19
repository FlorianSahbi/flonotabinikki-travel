'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  type VolumeLevel,
  type Track,
  type AudioAPI,
  DEFAULT_TRACKS,
  MASTER_GAINS,
} from '@/types/app'

const AudioContext = createContext<AudioAPI | null>(null)
AudioContext.displayName = 'AudioContext'

/**
 * AudioProvider
 * - Keeps audio state (volume, active track, playing).
 * - Exposes *stable* methods via refs so consumers don't re-render
 *   when setters change identity.
 * - Note: localStorage read uses lazy init; on Next.js SSR
 *   first paint will show default (2) and then persist overrides.
 */
export function AudioProvider({
  children,
  tracks = DEFAULT_TRACKS,
}: {
  children: ReactNode
  tracks?: readonly Track[]
}) {
  // Lazy init (SSR-safe default = 2). See note in the header comment.
  const [volumeLevel, setVolumeLevel] = useState<VolumeLevel>(() => {
    if (typeof window === 'undefined') return 2
    const raw = window.localStorage.getItem('vol')
    const n = raw != null ? Number(raw) : 2
    return (n === 0 || n === 1 || n === 2 ? n : 2) as VolumeLevel
  })

  // Persist volume to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vol', String(volumeLevel))
    } catch {}
  }, [volumeLevel])

  const [activeIndex, setActiveIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  const masterGain = MASTER_GAINS[volumeLevel]

  // Stable (memoized) function identities
  const cycleVolumeCb = useCallback(
    () => setVolumeLevel((v) => ((v + 1) % 3) as VolumeLevel),
    []
  )
  const setDetailModeAudioCb = useCallback(
    (on: boolean) => setActiveIndex(on ? 1 : 0),
    []
  )

  // Expose methods via refs so the API object can be stable
  const setVolumeLevelRef = useRef(setVolumeLevel)
  const cycleVolumeRef = useRef(cycleVolumeCb)
  const setActiveIndexRef = useRef(setActiveIndex)
  const setDetailModeAudioRef = useRef(setDetailModeAudioCb)
  const setPlayingRef = useRef(setPlaying)

  useEffect(() => {
    setVolumeLevelRef.current = setVolumeLevel
  }, [setVolumeLevel])
  useEffect(() => {
    cycleVolumeRef.current = cycleVolumeCb
  }, [cycleVolumeCb])
  useEffect(() => {
    setActiveIndexRef.current = setActiveIndex
  }, [setActiveIndex])
  useEffect(() => {
    setDetailModeAudioRef.current = setDetailModeAudioCb
  }, [setDetailModeAudioCb])
  useEffect(() => {
    setPlayingRef.current = setPlaying
  }, [setPlaying])

  // Stable API surface
  const apiFns = useMemo(
    () => ({
      setVolumeLevel: (v: VolumeLevel) => setVolumeLevelRef.current(v),
      cycleVolume: () => cycleVolumeRef.current(),
      setActiveIndex: (i: number) => setActiveIndexRef.current(i),
      setDetailModeAudio: (on: boolean) => setDetailModeAudioRef.current(on),
      setPlaying: (on: boolean) => setPlayingRef.current(on),
    }),
    []
  )

  const value: AudioAPI = useMemo(
    () => ({
      tracks,
      volumeLevel,
      masterGain,
      activeIndex,
      playing,
      ...apiFns,
    }),
    [tracks, volumeLevel, masterGain, activeIndex, playing, apiFns]
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudioCtx() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('AudioProvider missing')
  return ctx
}
