'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'

type BaseProps = {
  text: string
  className: string
  strokeWidth: number
  dash: string
  durationSec: number
  delaySec?: number
  opacity?: number
  clipId: string
  hoverFillSec: number
  fontPx: number
}

function HorizontalStrokeText({
  text,
  className,
  strokeWidth,
  dash,
  durationSec,
  delaySec = 0,
  opacity = 1,
  clipId,
  hoverFillSec,
  fontPx,
}: BaseProps) {
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

function VerticalStrokeText({
  text,
  className,
  strokeWidth,
  dash,
  durationSec,
  delaySec = 0,
  opacity = 1,
  clipId,
  hoverFillSec,
  fontPx,
  letterGapEm = -0.06,
}: BaseProps & { letterGapEm?: number }) {
  return (
    <svg
      className="mx-auto block overflow-visible"
      aria-hidden
      role="img"
      preserveAspectRatio="xMidYMin meet"
    >
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
        y="0"
        dominantBaseline="text-before-edge"
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
          writingMode: 'vertical-rl',
          textOrientation: 'upright',
          letterSpacing: `${letterGapEm}em`,
        }}
      >
        {text}
      </motion.text>

      <g clipPath={`url(#${clipId})`} opacity={opacity} pointerEvents="none">
        <text
          x="50%"
          y="0"
          dominantBaseline="text-before-edge"
          textAnchor="middle"
          className={className}
          fill="white"
          stroke="none"
          style={{
            fontSize: `${fontPx}px`,
            lineHeight: 1,
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            letterSpacing: `${letterGapEm}em`,
          }}
        >
          {text}
        </text>
      </g>
    </svg>
  )
}

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
  mobileFontPxTitle?: number
  mobileFontPxKanji?: number
  verticalMode?: 'mobile' | 'always' | 'never'
  mobileLetterGapEm?: number
  mobileTitleX?: number
  mobileTitleY?: number
  mobileKanjiX?: number
  mobileKanjiY?: number
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
  durationSec = 1.1,
  kanjiDelaySec = 0.08,
  hoverFillSec = 0.45,
  onClick,
  fontPxTitle = 136,
  fontPxKanji = 40,
  mobileFontPxTitle = 64,
  mobileFontPxKanji = 44,
  verticalMode = 'mobile',
  mobileLetterGapEm = -0.08,
  mobileTitleX = 0,
  mobileTitleY = 0,
  mobileKanjiX = 0,
  mobileKanjiY = 0,
}: Props) {
  const idBase = useId()
  const clipIdTitleH = `${idBase}-th`
  const clipIdKanjiH = `${idBase}-kh`
  const clipIdTitleV = `${idBase}-tv`
  const clipIdKanjiV = `${idBase}-kv`

  const showVertical =
    verticalMode === 'always'
      ? 'block'
      : verticalMode === 'never'
        ? 'hidden'
        : 'block md:hidden'
  const showHorizontal =
    verticalMode === 'always'
      ? 'hidden'
      : verticalMode === 'never'
        ? 'block'
        : 'hidden md:block'

  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial="rest"
      whileHover="hover"
    >
      <div className={showVertical}>
        {title && (
          <div
            style={{
              transform: `translate3d(${mobileTitleX}px, ${mobileTitleY}px, 0)`,
              willChange: 'transform',
            }}
          >
            <VerticalStrokeText
              text={title}
              className={titleClassName}
              strokeWidth={strokeWidthTitle}
              dash={dashTitle}
              durationSec={durationSec}
              clipId={clipIdTitleV}
              hoverFillSec={hoverFillSec}
              fontPx={mobileFontPxTitle}
              opacity={1}
              letterGapEm={mobileLetterGapEm}
            />
          </div>
        )}

        {kanji && (
          <div
            className="mt-2"
            style={{
              transform: `translate3d(${mobileKanjiX}px, ${mobileKanjiY}px, 0)`,
              willChange: 'transform',
            }}
          >
            <VerticalStrokeText
              text={kanji}
              className={kanjiClassName}
              strokeWidth={strokeWidthKanji}
              dash={dashKanji}
              durationSec={Math.max(0.85, durationSec * 0.9)}
              delaySec={kanjiDelaySec}
              clipId={clipIdKanjiV}
              hoverFillSec={hoverFillSec}
              fontPx={mobileFontPxKanji}
              opacity={0.9}
              letterGapEm={mobileLetterGapEm}
            />
          </div>
        )}
      </div>

      <div className={showHorizontal}>
        {title && (
          <HorizontalStrokeText
            text={title}
            className={titleClassName}
            strokeWidth={strokeWidthTitle}
            dash={dashTitle}
            durationSec={durationSec}
            clipId={clipIdTitleH}
            hoverFillSec={hoverFillSec}
            fontPx={fontPxTitle}
            opacity={1}
          />
        )}
        {kanji && (
          <div className="-mt-2">
            <HorizontalStrokeText
              text={kanji}
              className={kanjiClassName}
              strokeWidth={strokeWidthKanji}
              dash={dashKanji}
              durationSec={Math.max(0.85, durationSec * 0.9)}
              delaySec={kanjiDelaySec}
              clipId={clipIdKanjiH}
              hoverFillSec={hoverFillSec}
              fontPx={fontPxKanji}
              opacity={0.9}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
