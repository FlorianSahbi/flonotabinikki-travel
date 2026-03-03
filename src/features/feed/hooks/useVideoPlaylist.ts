// @path: src/features/feed/hooks/useVideoPlaylist.ts
'use client'

import { useCallback, useRef, useState } from 'react'

// How many videos to preload ahead/behind
const PRELOAD_AHEAD = 2
const PRELOAD_BEHIND = 1

export function useVideoPlaylist() {
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const [isMuted, setIsMuted] = useState(true)
  const lastActiveRef = useRef<number>(-1)

  const setVideoRefAt = (index: number) => (el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(index, el)
    } else {
      videoRefs.current.delete(index)
    }
  }

  const applyAudioState = (activeIndex: number, muted = isMuted) => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      v.muted = muted || i !== activeIndex
    })
  }

  // Preload videos around active index
  const preloadAround = useCallback((activeIndex: number) => {
    const start = Math.max(0, activeIndex - PRELOAD_BEHIND)
    const end = activeIndex + PRELOAD_AHEAD

    videoRefs.current.forEach((video, idx) => {
      if (!video) return

      const shouldPreload = idx >= start && idx <= end
      const isActive = idx === activeIndex

      if (shouldPreload && !isActive) {
        // Preload by setting preload attribute and triggering load
        if (video.preload !== 'auto') {
          video.preload = 'auto'
          video.load()
        }
      } else if (!shouldPreload && !isActive) {
        // Unload videos far from active to save memory
        video.preload = 'none'
        video.pause()
        // Clear the src to release memory (optional, more aggressive)
        // video.removeAttribute('src')
        // video.load()
      }
    })
  }, [])

  const playForIndex = useCallback(
    (activeIndex: number) => {
      // Skip if same index
      if (lastActiveRef.current === activeIndex) return
      lastActiveRef.current = activeIndex

      videoRefs.current.forEach((v, i) => {
        if (!v) return
        if (i === activeIndex) {
          v.preload = 'auto'
          v.play().catch(() => {})
        } else {
          v.pause()
          try {
            v.currentTime = 0
          } catch {}
        }
      })

      applyAudioState(activeIndex)
      preloadAround(activeIndex)
    },
    [preloadAround]
  )

  const toggleSound = useCallback((activeIndex: number) => {
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
  }, [])

  // Cleanup function to release all video resources
  const cleanup = useCallback(() => {
    videoRefs.current.forEach((v) => {
      if (v) {
        v.pause()
        v.preload = 'none'
      }
    })
    videoRefs.current.clear()
  }, [])

  return {
    setVideoRefAt,
    playForIndex,
    isMuted,
    toggleSound,
    preloadAround,
    cleanup,
  }
}
