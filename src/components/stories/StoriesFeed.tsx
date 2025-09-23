// src/components/stories/StoriesFeed.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

import { FeedItem } from '@/lib/feed'
import {
  ClusterSlide,
  VideoSlide,
  dateLabel,
  useStoriesFeed,
  useVideoPlaylist,
} from '../feed'
import { useExploreStore } from '@/lib/state/useExploreStore'
import FeedMap from '@/components/stories/FeedMap'
import type { FeatureCollection, Point } from 'geojson'
import { useMapCtx } from '@/app/context/map/context'

type SwiperLike = {
  activeIndex: number
  slideTo: (index: number, speed?: number) => void
}

export default function StoriesFeed({
  initialId,
  initialItems,
  videosGeoJSON,
  showMiniMap = true,
  controlExternalMap = false,
}: {
  initialId: string
  initialItems: FeedItem[]
  videosGeoJSON: FeatureCollection<Point, { id: string }>
  showMiniMap?: boolean
  controlExternalMap?: boolean
}) {
  const swiperRef = useRef<SwiperLike | null>(null)
  const mapCtx = useMapCtx()
  const setFocus = useExploreStore((s) => s.setFocus)

  const { setVideoRefAt, playForIndex, isMuted, toggleSound } =
    useVideoPlaylist()

  const { items, initialIndex, handleSlideChange, appendAfter, prependBefore } =
    useStoriesFeed({
      initialId,
      initialItems,
      swiperRef,
      onPlay: playForIndex,
    })

  useEffect(() => {
    if (initialId) setFocus(initialId, { fetch: false, source: 'stories' })
  }, [initialId, setFocus])

  const centerForIndex = (idx: number): [number, number] => {
    const cur = items[idx]
    return [Number(cur?.lng ?? 0), Number(cur?.lat ?? 0)]
  }

  const doEaseTo = (idx: number) => {
    if (!controlExternalMap) return
    const [lng, lat] = centerForIndex(idx)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    mapCtx.easeTo(
      { center: [lng, lat], bearing: 0, pitch: 50 },
      { duration: 400 }
    )
  }

  const rafRef = useRef<number | null>(null)
  const rafEaseTo = (idx: number) => {
    if (!controlExternalMap) return
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      doEaseTo(idx)
      rafRef.current = null
    })
  }
  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    },
    []
  )
  // ⬆️

  const activeIndex = () => swiperRef.current?.activeIndex ?? initialIndex
  const activeId = items[activeIndex()]?.id ?? null
  const activeCenter = centerForIndex(activeIndex())

  useEffect(() => {
    if (!controlExternalMap) return
    if (!activeId) return
    rafEaseTo(activeIndex())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, controlExternalMap])
  // ⬆️

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {showMiniMap && (
        <div className="absolute right-3 top-3 z-[60] md:right-4 md:top-4">
          <FeedMap
            data={videosGeoJSON}
            activeId={activeId}
            center={activeCenter}
          />
        </div>
      )}

      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        mousewheel={{ forceToAxis: true, sensitivity: 1 }}
        resistanceRatio={0.85}
        initialSlide={initialIndex}
        onSwiper={(instance: any) => {
          swiperRef.current = instance
          const current = items[instance.activeIndex]
          if (current) {
            setFocus(current.id, { fetch: false, source: 'stories' })
            if (controlExternalMap) rafEaseTo(instance.activeIndex)
          }
          playForIndex(instance.activeIndex)
        }}
        onSlideChange={(instance: any) => {
          const idx = instance.activeIndex
          handleSlideChange(idx)
          const current = items[idx] ?? items[0]
          if (current) {
            setFocus(current.id, { fetch: false, source: 'stories' })
          }
          if (controlExternalMap) rafEaseTo(idx)
          if (idx >= items.length - 2) appendAfter()
          if (idx <= 1) prependBefore()
        }}
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

          return (
            <SwiperSlide key={item.id} className="!h-full !w-full">
              <div className="relative h-full w-full overflow-hidden">
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
                      const active = swiperRef.current?.activeIndex ?? itemIndex
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
