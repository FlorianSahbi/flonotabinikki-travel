'use client'

import { useMemo, useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
  useTransform,
  useMotionValue,
} from 'framer-motion'
import Video from '@/components/media/Video'

type Item = {
  src: string
  poster?: string
}

type Props = {
  title: string
  subtitle?: string
  items: Item[]
  heightVh?: number
  cardVW?: number
  gapVW?: number
  rowPadVW?: number
  startOvershootVW?: number
  endOvershootVW?: number
  xEndAt?: number
  titleHideStart?: number
  onProgress?: (p: number) => void
  onDoneChange?: (done: boolean) => void
  doneThreshold?: number
}

export default function CardsReveal({
  title,
  subtitle,
  items,
  heightVh = 500,
  cardVW = 28,
  gapVW = 4,
  rowPadVW = 6,
  startOvershootVW = 0,
  endOvershootVW = 20,
  xEndAt = 0.7,
  titleHideStart = 0.08,
  onProgress,
  onDoneChange,
  doneThreshold = 0.88,
}: Props) {
  const reduceMotion = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement | null>(null)

  const { scrollYProgress: sectionProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const constantOne = useMotionValue(1)
  const progress = reduceMotion ? constantOne : sectionProgress

  useMotionValueEvent(progress, 'change', (value) => {
    onProgress?.(value)
    onDoneChange?.(value >= doneThreshold)
  })

  const itemCount = items.length
  const rowWidthVW = useMemo(
    () => itemCount * cardVW + Math.max(0, itemCount - 1) * gapVW,
    [itemCount, cardVW, gapVW]
  )

  const startTranslateXvw = 100 + startOvershootVW
  const endTranslateXvw = -(rowWidthVW + rowPadVW * 2 + endOvershootVW)

  const rowTranslateX = useTransform(progress, (value) => {
    const normalized = Math.max(0, Math.min(1, value / Math.max(1e-6, xEndAt)))
    const currentX =
      startTranslateXvw + (endTranslateXvw - startTranslateXvw) * normalized
    return `${currentX}vw`
  })

  const totalTravelVW = startTranslateXvw - endTranslateXvw
  const titleClipPath = useTransform(progress, (value) => {
    const denom = Math.max(1e-6, xEndAt - titleHideStart)
    const normalized = Math.max(
      0,
      Math.min(1, (value - titleHideStart) / denom)
    )
    const rightInsetVW = totalTravelVW * normalized
    return `inset(0 ${rightInsetVW}vw 0 0)`
  })

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: `${heightVh}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center"
          style={{ clipPath: titleClipPath }}
        >
          <div className="text-center select-none">
            <div className="text-[12vw] leading-none font-extrabold tracking-tight text-white/90">
              {title.toUpperCase()}
            </div>
            {subtitle && (
              <div className="-mt-2 text-[4vw] text-white/70">{subtitle}</div>
            )}
          </div>
        </motion.div>

        <div className="absolute inset-0 z-20 flex items-center">
          <motion.div
            className="flex items-center will-change-transform transform-gpu"
            style={{
              x: rowTranslateX,
              gap: `${gapVW}vw`,
              paddingLeft: `${rowPadVW}vw`,
              paddingRight: `${rowPadVW}vw`,
            }}
          >
            {items.map((media) => (
              <figure
                key={media.src}
                className="relative aspect-[3/4] shrink-0 overflow-visible"
                style={{ width: `${cardVW}vw`, perspective: 1000 }}
              >
                <div className="h-full w-full rounded-2xl overflow-hidden bg-black/60 ring-1 ring-white/10 shadow-2xl">
                  <Video
                    className="h-full w-full object-cover"
                    src={media.src}
                    poster={media.poster}
                    playThreshold={0}
                    pauseThreshold={0}
                  />
                </div>
              </figure>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
