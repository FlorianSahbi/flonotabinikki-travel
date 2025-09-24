// @path: src/shared/media/BackgroundVideoCarousel.tsx
'use client'

import React, {
  CSSProperties,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react'

type Props = {
  sources: string[]
  intervalMs?: number
  fadeMs?: number
  className?: string
  style?: CSSProperties
  videoClassName?: string
  videoStyle?: CSSProperties
  objectFit?: CSSProperties['objectFit']
  objectPosition?: CSSProperties['objectPosition']
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  children?: React.ReactNode
  onIndexChange?: (index: number) => void
}

export default function BackgroundVideoCarousel({
  sources,
  intervalMs = 8000,
  fadeMs = 600,
  className,
  style,
  videoClassName,
  videoStyle,
  objectFit = 'cover',
  objectPosition = 'center',
  muted = true,
  loop = true,
  playsInline = true,
  children,
  onIndexChange,
}: Props) {
  const n = Math.max(0, sources.length)
  const sourcesKey = useMemo(() => sources.join('\x1F'), [sources])

  const pick = (i: number) => sources[i] ?? ''

  const [activeSlot, setActiveSlot] = useState<0 | 1>(0)
  const [slotSrc, setSlotSrc] = useState<[string, string]>(() => {
    if (n === 0) return ['', '']
    if (n === 1) return [pick(0), pick(0)]
    return [pick(0), pick(1)]
  })

  const nextPtrRef = useRef<number>(n > 1 ? 1 : 0)
  const switchingToRef = useRef<0 | 1 | null>(null)

  useEffect(() => {
    const newN = Math.max(0, sources.length)
    if (newN === 0) {
      setSlotSrc(['', ''])
      return
    }
    if (newN === 1) {
      setSlotSrc([pick(0), pick(0)])
      setActiveSlot(0)
      nextPtrRef.current = 0
      onIndexChange?.(0)
      return
    }
    setSlotSrc([pick(0), pick(1)])
    setActiveSlot(0)
    nextPtrRef.current = 1
    onIndexChange?.(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey])

  const queueNext = () => {
    if (n <= 1) return
    const hidden: 0 | 1 = activeSlot === 0 ? 1 : 0
    const nextIdx = nextPtrRef.current % n
    const nextSrc = pick(nextIdx)

    setSlotSrc((prev) => {
      const copy: [string, string] = [...prev] as [string, string]
      copy[hidden] = nextSrc
      return copy
    })

    switchingToRef.current = hidden
    nextPtrRef.current = (nextPtrRef.current + 1) % n
  }

  useEffect(() => {
    if (n <= 1) return
    const id = setInterval(queueNext, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, intervalMs, activeSlot, sourcesKey])

  const onCanPlay = (slot: 0 | 1) => {
    if (switchingToRef.current === slot) {
      setActiveSlot(slot)
      const newIndex = nextPtrRef.current === 0 ? n - 1 : nextPtrRef.current - 1
      onIndexChange?.(newIndex)
      switchingToRef.current = null
    }
  }

  const base: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    transition: `opacity ${fadeMs}ms ease`,
  }

  return (
    <div
      className={['w-full h-full', className].filter(Boolean).join(' ')}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        ...(style || {}),
      }}
    >
      <video
        key={`slot-0-${slotSrc[0]}`}
        src={slotSrc[0]}
        autoPlay
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={videoClassName}
        style={{
          ...base,
          opacity: activeSlot === 0 ? 1 : 0,
          ...(videoStyle || {}),
        }}
        onCanPlay={() => onCanPlay(0)}
      />
      <video
        key={`slot-1-${slotSrc[1]}`}
        src={slotSrc[1]}
        autoPlay
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        className={videoClassName}
        style={{
          ...base,
          opacity: activeSlot === 1 ? 1 : 0,
          ...(videoStyle || {}),
        }}
        onCanPlay={() => onCanPlay(1)}
      />
      {children && (
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      )}
    </div>
  )
}
