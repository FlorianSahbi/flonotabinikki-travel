'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  AnimatePresence,
} from 'framer-motion'

type EventVideo = { id: string; src: string }
type EventData = {
  type: string
  title: string
  description: string
  longDescription: string
  startDate: string
  endDate: string
  videos: EventVideo[]
}

export default function ExperienceView({ event }: { event: EventData }) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const { scrollY } = useScroll()
  const blurPx = useTransform(scrollY, [0, 120], [0, 18])
  const blurFilter = useMotionTemplate`blur(${blurPx}px) saturate(1.08) contrast(1.06)`
  const titleY = useTransform(scrollY, [0, 400], [0, -200])
  const titleOpacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 100) setShowScrollIndicator(false)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (event.videos.length > 1) {
      const it = setInterval(
        () => setCurrentVideoIndex((i) => (i + 1) % event.videos.length),
        6000
      )
      return () => clearInterval(it)
    }
  }, [event.videos.length])

  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return
      if (i === currentVideoIndex) el.play?.().catch(() => {})
      else {
        el.pause?.()
        try {
          el.currentTime = 0
        } catch {}
      }
    })
  }, [currentVideoIndex])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div className="relative min-h-screen">
      {/* Fond vidéo couvre toute la page */}
      <motion.div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div className="absolute inset-0 overflow-hidden">
          {event.videos.map((v, i) => {
            const active = i === currentVideoIndex
            return (
              <video
                key={v.id}
                ref={(el) => {
                  videoRefs.current[i] = el
                }}
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: active ? 1 : 0,
                  transition: 'opacity 1.2s ease',
                }}
                src={v.src}
                muted
                loop
                playsInline
                preload={active ? 'auto' : 'metadata'}
              />
            )
          })}
          {/* Overlay: blur rapide */}
          <motion.div
            className="absolute inset-0"
            style={{
              backdropFilter: blurFilter as unknown as string,
              WebkitBackdropFilter: blurFilter as unknown as string,
            }}
          />
          {/* Gradients pour la lisibilité */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/30 to-transparent" />
        </motion.div>
      </motion.div>

      {/* contenu du hero */}
      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-8 text-center text-white">
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => history.back()}
          className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/40 p-3 backdrop-blur-sm transition hover:bg-black/60"
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ y: titleY, opacity: titleOpacity }}
          className="mb-6"
        >
          <div className="mb-2 text-sm uppercase tracking-widest text-amber-400">
            {event.type}
          </div>
          <div className="text-sm text-white/70">
            {fmt(event.startDate)} — {fmt(event.endDate)}
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          style={{ y: titleY, opacity: titleOpacity }}
          className="max-w-4xl bg-gradient-to-b from-white to-white/80 bg-clip-text text-4xl font-extrabold leading-tight text-transparent drop-shadow-lg md:text-6xl"
        >
          {event.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ y: titleY, opacity: titleOpacity }}
          className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow-lg"
        >
          {event.description}
        </motion.p>

        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.6 }}
              className="absolute bottom-8 flex flex-col items-center"
            >
              <ChevronDown className="h-6 w-6 text-white animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* contenu après le hero — arrive vite sous le hero */}
      <div className="relative z-10 mt-24 px-8 py-16 text-white">
        <h2 className="mb-4 text-3xl drop-shadow-lg">
          L&apos;histoire derrière l&apos;événement
        </h2>
        <div className="relative max-w-3xl">
          <div className="absolute inset-0 rounded-lg bg-black/30 backdrop-blur-md -z-10" />
          <p className="relative text-white/90 drop-shadow-lg">
            {event.longDescription}
          </p>
        </div>
      </div>
    </div>
  )
}
