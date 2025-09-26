// @path: src/shared/typography/MobileFillTitle.tsx
'use client'

import { motion } from 'framer-motion'
import React from 'react'

type Props = {
  title?: string
  kanji?: string
  onClick?: () => void
  /** 0→1 progression de section (entre l’item courant et le suivant) */
  progress?: number

  /** Tailles fixes (px) */
  titleFontPx?: number // défaut 56
  kanjiFontPx?: number // défaut 34

  /** Épaisseur du contour (px) */
  strokeWidthTitlePx?: number // défaut 1
  strokeWidthKanjiPx?: number // défaut 0.75

  /** Largeur max du bloc (en vw) */
  maxWidthVw?: number // défaut 96

  /** Espace vertical entre titre et kanji (px) */
  gapPx?: number // défaut 10

  /** Décalage vertical du bloc (px). Négatif = plus haut. */
  offsetYPx?: number // défaut 0

  /** Plateau plein entre start & end, rampes lissées autour */
  plateauStart?: number // défaut 0.25
  plateauEnd?: number // défaut 0.75
  ramp?: number // défaut 0.10
  fadeMs?: number // défaut 260
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(
    0,
    Math.min(1, (x - edge0) / Math.max(1e-6, edge1 - edge0))
  )
  return t * t * (3 - 2 * t)
}

export default function MobileFillTitle({
  title,
  kanji,
  onClick,
  progress = 0,

  titleFontPx = 56,
  kanjiFontPx = 34,

  strokeWidthTitlePx = 1,
  strokeWidthKanjiPx = 0.75,

  maxWidthVw = 96,
  gapPx = 10,
  offsetYPx = 0,

  plateauStart = 0.25,
  plateauEnd = 0.75,
  ramp = 0.1,
  fadeMs = 260,
}: Props) {
  // plateau lissé 0→1→0
  const p = Math.max(0, Math.min(1, progress))
  const s = Math.max(0, Math.min(1, plateauStart))
  const e = Math.max(s, Math.min(1, plateauEnd))
  const r = Math.max(0.01, Math.min(0.25, ramp))
  const up = smoothstep(s - r, s + r, p)
  const down = 1 - smoothstep(e - r, e + r, p)
  const fillAlpha = Math.min(up, down)

  const transition = `opacity ${fadeMs}ms cubic-bezier(0.22,1,0.36,1)`

  // Conteneur commun aux 2 couches → largeur/centrage strictement identiques
  const containerStyle: React.CSSProperties = {
    maxWidth: `${maxWidthVw}vw`,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  }

  const baseTitleStyle: React.CSSProperties = {
    fontSize: `${titleFontPx}px`,
    lineHeight: 1.06,
    letterSpacing: '-0.01em',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    width: '100%',
    margin: 0,
  }

  const baseKanjiStyle: React.CSSProperties = {
    fontSize: `${kanjiFontPx}px`,
    lineHeight: 1.06,
    letterSpacing: '-0.005em',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    width: '100%',
    margin: 0,
  }

  return (
    <motion.div
      className="relative block select-none"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      // Framer combine `y` avec scale, parfait pour un décalage simple
      style={{ ...containerStyle, y: offsetYPx }}
    >
      {/* couche “fill” derrière */}
      <div className="pointer-events-none block w-full">
        {title && (
          <p
            className="font-extrabold leading-none tracking-tight block w-full"
            style={{
              ...baseTitleStyle,
              color: 'white',
              opacity: fillAlpha,
              transition,
              marginBottom: `${gapPx}px`,
            }}
          >
            {title}
          </p>
        )}
        {kanji && (
          <p
            className="font-medium leading-none block w-full"
            style={{
              ...baseKanjiStyle,
              color: 'white',
              opacity: fillAlpha * 0.9,
              transition,
            }}
          >
            {kanji}
          </p>
        )}
      </div>

      {/* couche “stroke” au-dessus (même structure, même width) */}
      <div className="pointer-events-none absolute inset-0 block w-full">
        <div className="block w-full" style={containerStyle}>
          {title && (
            <p
              className="font-extrabold leading-none tracking-tight block w-full"
              style={{
                ...baseTitleStyle,
                WebkitTextStroke: `${strokeWidthTitlePx}px white`,
                color: 'transparent',
                marginBottom: `${gapPx}px`,
              }}
            >
              {title}
            </p>
          )}
          {kanji && (
            <p
              className="font-medium leading-none block w-full"
              style={{
                ...baseKanjiStyle,
                WebkitTextStroke: `${strokeWidthKanjiPx}px white`,
                color: 'transparent',
                opacity: 0.9,
              }}
            >
              {kanji}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
