// src/components/timeline/DetailTimeline.tsx
'use client'

import NextImage from 'next/image'
import {
  motion,
  useInView,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type {
  CameraView,
  TimelineEvent,
} from '@/components/timeline/timeline.data'
import CrossDot from './CrossDot'
import { useTimelineRail, type UseTimelineRailOptions } from './useTimelineRail'
import { CentralLine } from './CentralLine'
import { TrackerDot } from './TrackerDot'

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
  crossBandPct?: number
  padTop?: number
  padBottom?: number
  hysteresis?: number
  showTracker?: boolean
  trackerSizePx?: number
}

export default function DetailTimeline({
  events,
  onActiveCameraChange,
  onActiveEventChange,
  spacingVh = 50,
  dotSizePx = 16,
  strokeWidth = 4,
  dash = 20,
  gap = 24,
  className = '',
  crossBandPct = 10,
  padTop = 0.5,
  padBottom = 0.5,
  hysteresis = 0.06,
  showTracker = true,
  trackerSizePx,
}: Props) {
  const [active, setActive] = useState<TimelineEvent | undefined>(undefined)

  const railOptions: UseTimelineRailOptions = {
    spacingVh,
    dotSizePx,
    strokeWidth,
    dash,
    gap,
    padTop,
    padBottom,
    crossBandPct,
    hysteresis,
    ...(trackerSizePx !== undefined ? { trackerSizePx } : {}),
  }

  const {
    count,
    height,
    colWidth,
    lineX,
    offsetTop,
    offsetBot,
    trackerSize,
    rootRef,
    handleCross,
    activeIndex,
    lastDirection,
  } = useTimelineRail<TimelineEvent>(events, railOptions, (ev, idx) => {
    if (ev) {
      setActive(ev as TimelineEvent)
      onActiveEventChange?.(ev as TimelineEvent, idx)
      onActiveCameraChange?.((ev as TimelineEvent).camera)
    }
  })

  const lineBoxRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: lineBoxRef,
    offset: ['start 50%', 'end 50%'],
  })
  const [railVisible, setRailVisible] = useState(false)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const entered = v > 0 && v < 1
    if (entered !== railVisible) setRailVisible(entered)
  })

  const inViewSection = useInView(rootRef, { amount: 0.01 })
  const visible = railVisible && inViewSection

  useEffect(() => {
    if (!events?.length) return
    if (activeIndex == null) {
      preloadMedia(events[0]?.image)
      preloadMedia(events[1]?.image)
      return
    }
    const forward = lastDirection === 'down' ? activeIndex + 1 : activeIndex - 1
    preloadMedia(events[forward]?.image)
  }, [activeIndex, lastDirection, events])

  const mediaOffset = GAP_CENTER + MEDIA_W / 2
  const mediaX =
    (active?.side ?? 'right') === 'left' ? mediaOffset : -mediaOffset

  return (
    <div
      ref={rootRef}
      className={`relative mx-auto ${className}`}
      style={{ height, width: colWidth }}
      aria-hidden={false}
      role="region"
    >
      {count >= 2 && (
        <CentralLine
          colWidth={colWidth}
          lineX={lineX}
          strokeWidth={strokeWidth}
          dash={dash}
          gap={gap}
          spacingVh={spacingVh}
          padTop={padTop}
          padBottom={padBottom}
          boxRef={lineBoxRef}
        />
      )}

      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{ width: colWidth }}
      >
        {events.map((ev, i) => (
          <CrossDot<TimelineEvent>
            key={ev.id}
            top={`calc(${padTop + i} * ${spacingVh}vh)`}
            size={dotSizePx}
            index={i}
            entry={ev}
            onCross={handleCross as any}
            offsetTop={offsetTop}
            offsetBot={offsetBot}
            hysteresis={hysteresis}
          />
        ))}
      </div>

      <section className="absolute inset-0">
        {events.map((ev, i) => {
          const isTextLeft = ev.side === 'left'
          return (
            <article
              key={`card-${ev.id}`}
              className="absolute inset-x-0"
              style={{ top: `calc(${padTop + i} * ${spacingVh}vh)` }}
            >
              <motion.div
                className={`absolute top-1/2 -translate-y-1/2 w-[42vw] max-w-[540px] rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur ${
                  isTextLeft
                    ? 'right-[calc(50%+24px)]'
                    : 'left-[calc(50%+24px)]'
                }`}
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <h3 className="text-xl font-semibold text-white/90">
                  {ev.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-300">
                  {ev.description}
                </p>
              </motion.div>
            </article>
          )
        })}
      </section>

      {showTracker && count >= 2 && (
        <TrackerDot visible={visible} size={trackerSize} />
      )}

      <div
        className="fixed top-1/2 z-20 -translate-y-1/2"
        style={{
          left: '50%',
          width: MEDIA_W,
          height: MEDIA_H,
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: visible ? 'auto' : 'none',
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
