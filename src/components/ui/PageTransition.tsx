// src/components/ui/PageTransition.tsx
'use client'

import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

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
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      })),
    []
  )

  const words = useMemo(() => title.trim().split(/\s+/), [title])

  return (
    <AnimatePresence
      {...(onComplete ? { onExitComplete: onComplete } : {})}
      initial={false}
    >
      {isVisible && (
        <motion.div
          key="page-transition"
          className="fixed inset-0 z-[9999] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
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
              initial={{ scale: 1.12, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />

          <motion.div
            className="absolute inset-0 flex items-center justify-center px-6"
            initial={{ opacity: 0, y: 80, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 1.02 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.2, 0, 0.2, 1] }}
          >
            <div className="text-center select-none">
              <h1 className="text-white tracking-wider leading-none text-5xl md:text-7xl lg:text-8xl font-semibold">
                {words.map((w, i) => (
                  <motion.span
                    key={`${w}-${i}`}
                    className="inline-block align-top mx-1.5"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 + i * 0.12 }}
                  >
                    {w}
                  </motion.span>
                ))}
              </h1>

              {subtitle && (
                <motion.p
                  className="mt-4 text-amber-400 text-xs md:text-sm tracking-widest uppercase"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  {subtitle}
                </motion.p>
              )}

              {children && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
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
                className="absolute w-px h-px bg-white rounded-full opacity-60"
                style={{ left: p.left, top: p.top }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: [0, -200, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
