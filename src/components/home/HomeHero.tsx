'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import BackgroundVideoCarousel from '@/components/stories/BackgroundVideoCarousel'

type RawItem = {
  id: string | number
  src?: string
  videoUrl?: string
  placeLabel?: string | null
}

type HomeHeroProps = {
  items?: RawItem[]
  title?: string
  cta?: { href: string; label: string }
  slideMs?: number
  fadeMs?: number
}

export default function HomeHero({
  items = [],
  title = 'PVT 2024 · Un an dans tout le Japon',
  cta = { href: '/explore', label: 'Entrer' },
  slideMs = 4200,
  fadeMs = 750,
}: HomeHeroProps) {
  const data = useMemo(
    () =>
      (items || [])
        .map((item) => ({
          id: item.id,
          src: item.src || item.videoUrl,
          placeLabel: item.placeLabel,
        }))
        .filter((item) => item.id && item.src),
    [items]
  )

  const sources = useMemo(() => data.map((d) => d.src as string), [data])

  // Index courant (synchro depuis le carrousel)
  const [current, setCurrent] = useState(0)
  const prefersReduced = useReducedMotion()
  const activeDuration = prefersReduced ? 0 : slideMs / 1000

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <BackgroundVideoCarousel
          sources={sources}
          intervalMs={slideMs}
          fadeMs={fadeMs}
          className="absolute inset-0"
          onIndexChange={setCurrent}
        />
      </div>

      {/* barres: passé = plein, courant = anim, futur = vide (Framer Motion) */}
      <div className="absolute inset-x-4 top-4 z-20 flex gap-2">
        {data.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded bg-white/25"
          >
            <motion.div
              key={i === current ? `active-${current}` : `idle-${i}`}
              className="h-full bg-white"
              initial={{ width: i < current ? '100%' : '0%' }}
              animate={{
                width: i === current ? '100%' : i < current ? '100%' : '0%',
              }}
              transition={{
                duration: i === current ? activeDuration : 0,
                ease: 'linear',
              }}
            />
          </div>
        ))}
      </div>

      {/* Titre + CTA (CTA Option B propre) */}
      <div className="relative z-30 flex h-full flex-col items-center justify-center px-6 text-center">
        <h1 className="leading-[0.95] tracking-tight">
          <span
            className="bg-gradient-to-b from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)]"
            style={{ fontSize: 'clamp(3rem,8vw,6.25rem)' }}
          >
            {title}
          </span>
        </h1>

        <motion.div
          className="mt-8"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <div className="relative inline-flex rounded-full p-[2px] bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500">
            <Link
              href={cta.href}
              aria-label={cta.label}
              className="group relative inline-flex items-center gap-2 rounded-full
                         px-8 py-3.5 text-lg font-semibold text-black
                         bg-white shadow-[0_8px_28px_rgba(0,0,0,0.35)] ring-1 ring-white/70
                         transition"
            >
              {cta.label}
              <svg
                className="h-5 w-5 -mr-0.5 transition-transform duration-300 group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12.293 4.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H4a1 1 0 110-2h10.586l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Lieu : ANIME TOUT le chip (fond + icône + texte) */}
      <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 text-xs text-white/95 will-change-transform"
            initial={{ opacity: 0, y: 8, scale: 0.98, rotate: -1 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, rotate: 1 }}
            transition={{
              duration: prefersReduced ? 0 : 0.35,
              ease: 'easeOut',
            }}
            style={{ maxWidth: '90vw' }}
          >
            <svg
              className="h-4 w-4 opacity-90"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2c-4.1 0-7.25 3.18-7.25 7.2 0 5.4 6.21 11.85 6.48 12.12.22.22.36.33.77.33s.55-.11.77-.33c.27-.27 6.48-6.72 6.48-12.12C19.25 5.18 16.1 2 12 2zm0 9.8a2.6 2.6 0 110-5.2 2.6 2.6 0 010 5.2z" />
            </svg>
            <span
              className="block whitespace-nowrap truncate"
              title={data[current]?.placeLabel || 'Japon'}
            >
              {data[current]?.placeLabel || 'Japon'}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
