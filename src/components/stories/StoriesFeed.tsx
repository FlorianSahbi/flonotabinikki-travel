// src/components/stories/StoriesFeed.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

import { FeedItem } from '@/lib/feed'
import { ClusterSlide, VideoSlide, dateLabel } from '../feed'
import { useStoriesFeed } from '@/components/feed/useStoriesFeed'
import { useExploreStore } from '@/lib/state/useExploreStore'
import { useVideoPlaylist } from '../feed'
import FeedMap from '@/components/stories/FeedMap'
import type { FeatureCollection, Point } from 'geojson'
import { useMapCtx } from '@/app/context/map/context'

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
  const swiperRef = useRef<any>(null)

  const mapCtx = useMapCtx()

  const { setVideoRefAt, playForIndex, isMuted, toggleSound } =
    useVideoPlaylist()

  const { items, initialIndex, handleSlideChange, appendAfter, prependBefore } =
    useStoriesFeed({
      initialId,
      initialItems,
      swiperRef,
      onPlay: playForIndex,
    })

  const setFocus = useExploreStore((s) => s.setFocus)
  const loadContext = useExploreStore((s) => s.loadContext)

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

  const activeIndex = () => swiperRef.current?.activeIndex ?? initialIndex
  const activeId = items[activeIndex()]?.id ?? null
  const activeCenter = centerForIndex(activeIndex())

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {showMiniMap && (
        <div className="pointer-events-none absolute right-3 top-3 z-[60] md:right-4 md:top-4">
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
        onSwiper={(instance) => {
          swiperRef.current = instance
          const current = items[instance.activeIndex]
          if (current) {
            setFocus(current.id, { fetch: false, source: 'stories' })
            if (controlExternalMap) doEaseTo(instance.activeIndex)
          }
        }}
        onAfterInit={(instance) => {
          const current = items[instance.activeIndex]
          if (current) playForIndex(instance.activeIndex)
        }}
        onSlideChange={async (instance) => {
          handleSlideChange(instance.activeIndex)
          const current = items[instance.activeIndex] ?? items[0]
          if (current) {
            try {
              await loadContext(current.id)
            } finally {
              setFocus(current.id, { fetch: false, source: 'stories' })
            }
          }
          if (controlExternalMap) doEaseTo(instance.activeIndex)
          if (instance.activeIndex >= items.length - 2) appendAfter()
          if (instance.activeIndex <= 1) prependBefore()
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
