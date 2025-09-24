// @path: src/shared/ui/ViewportCenterLine.tsx
'use client'

import { motion } from 'framer-motion'

type Props = {
  show?: boolean
  vertical?: boolean
  horizontal?: boolean
  color?: string
  thickness?: number
  zIndex?: number
  crosshair?: boolean
}

export default function ViewportCenterLine({
  show = true,
  vertical = true,
  horizontal = true,
  color = 'rgba(255,255,255,0.35)',
  thickness = 1,
  zIndex = 60,
  crosshair = true,
}: Props) {
  if (!show) return null

  return (
    <>
      {vertical && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-0 -translate-x-1/2"
          style={{
            width: thickness,
            height: '100vh',
            background: color,
            zIndex,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}

      {horizontal && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed top-1/2 left-0 -translate-y-1/2"
          style={{
            height: thickness,
            width: '100vw',
            background: color,
            zIndex,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}

      {crosshair && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 6, height: 6, background: color, zIndex }}
          initial={{ scale: 0.9, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}
    </>
  )
}
