// src/components/audio/HeadlessSyncTracks.tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'

type Track = {
  label: string
  url: string
  gain?: number // par-piste (défaut 1)
}

type Props = {
  tracks: readonly Track[] | Track[]
  activeIndex: number
  playing: boolean
  fadeMs?: number
  masterGain?: number
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

export default function HeadlessSyncTracks({
  tracks,
  activeIndex,
  playing,
  fadeMs = 300,
  masterGain = 1,
}: Props) {
  const elsRef = useRef<HTMLAudioElement[]>([])
  const rafRef = useRef<number | null>(null)
  const fadeStartRef = useRef<number>(0)
  const fadeFromVolumesRef = useRef<number[]>([])
  const targetVolumesRef = useRef<number[]>([])

  const safeTracks = useMemo(() => tracks ?? [], [tracks])
  const safeActive = Number.isFinite(activeIndex) ? activeIndex : 0
  const safeFadeMs = Math.max(0, fadeMs | 0)
  const mg = clamp01(masterGain)

  useEffect(() => {
    const current = elsRef.current
    if (current.length !== safeTracks.length) {
      current.forEach((a) => {
        try {
          a.pause()
        } catch {}
      })
      elsRef.current = []
    }

    for (let i = 0; i < safeTracks.length; i++) {
      if (!elsRef.current[i]) {
        const t = safeTracks[i]
        if (!t) continue // ✅ guard TS
        const a = new Audio(t.url)
        a.loop = true
        a.preload = 'auto'
        a.crossOrigin = 'anonymous'
        a.volume = 0
        elsRef.current[i] = a
      }
    }

    if (elsRef.current.length > safeTracks.length) {
      elsRef.current.splice(safeTracks.length).forEach((a) => {
        try {
          a.pause()
        } catch {}
      })
    }

    if (playing) {
      elsRef.current.forEach((a) => {
        a.play().catch(() => {})
      })
    }

    return () => {
      // no-op
    }
  }, [safeTracks, playing])

  useEffect(() => {
    elsRef.current.forEach((a) => {
      if (!a) return
      if (playing) a.play().catch(() => {})
      else {
        try {
          a.pause()
        } catch {}
      }
    })
  }, [playing])

  const startFadeToTargets = () => {
    const audios = elsRef.current
    const from: number[] = new Array(audios.length)
    for (let i = 0; i < audios.length; i++) {
      from[i] = audios[i]?.volume ?? 0
    }
    fadeFromVolumesRef.current = from
    fadeStartRef.current = performance.now()

    const step = () => {
      const now = performance.now()
      const t =
        safeFadeMs <= 0 ? 1 : clamp01((now - fadeStartRef.current) / safeFadeMs)
      const targets = targetVolumesRef.current
      for (let i = 0; i < audios.length; i++) {
        const a = audios[i]
        if (!a) continue
        const v0 = fadeFromVolumesRef.current[i] ?? 0
        const v1 = targets[i] ?? 0
        a.volume = v0 + (v1 - v0) * t
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    const audios = elsRef.current
    const targets: number[] = new Array(audios.length).fill(0)
    for (let i = 0; i < audios.length; i++) {
      const baseGain = clamp01(safeTracks[i]?.gain ?? 1)
      targets[i] = i === safeActive ? clamp01(baseGain * mg) : 0
    }
    targetVolumesRef.current = targets

    startFadeToTargets()

    if (playing) {
      audios.forEach((a) => a?.play().catch(() => {}))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeActive, mg, safeTracks, safeFadeMs, playing])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      elsRef.current.forEach((a) => {
        try {
          a.pause()
        } catch {}
      })
      elsRef.current = []
    }
  }, [])

  return null
}
