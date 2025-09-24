// @path: src/shared/ui/PageTransition.tsx
'use client'

import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function PageTransition({
  isVisible,
  title,
  subtitle,
  backgroundImage,
  onComplete,
  children,
}: {
  isVisible: boolean
  title: string
  subtitle?: string
  backgroundImage?: string
  onComplete?: () => void
  children?: React.ReactNode
}) {
  const rnd = useMemo(() => mulberry32(hashString(title)), [title])

  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${rnd() * 100}%`,
        top: `${rnd() * 100}%`,
        duration: 3 + rnd() * 4,
        delay: rnd() * 3,
      })),
    [rnd]
  )

  const words = useMemo(() => title.trim().split(/\s+/), [title])
  const softEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

  const headingVariants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.25, staggerChildren: 0.08 } },
    exit: {},
  } as const

  const wordVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: softEase },
    },
  } as const

  const subtitleVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.8, ease: softEase },
    },
  } as const

  const childrenVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: 1.0, ease: softEase },
    },
  } as const

  return (
    <AnimatePresence
      {...(onComplete ? { onExitComplete: onComplete } : {})}
      mode="wait"
    >
      {isVisible && (
        <motion.div
          key="page-transition"
          className="fixed inset-0 z-[9999] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: softEase }}
          role="dialog"
          aria-modal="true"
        >
          {backgroundImage && (
            <motion.div
              className="absolute inset-0 bg-center bg-cover will-change-transform"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                filter: 'blur(1px) brightness(0.35)',
              }}
              initial={{ scale: 1.06, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.35 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 1.1, ease: softEase }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />

          <motion.div
            className="absolute inset-0 flex items-center justify-center px-6"
            initial={{ opacity: 0, y: 60, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 1.01 }}
            transition={{ delay: 0.2, duration: 0.8, ease: softEase }}
          >
            <div className="text-center select-none">
              <motion.h1
                className="text-white tracking-wider leading-none text-5xl md:text-7xl lg:text-8xl font-semibold"
                variants={headingVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {words.map((w, i) => (
                  <motion.span
                    key={`${w}-${i}`}
                    className="inline-block align-top mx-1.5"
                    variants={wordVariants}
                  >
                    {w}
                  </motion.span>
                ))}
              </motion.h1>

              {subtitle && (
                <motion.p
                  className="mt-4 text-amber-400 text-xs md:text-sm tracking-widest uppercase"
                  variants={subtitleVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  {subtitle}
                </motion.p>
              )}

              {children && (
                <motion.div
                  className="mt-6"
                  variants={childrenVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  {children}
                </motion.div>
              )}
            </div>
          </motion.div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-px h-px bg-white rounded-full opacity-50"
                style={{ left: p.left, top: p.top }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.7, 0],
                  y: [0, -160, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: softEase,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
