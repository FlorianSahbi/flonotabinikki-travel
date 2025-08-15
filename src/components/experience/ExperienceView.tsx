'use client'

import { ArrowLeft, ChevronDown } from 'lucide-react'
import type { Tables } from '../../types/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import BackgroundVideoCarousel from '../stories/BackgroundVideoCarousel'

type ClusterRow = Tables<'clusters'>
type VideoRow = Tables<'videos'>
type ClusterWithVideos = ClusterRow & { videos: VideoRow[] }

export default function ExperienceView({ data }: { data: ClusterWithVideos }) {
  const sources = data.videos.map((v) => v.bucket_url).filter(Boolean)

  return (
    <div className="relative">
      <BackgroundVideoCarousel
        sources={sources}
        intervalMs={6000}
        transitionMs={1200}
        blurRange={[0, 18]}
        overlay
        className=" h-screen fixed"
      />

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
          className="mb-6"
        >
          <div className="mb-2 text-sm uppercase tracking-widest text-amber-400">
            Experience
          </div>
          <div className="text-sm text-white/70">
            16/07/2024 16:48 — 17/07/2024 20:02
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl bg-gradient-to-b from-white to-white/80 bg-clip-text text-4xl font-extrabold leading-tight text-transparent drop-shadow-lg md:text-6xl"
        >
          {data.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow-lg"
        >
          {data.description}
        </motion.p>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.6 }}
            className="absolute bottom-8 flex flex-col items-center"
          >
            <ChevronDown className="h-6 w-6 text-white animate-bounce" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 mt-24 px-8 py-16 text-white">
        <h2 className="mb-4 text-3xl drop-shadow-lg">
          L&apos;histoire derrière l&apos;événement
        </h2>
        <div className="relative max-w-3xl">
          <p className="relative text-white/90 drop-shadow-lg">
            long description
          </p>
        </div>
      </div>
    </div>
  )
}
