// @path: src/features/feed/components/slides/VideoSlide.tsx
'use client'

import type { FeedItem } from '@/features/feed'
import { Volume2, VolumeX } from 'lucide-react'
import { MouseEvent, TouchEvent } from 'react'

export default function VideoSlide({
  item,
  index,
  initialIndex,
  nextIndex,
  setVideoRefAt,
  dateLabel,
  isMuted,
  onToggleSound,
}: {
  item: FeedItem
  index: number
  initialIndex: number
  nextIndex: number
  setVideoRefAt: (i: number) => (el: HTMLVideoElement | null) => void
  dateLabel: string
  isMuted: boolean
  onToggleSound: () => void
}) {
  const stop = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation()
  }

  return (
    <>
      <video
        ref={setVideoRefAt(index)}
        className="absolute inset-0 h-full w-full object-cover"
        src={item.main_url ?? ''}
        playsInline
        muted
        autoPlay={index === initialIndex}
        preload={
          index === initialIndex || index === nextIndex ? 'auto' : 'metadata'
        }
        loop
      />

      <div className="absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 text-xs text-white space-y-1">
        <div>{dateLabel}</div>
        {item.lat != null && item.lng != null && (
          <div className="opacity-80">
            {Number(item.lat).toFixed(4)} / {Number(item.lng).toFixed(4)}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleSound}
        onMouseDown={stop}
        onTouchStart={stop}
        aria-pressed={!isMuted}
        aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        title={isMuted ? 'Activer le son' : 'Couper le son'}
        className="absolute bottom-3 right-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm text-white outline-none ring-0 hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        <span className="sr-only">
          {isMuted ? 'Activer le son' : 'Couper le son'}
        </span>
      </button>
    </>
  )
}
