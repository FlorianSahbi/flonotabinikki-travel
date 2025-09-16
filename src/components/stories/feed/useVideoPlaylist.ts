// src/components/stories/StoriesFeed/useVideoPlaylist.ts
'use client'

import { useRef, useState } from 'react'

export function useVideoPlaylist() {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [isMuted, setIsMuted] = useState(true) // son global coupé par défaut

  const setVideoRefAt = (index: number) => (el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el
  }

  // applique l’état audio correct en fonction du slide actif
  const applyAudioState = (activeIndex: number, muted = isMuted) => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      v.muted = muted || i !== activeIndex // si son ON, seul l'actif est non-mute
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
      // met à jour immédiatement les éléments vidéo
      videoRefs.current.forEach((v, i) => {
        if (!v) return
        v.muted = next || i !== activeIndex
        if (!v.muted) {
          // déverrouille l’audio après geste utilisateur
          v.play().catch(() => {})
          v.volume = 1
        }
      })
      return next
    })
  }

  return { setVideoRefAt, playForIndex, isMuted, toggleSound }
}
