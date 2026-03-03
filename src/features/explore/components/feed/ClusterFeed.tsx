// @path: src/features/explore/components/feed/ClusterFeed.tsx
'use client'

import { useRef } from 'react'
import type { FeedItem } from '@/features/feed'
import type { FeatureCollection, Point } from 'geojson'
import { useMapCtx } from '@/shared/map/context/MapContext'
import VerticalVideoSwiper, { SwiperRef } from '@/features/feed/components/VerticalVideoSwiper'
import FeedMap from './FeedMap'

export default function ClusterFeed({
  initialItems,
  videosGeoJSON,
  onBack,
  controlExternalMap = false,
}: {
  initialItems: FeedItem[]
  videosGeoJSON?: FeatureCollection<Point, { id: string }>
  onBack: () => void
  controlExternalMap?: boolean
}) {
  const swiperRef = useRef<SwiperRef>(null)
  const mapCtx = useMapCtx()

  const items = initialItems

  const centerForIndex = (idx: number): [number, number] => {
    const cur = items[idx]
    return [Number(cur?.lng ?? 0), Number(cur?.lat ?? 0)]
  }

  const doEaseTo = (idx: number) => {
    if (!controlExternalMap) return
    const [lng, lat] = centerForIndex(idx)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
    mapCtx.easeTo(
      { center: [lng, lat], zoom: 12, bearing: 0, pitch: 0 },
      { duration: 600 }
    )
  }

  const activeIndex = swiperRef.current?.activeIndex ?? 0
  const activeId = items[activeIndex]?.id ?? null
  const activeCenter = centerForIndex(activeIndex)
  const showMiniMap = !controlExternalMap && videosGeoJSON

  if (items.length === 0) {
    return (
      <div className="relative h-full w-full bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-white/60 text-sm">Aucune vidéo dans ce cluster</div>
        <button
          onClick={onBack}
          className="rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          Retour
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      {/* Back button */}
      <div className="absolute left-3 top-3 z-[70]">
        <button
          onClick={onBack}
          className="rounded bg-black/60 px-3 py-1.5 text-xs text-white ring-1 ring-white/20 hover:bg-black/70"
        >
          ← Retour
        </button>
      </div>

      {/* Mini-map (mobile only) */}
      {showMiniMap && videosGeoJSON && (
        <div className="absolute right-3 top-3 z-[60]">
          <FeedMap
            data={videosGeoJSON}
            activeId={activeId}
            center={activeCenter}
          />
        </div>
      )}

      {/* Video count */}
      <div className={`absolute ${showMiniMap ? 'right-3 top-28' : 'right-3 top-3'} z-[70]`}>
        <div className="rounded bg-black/60 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/20">
          {items.length} vidéo{items.length > 1 ? 's' : ''}
        </div>
      </div>

      <VerticalVideoSwiper
        items={items}
        initialIndex={0}
        swiperRef={swiperRef}
        onSlideChange={(idx) => doEaseTo(idx)}
      />
    </div>
  )
}
