'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

export type VideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  active?: boolean
  playThreshold?: number
  pauseThreshold?: number
  rootMargin?: string
  steps?: number
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

export default function Video({
  active = true,
  playThreshold = 0,
  pauseThreshold = 0,
  rootMargin = '0px',
  steps = 20,
  autoPlay = true,
  muted = true,
  playsInline = true,
  loop = true,
  preload = 'metadata',
  ...rest
}: VideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [ratio, setRatio] = useState(0)

  const thresholds = useMemo(() => {
    const s = Math.max(1, Math.min(100, steps))
    return Array.from({ length: s + 1 }, (_, i) => i / s)
  }, [steps])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const r = entries[0]?.intersectionRatio ?? 0
        setRatio(r)
      },
      { root: null, rootMargin, threshold: thresholds }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, thresholds])

  useEffect(() => {
    const v = ref.current
    if (!v) return

    if (!active) {
      try {
        v.pause()
      } catch {}
      return
    }

    const playT = clamp01(playThreshold)
    const pauseT = clamp01(pauseThreshold)

    if (ratio >= playT) {
      v.play().catch(() => {})
    } else if (ratio <= pauseT) {
      try {
        v.pause()
      } catch {}
    }
  }, [ratio, active, playThreshold, pauseThreshold])

  return (
    <video
      ref={ref}
      autoPlay={autoPlay}
      muted={muted}
      playsInline={playsInline}
      loop={loop}
      preload={preload}
      {...rest}
    />
  )
}
