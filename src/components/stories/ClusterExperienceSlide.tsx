'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { pushWithViewTransition } from '@/lib/viewTransitions'
import type React from 'react'
import { FeedItem } from '@/lib/feed'

const LIMIT = 5
const ROTATE_MS = 5000

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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const v0Ref = useRef<HTMLVideoElement | null>(null)
  const v1Ref = useRef<HTMLVideoElement | null>(null)

  const [sources, setSources] = useState<string[]>([])
  const [visible, setVisible] = useState(false)
  const [activeEl, setActiveEl] = useState<0 | 1>(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null) // gel du frame pour une transition plus “wow”
  const [isFreezing, setIsFreezing] = useState(false)

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

  const prepAndPlay = async (el: HTMLVideoElement, src: string) => {
    el.muted = true
    el.playsInline = true
    el.setAttribute('webkit-playsinline', 'true')
    el.loop = true
    if (el.src !== src) el.src = src
    try {
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

    setActiveEl(0)
    setActiveIdx(0)

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
    if (!visible || sources.length <= 1 || !v0 || !v1 || isFreezing) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Pause when not visible or when freezing for transition
      if (!visible || isFreezing) {
        try {
          v0?.pause()
          v1?.pause()
        } catch {}
      } else if (sources.length === 1) {
        const el = activeEl === 0 ? v0 : v1
        if (el && sources[0]) prepAndPlay(el, sources[0])
      }
      return
    }

    const tick = async () => {
      const nextIdx = (activeIdx + 1) % sources.length
      const nextSrc = sources[nextIdx]
      const active = activeEl === 0 ? v0 : v1
      const inactive = activeEl === 0 ? v1 : v0

      if (inactive && nextSrc) await prepAndPlay(inactive, nextSrc)

      setActiveEl((prev) => (prev === 0 ? 1 : 0))
      setActiveIdx(nextIdx)

      window.setTimeout(() => {
        try {
          active?.pause()
        } catch {}
      }, 450)
    }

    timerRef.current = window.setInterval(tick, ROTATE_MS) as unknown as number

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [visible, sources, activeEl, activeIdx, isFreezing])

  // Capture a snapshot from the current active video for a super smooth shared-element transition
  const captureSnapshot = (): string | null => {
    const activeVideo =
      (activeEl === 0 ? v0Ref.current : v1Ref.current) ||
      v0Ref.current ||
      v1Ref.current
    if (!activeVideo) return item.preview ?? null
    try {
      const vw = activeVideo.videoWidth || activeVideo.clientWidth || 0
      const vh = activeVideo.videoHeight || activeVideo.clientHeight || 0
      if (!vw || !vh) return item.preview ?? null
      const canvas = document.createElement('canvas')
      canvas.width = vw
      canvas.height = vh
      const ctx = canvas.getContext('2d', { willReadFrequently: false })
      if (!ctx) return item.preview ?? null
      ctx.drawImage(activeVideo, 0, 0, vw, vh)
      return canvas.toDataURL('image/jpeg', 0.85)
    } catch {
      // CORS tainted or other error: fallback to preview if available
      return item.preview ?? null
    }
  }

  // Ensure React flushes DOM before parent starts the view transition
  const nextFrame = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )

  // Nettoyage robuste (retour navigateur, cache back/forward, etc.)
  useEffect(() => {
    const clear = () => {
      setIsFreezing(false)
      setSnapshotUrl(null)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') clear()
    }
    const onPageHide = () => clear()
    const onPopState = () => clear()

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  // Local click handler: freeze frame, expose shared element, then navigate with VT
  const handleOpen = async () => {
    setIsFreezing(true)
    try {
      v0Ref.current?.pause()
      v1Ref.current?.pause()
    } catch {}

    const shot = captureSnapshot()
    if (shot) {
      setSnapshotUrl(shot)
      await nextFrame()
    }

    if (href) {
      await pushWithViewTransition((h) => router.push(h), href)
    } else {
      onClick?.()
    }

    // Sécurité: si la nav revient (back) et réutilise le cache, on s’assure que l’overlay ne bloque pas.
    setTimeout(() => {
      setIsFreezing(false)
      setSnapshotUrl(null)
    }, 600)
  }

  // Style du conteneur avec viewTransitionName sans "any"
  const containerStyle: React.CSSProperties = {
    willChange: 'transform, opacity',
    contain: 'layout style paint',
  }
  if (!snapshotUrl) {
    ;(containerStyle as Record<string, unknown>)['viewTransitionName'] =
      `cluster-${item.id}`
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-pointer select-none"
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
      style={containerStyle}
    >
      {/* Background media: double <video> pour crossfade; si on fige, on affiche un snapshot au-dessus */}
      {sources.length > 0 ? (
        <>
          <video
            ref={v0Ref}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              activeEl === 0 ? 'opacity-100' : 'opacity-0'
            } ${isFreezing ? 'opacity-0' : ''}`}
            playsInline
            muted
            loop
            autoPlay
            preload="auto"
            controls={false}
          />
          <video
            ref={v1Ref}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              activeEl === 1 ? 'opacity-100' : 'opacity-0'
            } ${isFreezing ? 'opacity-0' : ''}`}
            playsInline
            muted
            loop
            autoPlay
            preload="auto"
            controls={false}
          />
        </>
      ) : (
        <Image
          alt={item.title ?? 'Expérience'}
          src={item.preview ?? '/placeholder.jpg'}
          fill
          sizes="100vw"
          className={`absolute inset-0 object-cover ${isFreezing ? 'opacity-0' : ''}`}
          unoptimized
          priority={false}
        />
      )}

      {/* Snapshot gelé pour la transition partagée “wow” (porte le même nom que le header cible) */}
      {snapshotUrl && (
        <Image
          alt=""
          src={snapshotUrl}
          fill
          sizes="100vw"
          className="absolute inset-0 select-none object-cover pointer-events-none"
          style={{
            ...(Object.create(null) as React.CSSProperties),
            ...((): React.CSSProperties => {
              const s: React.CSSProperties = {}
              ;(s as Record<string, unknown>)['viewTransitionName'] =
                `cluster-${item.id}`
              return s
            })(),
            zIndex: 5,
          }}
          unoptimized
          priority
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
