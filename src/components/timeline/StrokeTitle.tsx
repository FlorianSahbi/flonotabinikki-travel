// src/components/timeline/StrokeTitle.tsx
'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'

type Props = {
  title?: string
  kanji?: string
  className?: string
  titleClassName?: string
  kanjiClassName?: string
  strokeWidthTitle?: number
  strokeWidthKanji?: number
  dashTitle?: string
  dashKanji?: string
  durationSec?: number
  kanjiDelaySec?: number
  hoverFillSec?: number
  onClick?: () => void
}

export default function StrokeTitle({
  title,
  kanji,
  className = 'inline-block text-center text-white cursor-pointer select-none',
  titleClassName = 'text-[12vw] leading-none font-extrabold tracking-tight',
  kanjiClassName = 'text-[4vw] leading-none font-medium',
  strokeWidthTitle = 2,
  strokeWidthKanji = 1,
  dashTitle = '5100',
  dashKanji = '5100',
  durationSec = 1.1,
  kanjiDelaySec = 0.08,
  hoverFillSec = 0.45,
  onClick,
}: Props) {
  const clipIdTitle = useId()
  const clipIdKanji = useId()

  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial="rest"
      whileHover="hover"
    >
      {title && (
        <StrokeLine
          text={title}
          textClassName={titleClassName}
          strokeWidth={strokeWidthTitle}
          dash={dashTitle}
          durationSec={durationSec}
          clipId={clipIdTitle}
          hoverFillSec={hoverFillSec}
          opacity={1}
        />
      )}

      {kanji && (
        <div className="mt-[-0.5rem]">
          <StrokeLine
            text={kanji}
            textClassName={kanjiClassName}
            strokeWidth={strokeWidthKanji}
            dash={dashKanji}
            durationSec={Math.max(0.85, durationSec * 0.9)}
            delaySec={kanjiDelaySec}
            clipId={clipIdKanji}
            hoverFillSec={hoverFillSec}
            opacity={0.9}
          />
        </div>
      )}
    </motion.div>
  )
}

function StrokeLine({
  text,
  textClassName,
  strokeWidth,
  dash,
  durationSec,
  delaySec = 0,
  opacity = 1,
  clipId,
  hoverFillSec,
}: {
  text: string
  textClassName: string
  strokeWidth: number
  dash: string
  durationSec: number
  delaySec?: number
  opacity?: number
  clipId: string
  hoverFillSec: number
}) {
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
        className={textClassName}
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
        style={{ vectorEffect: 'non-scaling-stroke' as any }}
      >
        {text}
      </motion.text>

      <g clipPath={`url(#${clipId})`} opacity={opacity} pointerEvents="none">
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className={textClassName}
          fill="white"
          stroke="none"
        >
          {text}
        </text>
      </g>
    </svg>
  )
}
