'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { FeedClusterItem } from '@/lib/feed'

const LIMIT = 5
const ROTATE_MS = 5000 // intervalle entre chaque vidéo

export default function ClusterExperienceSlide({
  item,
  onClick,
}: {
  item: FeedClusterItem
  onClick?: () => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const v0Ref = useRef<HTMLVideoElement | null>(null)
  const v1Ref = useRef<HTMLVideoElement | null>(null)

  const [sources, setSources] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const [activeEl, setActiveEl] = useState<0 | 1>(0) // quel <video> est au-dessus
  const [activeIdx, setActiveIdx] = useState(0) // index dans sources

  const timerRef = useRef<number | null>(null)
  const loadedOnceRef = useRef(false)

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

  // Observe visibility
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

  // Fetch up to LIMIT videos for the cluster once visible (lazy)
  useEffect(() => {
    let cancelled = false
    if (!visible || loadedOnceRef.current) return
    loadedOnceRef.current = true
    ;(async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('bucket_url')
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

  // Helper to prep and play a given video element with a src
  const prepAndPlay = async (el: HTMLVideoElement, src: string) => {
    // Ensure autoplay-friendly flags
    el.muted = true
    el.playsInline = true
    // @ts-ignore Safari legacy
    el.setAttribute('webkit-playsinline', 'true')
    el.loop = true
    el.src = src
    try {
      // In some browsers, load helps triggering canplay reliably
      el.load?.()
    } catch {}
    if (el.readyState >= 2) {
      try {
        await el.play()
      } catch {}
      return
    }
    await new Promise<void>((resolve) => {
      const onCanPlay = () => {
        el.removeEventListener('canplay', onCanPlay)
        resolve()
      }
      el.addEventListener('canplay', onCanPlay)
    })
    try {
      await el.play()
    } catch {}
  }

  // Initialize first source when sources available
  useEffect(() => {
    const first = sources[0]
    const v0 = v0Ref.current
    const v1 = v1Ref.current
    if (!first || !v0 || !v1) return

    // Reset states
    setActiveEl(0)
    setActiveIdx(0)

    // Prepare v0 with first source, keep v1 empty
    prepAndPlay(v0, first)
    try {
      v1.pause()
      v1.removeAttribute('src')
      v1.load?.()
    } catch {}
  }, [sources])

  // Rotation interval
  useEffect(() => {
    const v0 = v0Ref.current
    const v1 = v1Ref.current
    if (!visible || sources.length <= 1 || !v0 || !v1) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Pause when not visible
      if (!visible) {
        try {
          v0.pause()
          v1.pause()
        } catch {}
      } else {
        // If visible and only 1 source, ensure it plays
        if (sources.length === 1) {
          const el = activeEl === 0 ? v0 : v1
          prepAndPlay(el, sources[0])
        }
      }
      return
    }

    const tick = async () => {
      const nextIdx = (activeIdx + 1) % sources.length
      const nextSrc = sources[nextIdx]
      const active = activeEl === 0 ? v0 : v1
      const inactive = activeEl === 0 ? v1 : v0

      // Prepare the inactive element with next source and play it
      await prepAndPlay(inactive, nextSrc)

      // Crossfade by toggling activeEl
      setActiveEl((prev) => (prev === 0 ? 1 : 0))
      setActiveIdx(nextIdx)

      // Pause the other after fade
      window.setTimeout(() => {
        try {
          active.pause()
        } catch {}
      }, 450)
    }

    // Start interval
    timerRef.current = window.setInterval(tick, ROTATE_MS) as unknown as number

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [visible, sources, activeEl, activeIdx])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-pointer select-none"
      onClick={onClick}
      role="button"
      aria-label={item.title ?? 'Voir expérience'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      {/* Background media: double <video> for smooth crossfade; fallback to preview if no video */}
      {sources.length > 0 ? (
        <>
          <video
            ref={v0Ref}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              activeEl === 0 ? 'opacity-100' : 'opacity-0'
            }`}
            playsInline
            muted
            loop
            autoPlay
            preload="auto"
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
            disablePictureInPicture
            // @ts-ignore Chrome
            disableRemotePlayback
          />
          <video
            ref={v1Ref}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              activeEl === 1 ? 'opacity-100' : 'opacity-0'
            }`}
            playsInline
            muted
            loop
            autoPlay
            preload="auto"
            controls={false}
            controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
            disablePictureInPicture
            // @ts-ignore Chrome
            disableRemotePlayback
          />
        </>
      ) : (
        <img
          alt={item.title ?? 'Expérience'}
          src={item.preview ?? '/placeholder.jpg'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Overlay + header (title + date) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-white">
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
