'use client'

import { useMemo, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'
import { supabase } from '@/lib/supabaseClient'
import type { Tables } from '@/types/supabase'
import MiniMapOverlay, {
  MiniMapOverlayRef,
} from '@/components/stories/MiniMapOverlay'

type VideoLite = Pick<
  Tables<'videos'>,
  'id' | 'bucket_url' | 'recorded_at' | 'lat' | 'lng' | 'position'
>

async function fetchVideosAfter(
  refRecordedAt: string,
  limit = 5
): Promise<VideoLite[]> {
  const { data, error } = await supabase.rpc('get_videos_after', {
    ref_time: refRecordedAt,
    lim: limit,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as VideoLite[]
}

async function fetchVideosBefore(
  refRecordedAt: string,
  limit = 5
): Promise<VideoLite[]> {
  const { data, error } = await supabase.rpc('get_videos_before', {
    ref_time: refRecordedAt,
    lim: limit,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).reverse() as VideoLite[]
}

export default function StoriesFeed({
  initialId,
  initialVideos,
}: {
  initialId: string
  initialVideos: VideoLite[]
}) {
  const swiperRef = useRef<unknown>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [videos, setVideos] = useState<VideoLite[]>(initialVideos)
  const idsRef = useRef(new Set(initialVideos.map((v) => v.id))) // anti-doublons
  const loadingNextRef = useRef(false)
  const loadingPrevRef = useRef(false)
  const activeIndexRef = useRef(0)
  const miniMapRef = useRef<MiniMapOverlayRef>(null)

  const initialIndex = useMemo(
    () =>
      Math.max(
        videos.findIndex((v) => v.id === initialId),
        0
      ),
    [videos, initialId]
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
    if (loadingNextRef.current) return
    const last = videos[videos.length - 1]
    if (!last?.recorded_at) return
    loadingNextRef.current = true
    try {
      const more = await fetchVideosAfter(last.recorded_at, 5)
      const fresh = more.filter((v) => !idsRef.current.has(v.id))
      if (fresh.length) {
        fresh.forEach((v) => idsRef.current.add(v.id))
        setVideos((prev) => {
          const updated = [...prev, ...fresh]
          miniMapRef.current?.updatePoints(updated) // mise à jour map
          return updated
        })
      }
    } finally {
      loadingNextRef.current = false
    }
  }

  const prependBefore = async () => {
    if (loadingPrevRef.current) return
    const first = videos[0]
    if (!first?.recorded_at) return
    loadingPrevRef.current = true
    try {
      const swiper = swiperRef.current as {
        activeIndex: number
        slideTo: (index: number, speed?: number) => void
      }
      const more = await fetchVideosBefore(first.recorded_at, 5)
      const fresh = more.filter((v) => !idsRef.current.has(v.id))
      if (fresh.length) {
        const active = swiper.activeIndex ?? 0
        fresh.forEach((v) => idsRef.current.add(v.id))
        setVideos((prev) => {
          const updated = [...fresh, ...prev]
          miniMapRef.current?.updatePoints(updated) // mise à jour map
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

    const currentId = videos[idx]?.id
    if (currentId) {
      window.history.replaceState(null, '', `/stories/${currentId}`)
    }

    const video = videos[idx]
    if (miniMapRef.current && video?.lat != null && video?.lng != null) {
      miniMapRef.current.flyTo(video.lng, video.lat)
    }

    if (idx >= videos.length - 2) appendAfter()
    if (idx <= 1) prependBefore()
  }

  if (!videos.length) {
    return <div className="p-6 text-white">Aucune vidéo</div>
  }

  return (
    <div className="h-[100dvh] w-screen bg-black">
      <MiniMapOverlay
        ref={miniMapRef}
        initialPoints={initialVideos.map((v) => ({
          id: v.id,
          lat: v.lat ?? null,
          lng: v.lng ?? null,
        }))}
        center={[
          videos[initialIndex]?.lng ?? 0,
          videos[initialIndex]?.lat ?? 0,
        ]}
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
        {videos.map((it, i) => {
          const nextIndex = Math.min(i + 1, videos.length - 1)
          return (
            <SwiperSlide key={it.id}>
              <div className="relative h-full w-full">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={it.bucket_url}
                  playsInline
                  muted
                  autoPlay={i === initialIndex}
                  preload={
                    i === initialIndex || i === nextIndex ? 'auto' : 'metadata'
                  }
                  loop
                />
                <div className="absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-xs text-white">
                  {it.recorded_at
                    ? new Date(it.recorded_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                  /{it.position}
                </div>
                {it.lat != null && it.lng != null && (
                  <div className="absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 text-xs text-white">
                    {it.lat.toFixed(4)} / {it.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
