// @path: src/shared/typography/StrokeText.tsx
'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'

type Props = {
  text: string
  className?: string
  strokeWidth?: number
  dash?: string
  durationSec?: number
  delaySec?: number
  opacity?: number
  hoverFillSec?: number
  fontPx?: number
  clipIdPrefix?: string
}

export default function StrokeText({
  text,
  className = 'leading-none font-extrabold tracking-tight',
  strokeWidth = 2,
  dash = '5100',
  durationSec = 1.0,
  delaySec = 0,
  opacity = 1,
  hoverFillSec = 0.45,
  fontPx = 136,
  clipIdPrefix,
}: Props) {
  const uid = useId()
  const clipId = `${clipIdPrefix ?? 'st'}-${uid}`

  return (
    <svg className="mx-auto block overflow-visible" aria-hidden role="img">
      <defs>
        <clipPath id={clipId} clipPathUnits="objectBoundingBox">
          <motion.circle
            cx={0.5}
            cy={0.5}
            r={0}
            variants={{ rest: { r: 0 }, hover: { r: 0.82 } }}
            transition={{ duration: hoverFillSec, ease: [0.4, 0, 0.2, 1] }}
          />
        </clipPath>
      </defs>

      <motion.text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className={className}
        fill="transparent"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="bevel"
        strokeDasharray={dash}
        initial={{ strokeDashoffset: 240, opacity: 0 }}
        animate={{ strokeDashoffset: 2100, opacity }}
        transition={{
          duration: durationSec,
          delay: delaySec,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          vectorEffect: 'non-scaling-stroke' as any,
          fontSize: `${fontPx}px`,
          lineHeight: 1,
        }}
      >
        {text}
      </motion.text>

      <g clipPath={`url(#${clipId})`} opacity={opacity} pointerEvents="none">
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className={className}
          fill="white"
          stroke="none"
          style={{ fontSize: `${fontPx}px`, lineHeight: 1 }}
        >
          {text}
        </text>
      </g>
    </svg>
  )
}
