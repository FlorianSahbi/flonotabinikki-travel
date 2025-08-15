'use client'

import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useInterval } from 'usehooks-ts'

export type BackgroundVideoCarouselProps = {
  sources: string[]
  /** Delay between switches (ms). Default: 8000 */
  intervalMs?: number
  /** Simple fade duration (ms). Default: 600 */
  fadeMs?: number
  /** You fully control the wrapper layout via className/style */
  className?: string
  style?: React.CSSProperties
  /** Video sizing (defaults to background-like behavior) */
  objectFit?: CSSProperties['objectFit']
  objectPosition?: CSSProperties['objectPosition']
  videoClassName?: string
  videoStyle?: React.CSSProperties
  /** Media flags */
  muted?: boolean // default true (required for autoplay)
  loop?: boolean // default true
  playsInline?: boolean // default true
  children?: React.ReactNode // content over the videos
}

/**
 * Ultra-simple background video carousel.
 * - No framer-motion, no blur, no fancy effects.
 * - Two <video> tags stacked; we preload the next one and fade swap.
 * - Parent decides ALL layout (absolute/fixed/inline, size, etc.).
 * - Internally uses CSS Grid to stack layers without forcing positioning.
 */
export default function BackgroundVideoCarousel({
  sources,
  intervalMs = 8000,
  fadeMs = 600,
  className,
  style,
  objectFit = 'cover',
  objectPosition = 'center',
  videoClassName,
  videoStyle,
  muted = true,
  loop = true,
  playsInline = true,
  children,
}: BackgroundVideoCarouselProps) {
  const n = Math.max(sources.length, 0)

  // Two persistent slots
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0)
  const [slotSrc, setSlotSrc] = useState<[string, string]>(() => {
    if (n === 0) return ['', '']
    if (n === 1) return [sources[0], sources[0]]
    return [sources[0], sources[1]]
  })

  // Pointer to the NEXT source index to load into the hidden slot
  const nextPtrRef = useRef<number>(n > 2 ? 2 : 0)
  const switchingToRef = useRef<0 | 1 | null>(null)

  const v0 = useRef<HTMLVideoElement | null>(null)
  const v1 = useRef<HTMLVideoElement | null>(null)
  const vBySlot = useMemo(() => [v0, v1] as const, [])

  // Reset if sources change
  useEffect(() => {
    const newN = Math.max(sources.length, 0)
    if (newN === 0) {
      setSlotSrc(['', ''])
      return
    }
    if (newN === 1) {
      setSlotSrc([sources[0], sources[0]])
      setActiveSlot(0)
      nextPtrRef.current = 0
      return
    }
    setSlotSrc([sources[0], sources[1]])
    setActiveSlot(0)
    nextPtrRef.current = newN > 2 ? 2 : 0
  }, [sources])

  // Advance to next source (very small, on one hidden slot)
  const queueNext = () => {
    if (n <= 1) return
    const hidden: 0 | 1 = activeSlot === 0 ? 1 : 0
    const nextIdx = nextPtrRef.current % n
    const nextSrc = sources[nextIdx]

    // Load next src in hidden slot
    setSlotSrc((prev) => {
      const copy: [string, string] = [...prev] as any
      copy[hidden] = nextSrc
      return copy
    })

    switchingToRef.current = hidden
    // After the hidden slot can play, we'll flip activeSlot in onCanPlay
    nextPtrRef.current = (nextPtrRef.current + 1) % n
  }

  // useInterval from react-use controls the cadence
  useInterval(queueNext, n > 1 ? intervalMs : null)

  const baseVideoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    gridArea: '1 / 1 / -1 / -1',
    pointerEvents: 'none',
    opacity: 0,
    transition: `opacity ${fadeMs}ms ease`,
  }

  const onCanPlaySlot = (slot: 0 | 1) => {
    if (switchingToRef.current === slot) {
      setActiveSlot(slot)
      switchingToRef.current = null
    }
  }

  return (
    <div
      className={className}
      style={{ display: 'grid', ...(style || {}) }}
      data-bvc-simple
    >
      <video
        ref={v0}
        src={slotSrc[0]}
        autoPlay
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={videoClassName}
        style={{
          ...baseVideoStyle,
          ...(videoStyle || {}),
          opacity: activeSlot === 0 ? 1 : 0,
          zIndex: activeSlot === 0 ? 2 : 1,
        }}
        onCanPlay={() => onCanPlaySlot(0)}
      />

      <video
        ref={v1}
        src={slotSrc[1]}
        autoPlay
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={videoClassName}
        style={{
          ...baseVideoStyle,
          ...(videoStyle || {}),
          opacity: activeSlot === 1 ? 1 : 0,
          zIndex: activeSlot === 1 ? 2 : 1,
        }}
        onCanPlay={() => onCanPlaySlot(1)}
      />

      {children && (
        <div style={{ gridArea: '1 / 1 / -1 / -1', zIndex: 3 }}>{children}</div>
      )}
    </div>
  )
}
