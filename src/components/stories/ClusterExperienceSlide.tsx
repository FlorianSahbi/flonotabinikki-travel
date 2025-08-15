'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { pushWithViewTransition } from '@/lib/viewTransitions'
import type { FeedItem } from '@/lib/feed'
import BackgroundVideoCarousel from './BackgroundVideoCarousel'

const LIMIT = 5

export default function ClusterExperienceSlide({
  item,
  href,
  onClick,
}: {
  item: FeedItem
  href?: string
  onClick?: () => void
}) {
  const router = useRouter()
  const [sources, setSources] = useState<string[]>([])
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

  useEffect(() => {
    let cancelled = false
    if (!visible) return
    ;(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('cluster_id', item.id)
        .order('recorded_at', { ascending: true })
        .limit(LIMIT)

      if (!cancelled && !error && data?.length) {
        const urls = data.map((r) => r.bucket_url as string).filter(Boolean)
        setSources(urls)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visible, item.id])

  const handleOpen = async () => {
    if (href) {
      await pushWithViewTransition((h) => router.push(h), href)
    } else {
      onClick?.()
    }
    setTimeout(() => {}, 600)
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
      {/* Background : carousel ou image fallback */}
      <div className="absolute inset-0 z-0">
        <BackgroundVideoCarousel
          sources={sources}
          intervalMs={5000}
          transitionMs={500}
          overlay
          className="absolute inset-0"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

      {/* Texte/Contenu */}
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
