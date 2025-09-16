// src/components/timeline/CentralLine.tsx
import React from 'react'

type CentralLineProps = {
  colWidth: number
  lineX: number
  strokeWidth: number
  dash: number
  gap: number
  spacingVh: number
  padTop: number
  padBottom: number
  boxRef?: React.RefObject<HTMLDivElement | null>
  className?: string
}

export function CentralLine({
  colWidth,
  lineX,
  strokeWidth,
  dash,
  gap,
  spacingVh,
  padTop,
  padBottom,
  boxRef,
  className = '',
}: CentralLineProps) {
  return (
    <div
      ref={boxRef}
      className={`absolute left-1/2 -translate-x-1/2 pointer-events-none ${className}`}
      style={{
        top: `calc(${padTop} * ${spacingVh}vh)`,
        bottom: `calc(${padBottom} * ${spacingVh}vh)`,
        width: colWidth,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${colWidth} 100`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        <line
          x1={lineX}
          y1="0"
          x2={lineX}
          y2="100%"
          stroke="white"
          strokeOpacity="0.8"
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${gap}`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
