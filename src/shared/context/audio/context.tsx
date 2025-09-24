// @path: src/shared/context/audio/context.tsx
'use client'

import {
  AudioAPI,
  DEFAULT_TRACKS,
  Track,
  VolumeLevel,
  MASTER_GAINS,
} from '@/shared/types'
import * as React from 'react'

const AudioContext = React.createContext<AudioAPI | null>(null)
AudioContext.displayName = 'AudioContext'

export function AudioProvider({
  children,
  tracks = DEFAULT_TRACKS,
}: {
  children: React.ReactNode
  tracks?: readonly Track[]
}) {
  const [volumeLevel, setVolumeLevel] = React.useState<VolumeLevel>(() => {
    if (typeof window === 'undefined') return 2
    const raw = window.localStorage.getItem('vol')
    const n = raw != null ? Number(raw) : 2
    return (n === 0 || n === 1 || n === 2 ? n : 2) as VolumeLevel
  })

  React.useEffect(() => {
    try {
      localStorage.setItem('vol', String(volumeLevel))
    } catch {}
  }, [volumeLevel])

  const [activeIndex, setActiveIndex] = React.useState(0)
  const [playing, setPlaying] = React.useState(true)

  const masterGain = MASTER_GAINS[volumeLevel]

  const cycleVolumeCb = React.useCallback(
    () => setVolumeLevel((v) => ((v + 1) % 3) as VolumeLevel),
    []
  )
  const setDetailModeAudioCb = React.useCallback(
    (on: boolean) => setActiveIndex(on ? 1 : 0),
    []
  )

  const setVolumeLevelRef = React.useRef(setVolumeLevel)
  const cycleVolumeRef = React.useRef(cycleVolumeCb)
  const setActiveIndexRef = React.useRef(setActiveIndex)
  const setDetailModeAudioRef = React.useRef(setDetailModeAudioCb)
  const setPlayingRef = React.useRef(setPlaying)

  React.useEffect(() => {
    setVolumeLevelRef.current = setVolumeLevel
  }, [setVolumeLevel])
  React.useEffect(() => {
    cycleVolumeRef.current = cycleVolumeCb
  }, [cycleVolumeCb])
  React.useEffect(() => {
    setActiveIndexRef.current = setActiveIndex
  }, [setActiveIndex])
  React.useEffect(() => {
    setDetailModeAudioRef.current = setDetailModeAudioCb
  }, [setDetailModeAudioCb])
  React.useEffect(() => {
    setPlayingRef.current = setPlaying
  }, [setPlaying])

  const apiFns = React.useMemo(
    () => ({
      setVolumeLevel: (v: VolumeLevel) => setVolumeLevelRef.current(v),
      cycleVolume: () => cycleVolumeRef.current(),
      setActiveIndex: (i: number) => setActiveIndexRef.current(i),
      setDetailModeAudio: (on: boolean) => setDetailModeAudioRef.current(on),
      setPlaying: (on: boolean) => setPlayingRef.current(on),
    }),
    []
  )

  const value: AudioAPI = React.useMemo(
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
  const ctx = React.useContext(AudioContext)
  if (!ctx) throw new Error('AudioProvider missing')
  return ctx
}
