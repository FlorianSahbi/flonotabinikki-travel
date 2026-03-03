// @path: src/features/feed/components/VerticalVideoSwiper.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

import type { FeedItem } from '@/features/feed'
import { dateLabel, useVideoPlaylist } from '@/features/feed'
import VideoSlide from './slides/VideoSlide'

type SwiperInstance = {
  activeIndex: number
  slideTo: (index: number, speed?: number) => void
  update: () => void
}

export type SwiperRef = SwiperInstance | null

type Props = {
  items: FeedItem[]
  initialIndex?: number
  onSlideChange?: (index: number, item: FeedItem) => void
  onSwiper?: (swiper: SwiperInstance) => void
  swiperRef?: React.MutableRefObject<SwiperRef>
  renderSlide?: (item: FeedItem, index: number, props: SlideRenderProps) => React.ReactNode
}

export type SlideRenderProps = {
  nextIndex: number
  dateLabel: string
  setVideoRefAt: (idx: number) => (el: HTMLVideoElement | null) => void
  isMuted: boolean
  onToggleSound: () => void
  initialIndex: number
}

export default function VerticalVideoSwiper({
  items,
  initialIndex = 0,
  onSlideChange,
  onSwiper,
  swiperRef: externalSwiperRef,
  renderSlide,
}: Props) {
  const internalSwiperRef = useRef<SwiperInstance | null>(null)
  const swiperRef = externalSwiperRef ?? internalSwiperRef

  const { setVideoRefAt, playForIndex, isMuted, toggleSound, cleanup } =
    useVideoPlaylist()

  // Track the current item ID to maintain position when items change
  const currentItemIdRef = useRef<string | null>(null)
  const prevItemsLengthRef = useRef(items.length)

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // When items are prepended, adjust swiper position to stay on current item
  useEffect(() => {
    const swiper = swiperRef.current
    if (!swiper || !currentItemIdRef.current) return

    // Check if items were prepended (length increased and current item moved)
    const currentId = currentItemIdRef.current
    const newIndex = items.findIndex((it) => it.id === currentId)

    if (newIndex > 0 && items.length > prevItemsLengthRef.current) {
      // Items were prepended, adjust position
      swiper.update()
      swiper.slideTo(newIndex, 0)
    }

    prevItemsLengthRef.current = items.length
  }, [items, swiperRef])

  const handleSwiper = useCallback(
    (instance: SwiperInstance) => {
      swiperRef.current = instance
      const item = items[instance.activeIndex]
      if (item) {
        currentItemIdRef.current = item.id
      }
      playForIndex(instance.activeIndex)
      onSwiper?.(instance)
    },
    [swiperRef, items, playForIndex, onSwiper]
  )

  const handleSlideChange = useCallback(
    (instance: SwiperInstance) => {
      const idx = instance.activeIndex
      playForIndex(idx)
      const item = items[idx]
      if (item) {
        currentItemIdRef.current = item.id
        onSlideChange?.(idx, item)
      }
    },
    [items, playForIndex, onSlideChange]
  )

  const defaultRenderSlide = useCallback(
    (item: FeedItem, itemIndex: number, props: SlideRenderProps) => (
      <VideoSlide
        item={item}
        index={itemIndex}
        initialIndex={props.initialIndex}
        nextIndex={props.nextIndex}
        setVideoRefAt={props.setVideoRefAt}
        dateLabel={props.dateLabel}
        isMuted={props.isMuted}
        onToggleSound={props.onToggleSound}
      />
    ),
    []
  )

  const slideRenderer = renderSlide ?? defaultRenderSlide

  return (
    <Swiper
      modules={[Mousewheel]}
      direction="vertical"
      slidesPerView={1}
      mousewheel={{ forceToAxis: true, sensitivity: 1 }}
      resistanceRatio={0.85}
      initialSlide={initialIndex}
      onSwiper={handleSwiper as any}
      onSlideChange={handleSlideChange as any}
      className="h-full w-full"
      threshold={10}
      longSwipes
      longSwipesRatio={0.3}
      longSwipesMs={300}
      followFinger
      touchReleaseOnEdges
      allowTouchMove
      speed={400}
    >
      {items.map((item, itemIndex) => {
        const nextIndex = Math.min(itemIndex + 1, items.length - 1)
        const label = dateLabel(item.recorded_at)

        const slideProps: SlideRenderProps = {
          nextIndex,
          dateLabel: label,
          setVideoRefAt,
          isMuted,
          onToggleSound: () => {
            const active = swiperRef.current?.activeIndex ?? itemIndex
            toggleSound(active)
          },
          initialIndex,
        }

        return (
          <SwiperSlide key={item.id} className="!h-full !w-full">
            <div className="relative h-full w-full overflow-hidden">
              {slideRenderer(item, itemIndex, slideProps)}
            </div>
          </SwiperSlide>
        )
      })}
    </Swiper>
  )
}
