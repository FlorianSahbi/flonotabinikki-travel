'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import BackgroundVideoCarousel from '../stories/BackgroundVideoCarousel'

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
  const sources = data.map((v) => v.videoUrl)
  const next = (0 + 1) % (data.length || 1)
  const titleClean = useMemo(
    () =>
      String(title)
        .replace(/[—–]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    [title]
  )

  if (!data.length) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black text-white">
        Aucune vidéo
      </div>
    )
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <BackgroundVideoCarousel
        sources={sources}
        intervalMs={slideMs}
        transitionMs={fadeMs}
        blurRange={[0, blurPx]}
        overlay
        className="pointer-events-none absolute inset-0"
      />

      {/* barres */}
      <div className="absolute inset-x-4 top-4 z-20 flex gap-2">
        {data.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded bg-white/25"
          >
            <div
              key={i === 0 ? `run-0` : `idle-${i < 0 ? 'full' : 'empty'}`}
              className="h-full bg-white"
              style={{
                width: i < 0 ? '100%' : i === 0 ? '0%' : '0%',
                animation:
                  i === 0 ? `fill ${slideMs}ms linear forwards` : undefined,
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
            key={0}
            className="max-w-[90vw] truncate"
            style={{
              animation: 'placeIn 200ms ease',
              willChange: 'opacity, transform',
            }}
          >
            {data[0]?.placeLabel || 'Japon'}
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
