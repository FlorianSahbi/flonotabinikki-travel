'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type RawItem = {
  id: string
  videoUrl?: string
  src?: string
  placeLabel?: string | null
}
type Item = { id: string; videoUrl: string; placeLabel?: string | null }

export default function HomeHero({
  items = [],
  title = 'PVT 2024 Un an dans tout le Japon',
  cta = { href: '/fr/map', label: 'Entrer' },
  slideMs = 4200,
  fadeMs = 750,
  blurPx = 14,
}: {
  items?: RawItem[]
  title?: string
  cta?: { href: string; label: string }
  slideMs?: number
  fadeMs?: number
  blurPx?: number
}) {
  const data = useMemo<Item[]>(
    () =>
      items
        .map((it) => ({
          id: String(it.id ?? ''),
          videoUrl: String(it.videoUrl || it.src || ''),
          placeLabel: it.placeLabel ?? null,
        }))
        .filter((v) => v.id && v.videoUrl),
    [items]
  )

  const [active, setActive] = useState(0)
  const next = (active + 1) % (data.length || 1)

  const titleClean = useMemo(
    () =>
      String(title)
        .replace(/[—–]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    [title]
  )

  const refs = useRef<(HTMLVideoElement | null)[]>([])

  // avance toutes les slideMs
  useEffect(() => {
    if (data.length <= 1) return
    const t = setInterval(
      () => setActive((i) => (i + 1) % data.length),
      slideMs
    )
    return () => clearInterval(t)
  }, [data.length, slideMs])

  // play/pause minimal
  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return
      if (i === active) el.play?.().catch(() => {})
      else el.pause?.()
    })
  }, [active])

  if (!data.length) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black text-white">
        Aucune vidéo
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <link rel="preload" as="video" href={data[next]?.videoUrl} />

      <div className="pointer-events-none absolute inset-0">
        {data.map((v, i) => {
          const on = i === active
          return (
            <video
              key={v.id}
              ref={(el) => {
                if (el) refs.current[i] = el
              }}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: on ? 1 : 0,
                filter: on ? 'blur(0px)' : `blur(${blurPx}px)`,
                transition: `opacity ${fadeMs}ms ease, filter ${fadeMs}ms ease`,
              }}
              src={v.videoUrl}
              muted
              playsInline
              loop
              preload={on || i === next ? 'auto' : 'metadata'}
              autoPlay={on}
            />
          )
        })}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/65 to-transparent" />
      </div>

      {/* barres */}
      <div className="absolute inset-x-4 top-4 z-20 flex gap-2">
        {data.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded bg-white/25"
          >
            <div
              key={
                i === active
                  ? `run-${active}`
                  : `idle-${i < active ? 'full' : 'empty'}`
              }
              className="h-full bg-white"
              style={{
                width: i < active ? '100%' : i === active ? '0%' : '0%',
                animation:
                  i === active
                    ? `fill ${slideMs}ms linear forwards`
                    : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* titre + bouton */}
      <div className="relative z-30 flex h-full flex-col items-center justify-center px-6 text-center">
        <h1
          className="bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent font-extrabold tracking-tight leading-[1.05] drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]"
          style={{ fontSize: 'clamp(3rem,8vw,6rem)' }}
        >
          {titleClean}
        </h1>
        <Link
          href={cta.href}
          aria-label={cta.label}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-lg font-semibold text-black shadow-[0_6px_24px_rgba(0,0,0,0.25)] ring-1 ring-white/40 transition hover:scale-[1.02] hover:shadow-[0_10px_34px_rgba(0,0,0,0.3)] hover:ring-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          {cta.label}
          <svg
            className="h-5 w-5 -mr-0.5 transition-transform group-hover:translate-x-1"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H4a1 1 0 110-2h10.586l-2.293-2.293a1 1 0 010-1.414z" />
          </svg>
        </Link>
      </div>

      {/* Lieu */}
      <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 text-xs text-white/95">
          <svg
            className="h-4 w-4 opacity-90"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2c-4.1 0-7.25 3.18-7.25 7.2 0 5.4 6.21 11.85 6.48 12.12.22.22.36.33.77.33s.55-.11.77-.33c.27-.27 6.48-6.72 6.48-12.12C19.25 5.18 16.1 2 12 2zm0 9.8a2.6 2.6 0 110-5.2 2.6 2.6 0 010 5.2z" />
          </svg>
          <span
            key={active}
            className="max-w-[90vw] truncate"
            style={{
              animation: 'placeIn 200ms ease',
              willChange: 'opacity, transform',
            }}
          >
            {data[active]?.placeLabel || 'Japon'}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fill {
          to {
            width: 100%;
          }
        }
        @keyframes placeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
