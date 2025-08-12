'use client'

import { useRef, useState, useEffect } from 'react'
import type { Tables } from '@/types/supabase'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

type VideoLite = Pick<
  Tables<'videos'>,
  'id' | 'bucket_url' | 'recorded_at' | 'lat' | 'lng' | 'position'
>

type Props = {
  data: VideoLite[]
  initialId?: string
}

export default function StoriesFeed({ data, initialId }: Props) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [initialIndex, setInitialIndex] = useState<number | null>(null)

  useEffect(() => {
    const idx = initialId ? data.findIndex((v) => v.id === initialId) : 0
    setInitialIndex(idx >= 0 ? idx : 0)
  }, [data, initialId])

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

  const handleSlideChange = (sw: { activeIndex: number }) => {
    setPlayForIndex(sw.activeIndex)
    const newId = data[sw.activeIndex]?.id
    if (newId) {
      window.history.replaceState(null, '', `/stories/${newId}`)
    }
  }

  if (initialIndex === null) {
    return null
  }

  return (
    <div className="h-[100dvh] w-screen bg-black">
      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        initialSlide={initialIndex}
        mousewheel={{ forceToAxis: true, sensitivity: 1 }}
        resistanceRatio={0.85}
        onSlideChange={handleSlideChange}
        onAfterInit={(sw) => setPlayForIndex(sw.activeIndex)}
        className="h-full"
      >
        {data.map((it, i) => {
          const nextIndex = Math.min(i + 1, data.length - 1)
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
                  {new Date(it.recorded_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  /{it.position}
                </div>
                <div className="absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 text-xs text-white">
                  {it.lat.toFixed(4)} / {it.lng.toFixed(4)}
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}
