// @path: src/features/feed/components/slides/ClusterExperienceSlide.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import BackgroundVideoCarousel from '@/shared/media/BackgroundVideoCarousel'
import { FeedItem, useClusterVideos } from '@/features/feed'

export default function ClusterExperienceSlide({
  item,
  href,
  onClick,
}: {
  item: FeedItem
  href?: string
  onClick?: () => void
}) {
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const io = new IntersectionObserver(
      (entries) => {
        setVisible(!!entries[0]?.isIntersecting)
      },
      { root: null, threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const { items } = useClusterVideos(item.id, { enabled: visible, limit: 5 })

  const sources = useMemo(
    () => items.map((v) => v.main_url).filter(Boolean),
    [items]
  )

  const handleOpen = () => {
    onClick?.()
    // href is intentionally not used - parent handles navigation
    void href
  }

  const dateStr = useMemo(() => {
    if (!item.recorded_at) return '—'
    try {
      return new Date(item.recorded_at).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return item.recorded_at
    }
  }, [item.recorded_at])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onClick={handleOpen}
      role="button"
      aria-label={item.title ?? 'Voir expérience'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpen()
        }
      }}
    >
      <div className="absolute inset-0 z-0">
        <BackgroundVideoCarousel
          sources={sources}
          intervalMs={5000}
          className="absolute inset-0"
        />
      </div>

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 z-20 p-6 text-white pointer-events-none">
        <div className="mb-2 inline-flex rounded bg-white/15 px-2 py-1 text-xs font-medium backdrop-blur">
          {dateStr}
        </div>
        <h2 className="text-2xl font-semibold leading-tight">
          {item.title ?? 'Expérience'}
        </h2>
      </div>
    </div>
  )
}
