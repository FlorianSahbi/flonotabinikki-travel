// @path: src/features/feed/hooks/useVideoPlaylist.ts
'use client'

import { useRef, useState } from 'react'

export function useVideoPlaylist() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [isMuted, setIsMuted] = useState(true)

  const setVideoRefAt = (index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el
  }

  const applyAudioState = (activeIndex: number, muted = isMuted) => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      v.muted = muted || i !== activeIndex
    })
  }

  const playForIndex = (activeIndex: number) => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === activeIndex) {
        v.play().catch(() => {})
      } else {
        v.pause()
        try {
          v.currentTime = 0
        } catch {}
      }
    })
    applyAudioState(activeIndex)
  }

  const toggleSound = (activeIndex: number) => {
    setIsMuted((prev) => {
      const next = !prev
      videoRefs.current.forEach((v, i) => {
        if (!v) return
        v.muted = next || i !== activeIndex
        if (!v.muted) {
          v.play().catch(() => {})
          v.volume = 1
        }
      })
      return next
    })
  }

  return { setVideoRefAt, playForIndex, isMuted, toggleSound }
}
