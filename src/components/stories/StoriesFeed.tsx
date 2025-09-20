'use client'

import { useEffect, useRef } from 'react'
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

import { useExploreStore } from '@/lib/state/useExploreStore'

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

  const setFocus = useExploreStore((s) => s.setFocus)
  const loadContext = useExploreStore((s) => s.loadContext)

  useEffect(() => {
    if (initialId)
      setFocus(initialId, { fetch: false, syncUrl: true, source: 'stories' })
  }, [initialId, setFocus])

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
    <div className="h-full w-full bg-black overflow-hidden">
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
        onAfterInit={async (instance) => {
          const current = items[instance.activeIndex]?.id ?? initialId
          await loadContext(current) // no force, déjà en cache
          setFocus(current, { fetch: false, syncUrl: true, source: 'stories' })
          playForIndex(instance.activeIndex)
        }}
        onSlideChange={async (instance) => {
          handleSlideChange(instance.activeIndex)
          const current = items[instance.activeIndex]?.id ?? initialId
          await loadContext(current) // no force
          setFocus(current, { fetch: false, syncUrl: true, source: 'stories' })
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
