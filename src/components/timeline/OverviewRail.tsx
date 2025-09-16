// src/components/timeline/OverviewRail.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'
import CrossDot from './CrossDot'
import type { Direction } from './CrossDot'
import { useTimelineRail, type UseTimelineRailOptions } from './useTimelineRail'
import { CentralLine } from './CentralLine'
import { TrackerDot } from './TrackerDot'
import StrokeTitle from './StrokeTitle'

export type Entry = {
  id: number
  title: string
  kanji?: string
  center: [number, number]
  zoom?: number
}

type Props = {
  entries: Entry[]
  dotCount?: number
  spacingVh?: number
  dotSizePx?: number
  strokeWidth?: number
  dash?: number
  gap?: number
  className?: string
  onCross?: (
    entry: Entry | undefined,
    index: number,
    direction: Direction
  ) => void
  onExitTop?: (info: {
    activeIndex: number | null
    lastDirection: Direction | null
  }) => void
  onExitBottom?: (info: {
    activeIndex: number | null
    lastDirection: Direction | null
  }) => void
  crossBandPct?: number
  showTracker?: boolean
  trackerSizePx?: number
  trackerAlign?: 'center' | 'measure'
  padTop?: number
  padBottom?: number
  hysteresis?: number
  onTitleClick?: (id: number) => void
}

export default function OverviewRail({
  entries,
  dotCount = 10,
  spacingVh = 50,
  dotSizePx = 16,
  strokeWidth = 4,
  dash = 20,
  gap = 24,
  className = '',
  onCross,
  onExitTop,
  onExitBottom,
  crossBandPct = 10,
  showTracker = true,
  trackerSizePx,
  trackerAlign = 'center',
  padTop = 0.5,
  padBottom = 0.5,
  hysteresis = 0.06,
  onTitleClick,
}: Props) {
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
    lineBoxRef,
    activeIndex,
    lastDirection,
    handleCross,
  } = useTimelineRail<Entry>(entries, railOptions, onCross)

  const { scrollYProgress } = useScroll({
    target: lineBoxRef,
    offset: ['start 50%', 'end 50%'],
  })
  const [overlayVisible, setOverlayVisible] = useState(false)
  const previousProgressRef = useRef<number | null>(null)

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const isWithin = value > 0 && value < 1
    if (isWithin !== overlayVisible) setOverlayVisible(isWithin)

    const previous = previousProgressRef.current
    if (previous !== null) {
      if (previous > 0 && value <= 0)
        onExitTop?.({ activeIndex, lastDirection })
      if (previous < 1 && value >= 1)
        onExitBottom?.({ activeIndex, lastDirection })
    }
    previousProgressRef.current = value
  })

  const [leftPositionPx, setLeftPositionPx] = useState<number | null>(null)
  useEffect(() => {
    if (trackerAlign !== 'measure') {
      setLeftPositionPx(null)
      return
    }
    const element = rootRef.current
    if (!element) return
    const compute = () => {
      const rect = element.getBoundingClientRect()
      setLeftPositionPx(rect.left + lineX)
    }
    compute()
    const resizeObserver = new ResizeObserver(compute)
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [trackerAlign, lineX, rootRef])

  const activeEntry = useMemo(
    () => (activeIndex != null ? entries?.[activeIndex] : undefined),
    [activeIndex, entries]
  )

  return (
    <div
      ref={rootRef}
      className={`relative mx-auto pointer-events-none ${className}`}
      style={{ height, width: colWidth }}
      aria-hidden="true"
      role="presentation"
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
        {(entries?.length ? entries : Array.from({ length: dotCount })).map(
          (_, index) => {
            const entry = entries?.[index]
            return (
              <CrossDot<Entry>
                key={entries?.[index]?.id ?? index}
                top={`calc(${padTop + index} * ${spacingVh}vh)`}
                size={dotSizePx}
                index={index}
                {...(entry !== undefined ? { entry } : {})}
                onCross={handleCross as any}
                offsetTop={offsetTop}
                offsetBot={offsetBot}
                hysteresis={hysteresis}
              />
            )
          }
        )}
      </div>

      {showTracker && count >= 2 && (
        <TrackerDot visible={overlayVisible} size={trackerSize} />
      )}

      <div
        className="fixed z-20 select-none text-center"
        style={{
          top: '50vh',
          left:
            trackerAlign === 'measure' && leftPositionPx != null
              ? `${leftPositionPx}px`
              : '50%',
          transform: 'translate(-50%, -50%)',
          opacity: overlayVisible && activeEntry ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: 'none',
        }}
      >
        {activeEntry && (
          <div className="pointer-events-auto inline-block">
            <StrokeTitle
              title={activeEntry.title}
              {...(activeEntry.kanji !== undefined
                ? { kanji: activeEntry.kanji }
                : {})}
              className="inline-block cursor-pointer select-none text-center text-white"
              titleClassName="text-[12vw] leading-none font-extrabold tracking-tight"
              kanjiClassName="text-[4vw] leading-none font-medium"
              strokeWidthTitle={2}
              strokeWidthKanji={1}
              dashTitle="5100"
              dashKanji="5100"
              durationSec={1.1}
              kanjiDelaySec={0.08}
              hoverFillSec={0.45}
              onClick={() => {
                if (onTitleClick && activeEntry) onTitleClick(activeEntry.id)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
