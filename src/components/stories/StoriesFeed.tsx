// src/components/stories/StoriesFeed.tsx
'use client'

import { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

import MiniMapOverlay, {
  MiniMapOverlayRef,
} from '@/components/stories/MiniMapOverlay'
import { FeedItem } from '@/lib/feed'
import { useRouter, useParams } from 'next/navigation'

import {
  ClusterSlide,
  VideoSlide,
  useStoriesFeed,
  useVideoPlaylist,
  dateLabel,
  mapPointsFromItems,
  centerFromItems,
} from './feed'

export default function StoriesFeed({
  initialId,
  initialItems,
}: {
  initialId: string
  initialItems: FeedItem[]
}) {
  const router = useRouter()
  const { lang } = useParams<{ lang?: string }>()
  const swiperRef = useRef<any>(null)
  const miniMapRef = useRef<MiniMapOverlayRef>(null)

  const { setVideoRefAt, playForIndex, isMuted, toggleSound } =
    useVideoPlaylist()

  const { items, initialIndex, handleSlideChange, appendAfter, prependBefore } =
    useStoriesFeed({
      initialId,
      initialItems,
      swiperRef,
      miniMapRef,
      onPlay: playForIndex,
    })

  if (!items.length) {
    return <div className="p-6 text-white">No videos.</div>
  }

  const initialPoints = mapPointsFromItems(items)
  const [centerLng, centerLat] = centerFromItems(items, initialIndex)

  const goToExplore = () => {
    const swiper = swiperRef.current as { activeIndex: number } | null
    const activeIndex = swiper?.activeIndex ?? initialIndex
    const currentId = items[activeIndex]?.id ?? initialId
    const base = lang ? `/${lang}` : ''
    router.push(`${base}/explore?focus=${encodeURIComponent(currentId)}`)
  }

  return (
    <div className="h-[100dvh] w-screen bg-black">
      <MiniMapOverlay
        ref={miniMapRef}
        initialPoints={initialPoints}
        center={[centerLng, centerLat]}
        onClick={goToExplore}
      />

      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        mousewheel={{ forceToAxis: true, sensitivity: 1 }}
        resistanceRatio={0.85}
        initialSlide={initialIndex}
        onSwiper={(instance) => (swiperRef.current = instance)}
        onAfterInit={(instance) => playForIndex(instance.activeIndex)}
        onSlideChange={(instance) => {
          handleSlideChange(instance.activeIndex)
          if (instance.activeIndex >= items.length - 2) appendAfter()
          if (instance.activeIndex <= 1) prependBefore()
        }}
        className="h-full"
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

          return (
            <SwiperSlide key={item.id}>
              <div className="relative h-full w-full">
                {item.kind === 'video' ? (
                  <VideoSlide
                    item={item}
                    index={itemIndex}
                    initialIndex={initialIndex}
                    nextIndex={nextIndex}
                    setVideoRefAt={setVideoRefAt}
                    dateLabel={label}
                    isMuted={isMuted}
                    onToggleSound={() => {
                      const swiper = swiperRef.current as {
                        activeIndex: number
                      } | null
                      const active = swiper?.activeIndex ?? itemIndex
                      toggleSound(active)
                    }}
                  />
                ) : (
                  <ClusterSlide item={item} />
                )}
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
