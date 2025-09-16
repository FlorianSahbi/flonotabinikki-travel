'use client'

import { useRef } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'

export type Direction = 'down' | 'up'

export type CrossDotProps<T> = {
  top: string
  size: number
  index: number
  entry?: T | undefined
  onCross?: (entry: T | undefined, index: number, direction: Direction) => void
  offsetTop: `${number}%`
  offsetBot: `${number}%`
  hysteresis?: number
}

export default function CrossDot<T>({
  top,
  size,
  index,
  entry,
  onCross,
  offsetTop,
  offsetBot,
  hysteresis = 0.06,
}: CrossDotProps<T>) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`center ${offsetTop}`, `center ${offsetBot}`],
  })

  const sideRef = useRef<'upper' | 'lower' | null>(null)
  const H = Math.max(0, Math.min(hysteresis, 0.49))
  const tDown = 0.5 + H
  const tUp = 0.5 - H

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (sideRef.current === null) {
      sideRef.current = v < 0.5 ? 'upper' : 'lower'
      return
    }
    if (sideRef.current === 'upper' && v >= tDown) {
      onCross?.(entry, index, 'down')
      sideRef.current = 'lower'
    } else if (sideRef.current === 'lower' && v <= tUp) {
      onCross?.(entry, index, 'up')
      sideRef.current = 'upper'
    }
  })

  return (
    <div
      ref={ref}
      className="absolute -translate-y-1/2"
      style={{ top }}
      data-index={index}
    >
      <div
        className="rounded-full bg-white"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
