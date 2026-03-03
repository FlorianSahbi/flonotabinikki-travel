// @path: src/features/explore/components/feed/StoriesFeed.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { FeedItem } from '@/features/feed'
import { useExploreStore } from '@/features/explore/useExploreStore'
import type { FeatureCollection, Point } from 'geojson'
import { useMapCtx } from '@/shared/map/context/MapContext'
import { useStoriesFeed, useVideoPlaylist } from '@/features/feed'
import VerticalVideoSwiper, {
  SwiperRef,
  SlideRenderProps,
} from '@/features/feed/components/VerticalVideoSwiper'
import FeedMap from './FeedMap'
import VideoSlide from '@/features/feed/components/slides/VideoSlide'
import ClusterSlide from './slides/ClusterSlide'

export default function StoriesFeed({
  initialId,
  initialItems,
  videosGeoJSON,
  showMiniMap = true,
  controlExternalMap = false,
  onOpenCluster,
}: {
  initialId: string
  initialItems: FeedItem[]
  videosGeoJSON: FeatureCollection<Point, { id: string }>
  showMiniMap?: boolean
  controlExternalMap?: boolean
  onOpenCluster?: (clusterId: string) => void
}) {
  const swiperRef = useRef<SwiperRef>(null)
  const mapCtx = useMapCtx()

  const setFocus = useExploreStore((s) => s.setFocus)

  const { playForIndex } = useVideoPlaylist()

  const { items, initialIndex, handleSlideChange, checkAndLoad } =
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

  const doEaseTo = useCallback(
    (idx: number) => {
      if (!controlExternalMap) return
      const cur = items[idx]
      if (!cur) return
      const lng = Number(cur.lng ?? 0)
      const lat = Number(cur.lat ?? 0)
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
      mapCtx.easeTo(
        { center: [lng, lat], zoom: 12, bearing: 0, pitch: 0 },
        { duration: 600 }
      )
    },
    [controlExternalMap, items, mapCtx]
  )

  const rafRef = useRef<number | null>(null)
  const rafEaseTo = useCallback(
    (idx: number) => {
      if (!controlExternalMap) return
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        doEaseTo(idx)
        rafRef.current = null
      })
    },
    [controlExternalMap, doEaseTo]
  )

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  const activeIndexValue = swiperRef.current?.activeIndex ?? initialIndex
  const activeId = items[activeIndexValue]?.id ?? null
  const activeCenter = centerForIndex(activeIndexValue)

  useEffect(() => {
    if (!controlExternalMap) return
    if (!activeId) return
    rafEaseTo(activeIndexValue)
  }, [activeId, controlExternalMap, rafEaseTo, activeIndexValue])

  const handleOpenCluster = useCallback(
    (clusterId: string) => {
      onOpenCluster?.(clusterId)
    },
    [onOpenCluster]
  )

  const onSlideChangeHandler = useCallback(
    (idx: number, item: FeedItem) => {
      handleSlideChange(idx)
      setFocus(item.id, { fetch: false, source: 'stories' })
      if (controlExternalMap) rafEaseTo(idx)
      checkAndLoad(idx)
    },
    [handleSlideChange, setFocus, controlExternalMap, rafEaseTo, checkAndLoad]
  )

  const onSwiperHandler = useCallback(
    (swiper: { activeIndex: number }) => {
      const current = items[swiper.activeIndex]
      if (current) {
        setFocus(current.id, { fetch: false, source: 'stories' })
        if (controlExternalMap) rafEaseTo(swiper.activeIndex)
      }
    },
    [items, setFocus, controlExternalMap, rafEaseTo]
  )

  const renderSlide = useCallback(
    (item: FeedItem, itemIndex: number, props: SlideRenderProps) => {
      if (item.kind === 'video') {
        return (
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
        )
      }
      return <ClusterSlide item={item} onOpen={handleOpenCluster} />
    },
    [handleOpenCluster]
  )

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

      <VerticalVideoSwiper
        items={items}
        initialIndex={initialIndex}
        swiperRef={swiperRef}
        onSlideChange={onSlideChangeHandler}
        onSwiper={onSwiperHandler}
        renderSlide={renderSlide}
      />
    </div>
  )
}
