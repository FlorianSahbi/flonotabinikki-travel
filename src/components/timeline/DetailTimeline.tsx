// src/components/timeline/DetailTimeline.tsx
'use client'

import NextImage from 'next/image'
import {
  motion,
  useInView,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion'
import { useEffect, useRef, useState, useCallback, memo } from 'react'
import type {
  CameraView,
  TimelineEvent,
} from '@/components/timeline/timeline.data'
import { CentralLine } from './CentralLine'

const MEDIA_W = 360
const MEDIA_H = Math.round(MEDIA_W * 1.25)
const GAP_CENTER = 48

const IMG_CACHE = new Set<string>()
const VID_CACHE = new Map<string, HTMLVideoElement>()
const MAX_VIDEO_CACHE = 2

function isVideoSrc(s?: string) {
  return !!s && /\.(mp4|webm|ogg)(\?.*)?$/i.test(s)
}

function preloadMedia(url?: string) {
  if (!url || typeof window === 'undefined') return

  if (isVideoSrc(url)) {
    if (VID_CACHE.has(url)) return
    const v = document.createElement('video')
    v.preload = 'auto'
    v.src = url
    v.muted = true
    v.playsInline = true
    try {
      v.load()
    } catch {}
    VID_CACHE.set(url, v)

    if (VID_CACHE.size > MAX_VIDEO_CACHE) {
      const first = VID_CACHE.keys().next()
      if (!first.done) {
        const firstKey = first.value as string
        const cachedVideo = VID_CACHE.get(firstKey)
        try {
          cachedVideo?.pause()
        } catch {}
        VID_CACHE.delete(firstKey)
      }
    }
  } else {
    if (IMG_CACHE.has(url)) return
    const img = new window.Image()
    img.decoding = 'async'
    img.src = url
    IMG_CACHE.add(url)
  }
}

function SmoothMedia({ src }: { src?: string }) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(undefined)
  const [nextSrc, setNextSrc] = useState<string | undefined>(undefined)
  const [nextReady, setNextReady] = useState(false)

  useEffect(() => {
    if (!currentSrc && src) setCurrentSrc(src)
  }, [src, currentSrc])

  useEffect(() => {
    if (!src || src === currentSrc) return
    setNextSrc(src)
    setNextReady(false)
  }, [src, currentSrc])

  const handleNextReady = () => setNextReady(true)
  const handleCrossfadeEnd = () => {
    if (!nextReady || !nextSrc) return
    setCurrentSrc(nextSrc)
    setNextSrc(undefined)
    setNextReady(false)
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur"
      style={{ width: MEDIA_W, height: MEDIA_H }}
    >
      {currentSrc && (
        <div className="absolute inset-0 opacity-100">
          {isVideoSrc(currentSrc) ? (
            <video
              src={currentSrc}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              controls={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <NextImage
              src={currentSrc}
              alt="Media"
              fill
              sizes={`${MEDIA_W}px`}
              className="object-cover"
              priority
            />
          )}
        </div>
      )}

      {nextSrc && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${nextReady ? 'opacity-100' : 'opacity-0'}`}
          onTransitionEnd={handleCrossfadeEnd}
        >
          {isVideoSrc(nextSrc) ? (
            <video
              src={nextSrc}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              controls={false}
              className="absolute inset-0 h-full w-full object-cover"
              onCanPlay={handleNextReady}
              onLoadedData={handleNextReady}
            />
          ) : (
            <NextImage
              src={nextSrc}
              alt="Media"
              fill
              sizes={`${MEDIA_W}px`}
              className="object-cover"
              onLoadingComplete={handleNextReady}
              priority={false}
            />
          )}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
    </div>
  )
}

type Props = {
  events: TimelineEvent[]
  onActiveCameraChange?: (camera?: CameraView) => void
  onActiveEventChange?: (ev: TimelineEvent, index: number) => void
  spacingVh?: number
  dotSizePx?: number
  strokeWidth?: number
  dash?: number
  gap?: number
  className?: string
  trackerSizePx?: number
}

const EPS = 1e-3

type SectionItemProps = {
  ev: TimelineEvent
  index: number
  colWidth: number
  lineX: number
  sectionVh: number
  dotSizePx: number
  strokeWidth: number
  dash: number
  gap: number
  isActive: boolean
  onBecomeActive: (index: number) => void
}

const SectionItem = memo(function SectionItem({
  ev,
  index,
  colWidth,
  lineX,
  sectionVh,
  dotSizePx,
  strokeWidth,
  dash,
  gap,
  isActive,
  onBecomeActive,
}: SectionItemProps) {
  const ref = useRef<HTMLElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start center', 'end center'],
  })

  const wasInsideRef = useRef(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const inside = v > EPS && v < 1 - EPS
    if (inside && !wasInsideRef.current) {
      wasInsideRef.current = true
      onBecomeActive(index)
    } else if (!inside && wasInsideRef.current) {
      wasInsideRef.current = false
    }
  })

  const isTextLeft = ev.side === 'left'

  return (
    <section
      ref={ref}
      data-index={index}
      data-event-id={ev.id}
      className="relative mx-auto select-none"
      style={{ height: `${sectionVh}vh`, width: 'min(92vw, 1200px)' }}
    >
      {colWidth > 0 && (
        <CentralLine
          colWidth={colWidth}
          lineX={lineX}
          strokeWidth={strokeWidth}
          dash={dash}
          gap={gap}
          spacingVh={100}
          padTop={0}
          padBottom={0}
          className="z-10"
        />
      )}

      <div
        className="sticky z-20 flex justify-center"
        style={{
          top: `calc(50vh - ${dotSizePx / 2}px)`,
          marginTop: -dotSizePx / 2,
          height: dotSizePx,
        }}
      >
        <div
          className="rounded-full transition-[box-shadow] duration-200"
          style={{
            width: dotSizePx,
            height: dotSizePx,
            background: 'white',
            boxShadow: isActive ? '0 0 0 4px rgba(255,255,255,0.35)' : 'none',
          }}
        />
      </div>

      <article className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <motion.div
          className={`absolute w-[42vw] max-w-[540px] rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur ${
            isTextLeft ? 'right-[calc(50%+24px)]' : 'left-[calc(50%+24px)]'
          }`}
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <h3 className="text-xl font-semibold text-white/90">{ev.title}</h3>
          <p className="mt-2 leading-relaxed text-slate-300">
            {ev.description}
          </p>
        </motion.div>
      </article>
    </section>
  )
})

export default function DetailTimeline({
  events,
  onActiveCameraChange,
  onActiveEventChange,
  spacingVh = 75,
  dotSizePx = 16,
  strokeWidth = 4,
  dash = 20,
  gap = 24,
  className = '',
}: Props) {
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [colWidth, setColWidth] = useState(0)
  const lineX = Math.max(0, Math.round(colWidth / 2))

  useEffect(() => {
    const target = measureRef.current
    if (!target) return
    const update = () => setColWidth(target.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(target)
    return () => ro.disconnect()
  }, [])

  const [activeIndex, setActiveIndex] = useState(0)
  const active = events[activeIndex]
  const prevIndexRef = useRef<number>(-1)

  const onBecomeActive = useCallback(
    (index: number) => {
      if (index < 0 || index >= events.length) return
      const ev = events[index]
      if (!ev) return

      if (index === activeIndex) return
      prevIndexRef.current = activeIndex
      setActiveIndex(index)

      onActiveEventChange?.(ev, index)
      onActiveCameraChange?.(ev.camera)
    },
    [activeIndex, events, onActiveCameraChange, onActiveEventChange]
  )

  useEffect(() => {
    if (!events?.length) return
    const prev = prevIndexRef.current
    const forward =
      prev >= 0 && activeIndex > prev ? activeIndex + 1 : activeIndex - 1
    preloadMedia(events[forward]?.image)
  }, [activeIndex, events])

  const rootRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start 50%', 'end 50%'],
  })
  const [visible, setVisible] = useState(false)
  const inView = useInView(rootRef, { amount: 0.01 })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const entered = v > 0 && v < 1
    if (entered !== visible) setVisible(entered)
  })
  const showOverlay = visible && inView

  const mediaOffset = GAP_CENTER + MEDIA_W / 2
  const mediaX =
    (active?.side ?? 'right') === 'left' ? mediaOffset : -mediaOffset

  return (
    <div ref={rootRef} className={`relative mx-auto ${className}`}>
      <div ref={measureRef} className="relative mx-auto">
        {events.map((ev, index) => (
          <SectionItem
            key={ev.id}
            ev={ev}
            index={index}
            colWidth={colWidth}
            lineX={lineX}
            sectionVh={spacingVh}
            dotSizePx={dotSizePx}
            strokeWidth={strokeWidth}
            dash={dash}
            gap={gap}
            isActive={activeIndex === index}
            onBecomeActive={onBecomeActive}
          />
        ))}
      </div>

      <div
        className="fixed top-1/2 z-20 -translate-y-1/2"
        style={{
          left: '50%',
          width: MEDIA_W,
          height: MEDIA_H,
          opacity: showOverlay ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: showOverlay ? 'auto' : 'none',
          transform: 'translate(-50%, 0%)',
        }}
      >
        <motion.div
          aria-label="media"
          className="relative"
          animate={{ x: mediaX }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ scale: 1.02 }}
          style={{ willChange: 'transform' }}
        >
          <SmoothMedia {...(active?.image ? { src: active.image } : {})} />
        </motion.div>
      </div>
    </div>
  )
}
