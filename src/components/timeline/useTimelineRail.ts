// src/components/timeline/useTimelineRail.ts
import { useCallback, useMemo, useRef, useState } from 'react'
import type { Direction } from './CrossDot'

export type UseTimelineRailOptions = {
  spacingVh?: number
  dotSizePx?: number
  strokeWidth?: number
  dash?: number
  gap?: number
  padTop?: number
  padBottom?: number
  crossBandPct?: number
  trackerSizePx?: number
  hysteresis?: number
}

type PercentageString = `${number}%`

export function useTimelineRail<T>(
  items: T[],
  opts: UseTimelineRailOptions = {},
  onTargetChange?: (
    entry: T | undefined,
    index: number,
    direction: Direction
  ) => void
) {
  const {
    spacingVh = 50,
    dotSizePx = 16,
    strokeWidth = 4,
    dash = 20,
    gap = 24,
    padTop = 0.5,
    padBottom = 0.5,
    crossBandPct = 10,
    trackerSizePx,
    hysteresis = 0.06,
  } = opts

  const count = items?.length ?? 0

  const height = useMemo(
    () =>
      `calc(${Math.max(count - 1, 0) + padTop + padBottom} * ${spacingVh}vh)`,
    [count, padTop, padBottom, spacingVh]
  )

  const baseCol = Math.max(dotSizePx, strokeWidth, 16)
  const colWidth = baseCol % 2 === 0 ? baseCol : baseCol + 1
  const lineX = colWidth / 2

  const half = crossBandPct / 2
  const offsetTop: PercentageString = `${50 + half}%`
  const offsetBot: PercentageString = `${50 - half}%`

  const trackerSize = useMemo(() => {
    const s = trackerSizePx ?? dotSizePx
    return s % 2 === 0 ? s : s + 1
  }, [trackerSizePx, dotSizePx])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [lastDirection, setLastDirection] = useState<Direction | null>(null)

  const rootRef = useRef<HTMLDivElement | null>(null)
  const lineBoxRef = useRef<HTMLDivElement | null>(null)

  const handleCross = useCallback(
    (_: T | undefined, index: number, direction: Direction) => {
      const targetIndex = direction === 'down' ? index : index - 1
      if (targetIndex < 0 || targetIndex >= count) {
        setLastDirection(direction)
        return
      }
      if (activeIndex !== targetIndex) setActiveIndex(targetIndex)
      setLastDirection(direction)
      onTargetChange?.(items[targetIndex], targetIndex, direction)
    },
    [count, items, onTargetChange, activeIndex]
  )

  return {
    count,
    height,
    colWidth,
    lineX,
    strokeWidth,
    dash,
    gap,
    spacingVh,
    padTop,
    padBottom,
    offsetTop,
    offsetBot,
    hysteresis,
    trackerSize,
    activeIndex,
    setActiveIndex,
    lastDirection,
    rootRef,
    lineBoxRef,
    handleCross,
  }
}
