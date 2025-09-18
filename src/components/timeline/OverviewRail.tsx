// src/components/timeline/OverviewRailSections.tsx
'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'
import { slugify } from '@/lib/slugify'
import { CentralLine } from './CentralLine'

export type Entry = {
  id: number
  title: string
  kanji?: string
  center: [number, number]
  zoom?: number
}

type Direction = -1 | 0 | 1

type Props = {
  entries: Entry[]
  sectionVh?: number // default 75
  dotSizePx?: number
  showTrackerLine?: boolean // per-section dashed line
  className?: string
  onCross?: (
    entry: Entry | undefined,
    index: number,
    direction: Direction
  ) => void
  initialActiveIndex?: number
  onItemRef?: (info: {
    id: number
    slug: string
    el: HTMLElement | null
  }) => void
}

const EPS = 1e-3

type SectionItemProps = {
  entry: Entry
  index: number
  colWidth: number
  lineX: number
  sectionVh: number
  dotSizePx: number
  showTrackerLine: boolean
  isActive: boolean
  onBecomeActive: (index: number) => void
  onItemRef?: (info: {
    id: number
    slug: string
    el: HTMLElement | null
  }) => void
}

const SectionItem = memo(function SectionItem({
  entry,
  index,
  colWidth,
  lineX,
  sectionVh,
  dotSizePx,
  showTrackerLine,
  isActive,
  onBecomeActive,
  onItemRef,
}: SectionItemProps) {
  const ref = useRef<HTMLElement | null>(null)
  const slug = (entry as any).slug ?? slugify(entry.title)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start center', 'end center'],
  })

  // active trigger: when entering the section (first time 0 < v < 1)
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

  return (
    <section
      ref={(el) => {
        ref.current = el
        onItemRef?.({ id: entry.id, slug, el })
      }}
      data-index={index}
      data-city-id={entry.id}
      data-city-slug={slug}
      className="relative mx-auto select-none"
      style={{ height: `${sectionVh}vh`, width: 'min(92vw, 1200px)' }}
    >
      {showTrackerLine && colWidth > 0 && (
        <CentralLine
          colWidth={colWidth}
          lineX={lineX}
          strokeWidth={4}
          dash={20}
          gap={24}
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
    </section>
  )
})

export default function OverviewRailSections({
  entries,
  sectionVh = 75,
  dotSizePx = 16,
  showTrackerLine = true,
  className = '',
  onCross,
  initialActiveIndex,
  onItemRef,
}: Props) {
  const sectionsRef = useRef<Array<HTMLElement | null>>([])

  // measure width to center dashed line
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [colWidth, setColWidth] = useState(0)
  const lineX = Math.max(0, Math.round(colWidth / 2))

  useEffect(() => {
    const target = sectionsRef.current[0] ?? measureRef.current
    if (!target) return
    const update = () => setColWidth(target.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(target)
    return () => ro.disconnect()
  }, [entries.length])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const lastIndexRef = useRef<number | null>(null)

  const onBecomeActive = useCallback(
    (index: number) => {
      if (activeIndex === index) return
      lastIndexRef.current = index
      setActiveIndex(index)
      onCross?.(entries[index], index, 0)
    },
    [activeIndex, entries, onCross]
  )

  // optional initial selection
  useEffect(() => {
    if (
      typeof initialActiveIndex === 'number' &&
      Number.isFinite(initialActiveIndex)
    ) {
      lastIndexRef.current = initialActiveIndex
      setActiveIndex(initialActiveIndex)
      onCross?.(entries[initialActiveIndex], initialActiveIndex, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialActiveIndex])

  return (
    <div ref={measureRef} className={`relative mx-auto ${className}`}>
      <div aria-hidden="true" role="presentation">
        {entries.map((entry, index) => (
          <SectionItem
            key={entry.id}
            entry={entry}
            index={index}
            colWidth={colWidth}
            lineX={lineX}
            sectionVh={sectionVh}
            dotSizePx={dotSizePx}
            showTrackerLine={showTrackerLine}
            isActive={activeIndex === index}
            onBecomeActive={onBecomeActive}
            onItemRef={(info) => {
              sectionsRef.current[index] = info.el
              onItemRef?.(info)
            }}
          />
        ))}
      </div>
    </div>
  )
}
