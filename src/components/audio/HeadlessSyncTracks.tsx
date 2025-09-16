'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type HeadlessTrack = {
  label?: string
  url: string
  gain?: number // 0..1 volume cible
}

type Props = {
  tracks: HeadlessTrack[]
  activeIndex: number // piste audible
  playing: boolean // true = play ; false = pause/stop (mémorise position)
  fadeMs?: number // crossfade ms
  sharedEndSec?: number // optionnel: force fin de boucle
  onReady?: (durations: number[], minDuration: number) => void
}

const EPS = 0.005
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export default function HeadlessSyncTracks({
  tracks,
  activeIndex,
  playing,
  fadeMs = 250,
  sharedEndSec,
  onReady,
}: Props) {
  const ctxRef = useRef<AudioContext | null>(null)
  const buffersRef = useRef<AudioBuffer[]>([])
  const sourcesRef = useRef<AudioBufferSourceNode[]>([])
  const gainsRef = useRef<GainNode[]>([])
  const startedAtRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)
  const loopEndRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)

  const [durations, setDurations] = useState<number[]>([])
  const minDur = useMemo(
    () => (durations.length ? Math.min(...durations) : 0.01),
    [durations]
  )

  function rampGain(node: GainNode, target: number, ms: number) {
    const ctx = ctxRef.current
    if (!ctx) return
    const t0 = ctx.currentTime
    const dur = Math.max(0.001, ms / 1000)
    const g = node.gain
    const current = g.value
    g.cancelScheduledValues(t0)
    g.setValueAtTime(current, t0)
    g.linearRampToValueAtTime(target, t0 + dur)
  }

  function cleanupNodes() {
    try {
      sourcesRef.current.forEach((s) => {
        try {
          s.stop(0)
        } catch {}
        try {
          s.disconnect()
        } catch {}
      })
    } catch {}
    sourcesRef.current = []
  }

  function cleanupAll() {
    cleanupNodes()
    try {
      gainsRef.current.forEach((g) => {
        try {
          g.disconnect()
        } catch {}
      })
    } catch {}
    gainsRef.current = []
    try {
      if (ctxRef.current && ctxRef.current.state !== 'closed')
        ctxRef.current.close()
    } catch {}
    ctxRef.current = null
  }

  async function ensureContextResumed() {
    const ctx = ctxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {}
    }
  }

  function currentPlayhead(): number {
    const ctx = ctxRef.current
    const end = loopEndRef.current ?? minDur
    if (!ctx || !sourcesRef.current.length) return pausedAtRef.current || 0
    const L = Math.max(0.01, end)
    const elapsed = ctx.currentTime - startedAtRef.current
    return ((elapsed % L) + L) % L
  }
  function makeSources(offsetSec: number) {
    const ctx = ctxRef.current!
    const end = clamp(loopEndRef.current ?? minDur, 0.01, minDur || 0.01)
    const safeOffset = clamp(offsetSec, 0, end - EPS)

    cleanupNodes()

    sourcesRef.current = buffersRef.current.map((buf, i) => {
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      src.loopStart = 0
      src.loopEnd = clamp(end, 0.01, buf.duration)
      src.connect(gainsRef.current[i]!) // <-- non-null assertion
      return src
    })

    sourcesRef.current.forEach((src) => src.start(0, safeOffset))
    startedAtRef.current = ctx.currentTime - safeOffset
  }

  // Boot (decode + graph)
  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (typeof window === 'undefined') return
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new Ctx()
      ctxRef.current = ctx

      // Reprendre au 1er geste utilisateur si besoin (autoplay)
      const resumeOnce = async () => {
        await ensureContextResumed()
        window.removeEventListener('pointerdown', resumeOnce)
        window.removeEventListener('keydown', resumeOnce)
      }
      window.addEventListener('pointerdown', resumeOnce, { passive: true })
      window.addEventListener('keydown', resumeOnce)

      try {
        const decoded = await Promise.all(
          tracks.map(async (t) => {
            const res = await fetch(t.url)
            if (!res.ok) throw new Error(`Load failed: ${t.url}`)
            const arr = await res.arrayBuffer()
            return await ctx.decodeAudioData(arr)
          })
        )
        if (cancelled) return

        buffersRef.current = decoded
        const durs = decoded.map((b) => b.duration)
        setDurations(durs)
        onReady?.(durs, Math.min(...durs))

        // gains
        gainsRef.current = decoded.map(() => {
          const g = ctx.createGain()
          g.gain.value = 0 // muet au boot
          g.connect(ctx.destination)
          return g
        })

        // loop end
        loopEndRef.current = clamp(
          sharedEndSec ?? Math.min(...durs),
          0.01,
          Math.min(...durs)
        )

        setReady(true)
      } catch (e) {
        console.error(e)
      }
    }
    boot()
    return () => {
      cancelled = true
      cleanupAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.map((t) => t.url).join('|')])

  // ⛳️ Dès qu'on est "ready" ET que playing===true → on démarre
  useEffect(() => {
    const run = async () => {
      if (!ready || !playing) return
      const ctx = ctxRef.current
      if (!ctx || !buffersRef.current.length || !gainsRef.current.length) return

      await ensureContextResumed()
      if (!sourcesRef.current.length) {
        makeSources(pausedAtRef.current || 0)
      }
      gainsRef.current.forEach((g, i) => {
        const target = i === activeIndex ? clamp(tracks[i]?.gain ?? 1, 0, 1) : 0
        rampGain(g, target, fadeMs)
      })
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, playing])

  // Start/Stop
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx || !ready) return

    let cancelled = false
    const run = async () => {
      if (playing) {
        await ensureContextResumed()
        if (cancelled) return
        if (!sourcesRef.current.length) {
          makeSources(pausedAtRef.current || 0)
        }
        gainsRef.current.forEach((g, i) => {
          const target =
            i === activeIndex ? clamp(tracks[i]?.gain ?? 1, 0, 1) : 0
          rampGain(g, target, fadeMs)
        })
      } else {
        pausedAtRef.current = currentPlayhead()
        cleanupNodes()
        gainsRef.current.forEach((g) => rampGain(g, 0, 80))
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  // Switch piste
  useEffect(() => {
    if (!ready) return
    gainsRef.current.forEach((g, i) => {
      const target =
        playing && i === activeIndex ? clamp(tracks[i]?.gain ?? 1, 0, 1) : 0
      rampGain(g, target, fadeMs)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, fadeMs])

  // Changement fin de boucle
  useEffect(() => {
    if (!ready) return
    const newEnd = clamp(sharedEndSec ?? minDur, 0.01, minDur)
    if (Math.abs((loopEndRef.current ?? 0) - newEnd) < 1e-6) return
    loopEndRef.current = newEnd
    if (sourcesRef.current.length) {
      const pos = currentPlayhead()
      makeSources(pos)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedEndSec, minDur, ready])

  return null
}
