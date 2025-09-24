'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
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
  // desktop defaults
  cardVW?: number
  gapVW?: number
  rowPadVW?: number
  // mobile overrides
  cardVWMobile?: number
  gapVWMobile?: number
  rowPadVWMobile?: number
  // scroll behavior
  startOvershootVW?: number
  endOvershootVW?: number
  xEndAt?: number
  titleHideStart?: number
  onProgress?: (p: number) => void
  onDoneChange?: (done: boolean) => void
  doneThreshold?: number
}

// petit hook pour suivre le breakpoint Tailwind md
function useIsDesktop(query = '(min-width: 768px)') {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.matchMedia(query).matches
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsDesktop('matches' in e ? e.matches : (e as MediaQueryList).matches)
    // init + subscribe (compat old Safari)
    onChange(mql as any)
    mql.addEventListener?.('change', onChange as any)
    mql.addListener?.(onChange as any)
    return () => {
      mql.removeEventListener?.('change', onChange as any)
      mql.removeListener?.(onChange as any)
    }
  }, [query])
  return isDesktop
}

export default function CardsReveal({
  title,
  subtitle,
  items,
  heightVh = 500,
  // desktop defaults
  cardVW = 28,
  gapVW = 4,
  rowPadVW = 6,
  // mobile overrides
  cardVWMobile = 90,
  gapVWMobile = 3,
  rowPadVWMobile = 6,
  // scroll behavior
  startOvershootVW = 0,
  endOvershootVW = 20,
  xEndAt = 0.7,
  titleHideStart = 0.08,
  onProgress,
  onDoneChange,
  doneThreshold = 0.88,
}: Props) {
  const reduceMotion = useReducedMotion()
  const isDesktop = useIsDesktop()

  // valeurs finales selon le breakpoint
  const CARD_VW = isDesktop ? cardVW : cardVWMobile
  const GAP_VW = isDesktop ? gapVW : gapVWMobile
  const ROW_PAD_VW = isDesktop ? rowPadVW : rowPadVWMobile

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
    () => itemCount * CARD_VW + Math.max(0, itemCount - 1) * GAP_VW,
    [itemCount, CARD_VW, GAP_VW]
  )

  const startTranslateXvw = 100 + startOvershootVW
  const endTranslateXvw = -(rowWidthVW + ROW_PAD_VW * 2 + endOvershootVW)

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
            <div className="text-[14vw] md:text-[12vw] leading-none font-extrabold tracking-tight text-white/90">
              {title.toUpperCase()}
            </div>
            {subtitle && (
              <div className="-mt-2 text-[5vw] md:text-[4vw] text-white/70">
                {subtitle}
              </div>
            )}
          </div>
        </motion.div>

        <div className="absolute inset-0 z-20 flex items-center">
          <motion.div
            className="flex items-center will-change-transform transform-gpu"
            style={{
              x: rowTranslateX,
              gap: `${GAP_VW}vw`,
              paddingLeft: `${ROW_PAD_VW}vw`,
              paddingRight: `${ROW_PAD_VW}vw`,
            }}
          >
            {items.map((media) => (
              <figure
                key={media.src}
                className="relative aspect-[3/4] shrink-0 overflow-visible"
                style={{ width: `${CARD_VW}vw`, perspective: 1000 }}
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
