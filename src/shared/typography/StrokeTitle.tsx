// @path: src/shared/typography/StrokeTitle.tsx
'use client'

import { motion } from 'framer-motion'
import StrokeText from './StrokeText'

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
  fontPxTitle?: number
  fontPxKanji?: number
}

export default function StrokeTitle({
  title,
  kanji,
  className = 'inline-block text-white cursor-pointer select-none',
  titleClassName = 'leading-none font-extrabold tracking-tight',
  kanjiClassName = 'leading-none font-medium',
  strokeWidthTitle = 2,
  strokeWidthKanji = 1,
  dashTitle = '5100',
  dashKanji = '5100',
  durationSec = 1.0,
  kanjiDelaySec = 0.08,
  hoverFillSec = 0.45,
  onClick,
  fontPxTitle = 136,
  fontPxKanji = 40,
}: Props) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial="rest"
      whileHover="hover"
    >
      {title && (
        <StrokeText
          text={title}
          className={titleClassName}
          strokeWidth={strokeWidthTitle}
          dash={dashTitle}
          durationSec={durationSec}
          hoverFillSec={hoverFillSec}
          fontPx={fontPxTitle}
          opacity={1}
          clipIdPrefix="title"
        />
      )}

      {kanji && (
        <div className="-mt-2">
          <StrokeText
            text={kanji}
            className={kanjiClassName}
            strokeWidth={strokeWidthKanji}
            dash={dashKanji}
            durationSec={Math.max(0.85, durationSec * 0.9)}
            delaySec={kanjiDelaySec}
            hoverFillSec={hoverFillSec}
            fontPx={fontPxKanji}
            opacity={0.9}
            clipIdPrefix="kanji"
          />
        </div>
      )}
    </motion.div>
  )
}
