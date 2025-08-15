'use client'

import { useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'
import MiniMapOverlay, {
  MiniMapOverlayRef,
} from '@/components/stories/MiniMapOverlay'
import { FeedItem, feedGetItemsAfter, feedGetItemsBefore } from '@/lib/feed'
import ClusterExperienceSlide from '@/components/stories/ClusterExperienceSlide'

export default function StoriesFeed({
  initialId,
  initialItems,
}: {
  initialId: string
  initialItems: FeedItem[]
}) {
  const swiperRef = useRef<unknown>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const miniMapRef = useRef<MiniMapOverlayRef>(null)

  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const idsRef = useRef(new Set(initialItems.map((v) => v.id)))
  const loadingNextRef = useRef(false)
  const loadingPrevRef = useRef(false)
  const activeIndexRef = useRef(0)

  const initialIndex = useMemo(
    () =>
      Math.max(
        items.findIndex((v) => v.id === initialId),
        0
      ),
    [items, initialId]
  )

  const setPlayForIndex = (activeIndex: number) => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === activeIndex) {
        v.play().catch(() => {})
      } else {
        v.pause()
        try {
          v.currentTime = 0
        } catch {}
      }
    })
  }

  const appendAfter = async () => {
    if (loadingNextRef.current || !items.length) return
    const last = items[items.length - 1]
    const lastTime = last?.recorded_at
    if (!lastTime) return
    loadingNextRef.current = true
    try {
      const skipClusterId = last?.kind === 'cluster' ? last.id : undefined
      const more = await feedGetItemsAfter(lastTime, 5, skipClusterId)
      const fresh = more.filter((v) => !idsRef.current.has(v.id))
      if (fresh.length) {
        fresh.forEach((v) => idsRef.current.add(v.id))
        setItems((prev) => {
          const updated = [...prev, ...fresh]
          miniMapRef.current?.updatePoints(
            updated
              .filter((x) => x.lat != null && x.lng != null)
              .map((x) => ({ id: x.id, lat: x.lat, lng: x.lng }))
          )
          return updated
        })
      }
    } finally {
      loadingNextRef.current = false
    }
  }

  const prependBefore = async () => {
    if (loadingPrevRef.current || !items.length) return
    const first = items[0]
    const firstTime = first?.recorded_at
    if (!firstTime) return
    loadingPrevRef.current = true
    try {
      const swiper = swiperRef.current as {
        activeIndex: number
        slideTo: (index: number, speed?: number) => void
      }
      const skipClusterId = first?.kind === 'cluster' ? first.id : undefined
      const more = await feedGetItemsBefore(firstTime, 5, skipClusterId)
      const fresh = more.filter((v) => !idsRef.current.has(v.id))
      if (fresh.length) {
        const active = swiper?.activeIndex ?? 0
        fresh.forEach((v) => idsRef.current.add(v.id))
        setItems((prev) => {
          const updated = [...fresh, ...prev]
          miniMapRef.current?.updatePoints(
            updated
              .filter((x) => x.lat != null && x.lng != null)
              .map((x) => ({ id: x.id, lat: x.lat, lng: x.lng }))
          )
          return updated
        })
        requestAnimationFrame(() => {
          swiper.slideTo(active + fresh.length, 0)
        })
      }
    } finally {
      loadingPrevRef.current = false
    }
  }

  const handleSlideChange = (sw: { activeIndex: number }) => {
    const idx = sw.activeIndex
    activeIndexRef.current = idx
    setPlayForIndex(idx)

    const current = items[idx]
    if (current?.id) {
      window.history.replaceState(null, '', `/stories/${current.id}`)
    }

    if (miniMapRef.current && current?.lat != null && current?.lng != null) {
      miniMapRef.current.flyTo(current.lng, current.lat)
    }

    if (idx >= items.length - 2) appendAfter()
    if (idx <= 1) prependBefore()
  }

  if (!items.length) {
    return <div className="p-6 text-white">Aucune vidéo</div>
  }

  const initialPoints = (items ?? [])
    .filter((v) => v.lat != null && v.lng != null)
    .map((v) => ({ id: v.id, lat: v.lat, lng: v.lng }))

  const centerLng = items[initialIndex]?.lng ?? 0
  const centerLat = items[initialIndex]?.lat ?? 0

  return (
    <div className="h-[100dvh] w-screen bg-black">
      <MiniMapOverlay
        ref={miniMapRef}
        initialPoints={initialPoints}
        center={[centerLng, centerLat]}
      />
      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        mousewheel={{ forceToAxis: true, sensitivity: 1 }}
        resistanceRatio={0.85}
        initialSlide={initialIndex}
        onSwiper={(sw) => {
          swiperRef.current = sw
        }}
        onAfterInit={(sw) => setPlayForIndex(sw.activeIndex)}
        onSlideChange={handleSlideChange}
        className="h-full"
        threshold={10}
        longSwipes={true}
        longSwipesRatio={0.3}
        longSwipesMs={300}
        followFinger={true}
        touchReleaseOnEdges={true}
        allowTouchMove={true}
        speed={400}
      >
        {items.map((it, i) => {
          const nextIndex = Math.min(i + 1, items.length - 1)
          const dateStr = it.recorded_at
            ? new Date(it.recorded_at).toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—'

          return (
            <SwiperSlide key={it.id}>
              <div className="relative h-full w-full">
                {it.kind === 'video' ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRefs.current[i] = el
                      }}
                      className="absolute inset-0 h-full w-full object-cover"
                      src={it.bucket_url ?? ''}
                      playsInline
                      muted
                      autoPlay={i === initialIndex}
                      preload={
                        i === initialIndex || i === nextIndex
                          ? 'auto'
                          : 'metadata'
                      }
                      loop
                    />
                    <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-xs text-white">
                      {dateStr}
                    </div>
                    {it.lat != null && it.lng != null && (
                      <div className="absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 text-xs text-white">
                        {Number(it.lat).toFixed(4)} /{' '}
                        {Number(it.lng).toFixed(4)}
                      </div>
                    )}
                  </>
                ) : (
                  <ClusterExperienceSlide
                    item={it}
                    href={`/experience/${it.id}`}
                  />
                )}
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
