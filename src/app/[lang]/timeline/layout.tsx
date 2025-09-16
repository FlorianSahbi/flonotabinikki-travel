// src/app/[lang]/timeline/layout.tsx
'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import HeadlessSyncTracks from '@/components/audio/HeadlessSyncTracks'
import type { CameraView } from '@/components/timeline/timeline.data'
import { MapCanvas } from '@/components/timeline'

type TimelineShellContextType = {
  camera: CameraView
  setCamera: React.Dispatch<React.SetStateAction<CameraView>>
  setDetailModeAudio: (on: boolean) => void
  goToDetail: (id: number) => void
  backToOverview: () => void
}

const TimelineShellContext = createContext<TimelineShellContextType | null>(
  null
)

export const useTimelineShell = () => {
  const context = useContext(TimelineShellContext)
  if (!context)
    throw new Error('useTimelineShell must be used within timeline/layout')
  return context
}

const AUDIO_TRACKS = [
  { label: 'Overview', url: '/N1.mp3', gain: 1 },
  { label: 'Detail', url: '/N2.mp3', gain: 1 },
] as const

export const JAPAN_OVERVIEW: CameraView = {
  center: [134, 35],
  zoom: 4,
  pitch: 25,
  bearing: 0,
}

function ScrollResetOnPathChange() {
  const pathname = usePathname()

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'scrollRestoration' in window.history
    ) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const pathParts = pathname?.split('/').filter(Boolean) ?? []
    const isDetailPage =
      pathParts.length >= 3 && pathParts[1] === 'timeline' && pathParts[2]
    if (isDetailPage) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      })
    }
  }, [pathname])

  return null
}

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [camera, setCamera] = useState<CameraView>(JAPAN_OVERVIEW)

  const [activeAudioTrackIndex, setActiveAudioTrackIndex] = useState(0)
  const audioPlayingRef = useRef(true)

  const pathParts = pathname?.split('/').filter(Boolean) ?? []
  const currentLang = pathParts[0] ?? 'en'
  const isDetailPage =
    pathParts.length >= 3 && pathParts[1] === 'timeline' && pathParts[2]

  useEffect(() => {
    setActiveAudioTrackIndex(isDetailPage ? 1 : 0)
  }, [isDetailPage])

  const setDetailModeAudio = (on: boolean) => {
    setActiveAudioTrackIndex(on ? 1 : 0)
  }

  const getCurrentSearch = () =>
    typeof window !== 'undefined' ? window.location.search : ''

  const goToDetail = (id: number) => {
    router.push(`/${currentLang}/timeline/${id}${getCurrentSearch()}`)
  }

  const backToOverview = () => {
    router.push(`/${currentLang}/timeline${getCurrentSearch()}`, {
      scroll: false,
    })
  }

  return (
    <TimelineShellContext.Provider
      value={{
        camera,
        setCamera,
        setDetailModeAudio,
        goToDetail,
        backToOverview,
      }}
    >
      <ScrollResetOnPathChange />

      <HeadlessSyncTracks
        tracks={AUDIO_TRACKS as any}
        activeIndex={activeAudioTrackIndex}
        playing={audioPlayingRef.current}
        fadeMs={450}
      />

      <MapCanvas
        accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
        visible
        view={camera}
      />

      {children}
    </TimelineShellContext.Provider>
  )
}
