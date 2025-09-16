// src/app/[lang]/timeline/[id]/page.tsx
'use client'

import { useEffect } from 'react'
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import {
  overviewCities,
  timelineEvents,
} from '@/components/timeline/timeline.data'
import { useTimelineShell } from '../layout'
import { DetailTimeline, TitleHero } from '@/components/timeline'

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function TimelineDetailPage() {
  const routeParams = useParams()
  const rawIdParam = (routeParams?.id ?? '') as string | string[]
  const numericId = Number(
    Array.isArray(rawIdParam) ? rawIdParam[0] : rawIdParam
  )

  const currentCity =
    overviewCities.find((candidateCity) => candidateCity.id === numericId) ??
    overviewCities[0]

  const { setCamera, backToOverview, setDetailModeAudio } = useTimelineShell()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setDetailModeAudio(true)
  }, [setDetailModeAudio])

  // ✅ Ajout de currentCity dans les deps
  useEffect(() => {
    const urlParams = new URLSearchParams(searchParams.toString())
    if (!urlParams.has('city') && currentCity) {
      const citySlug = (currentCity as any).slug ?? slugify(currentCity.title)
      urlParams.set('city', citySlug)
      router.replace(`${pathname}?${urlParams.toString()}`)
    }
  }, [pathname, router, searchParams, currentCity])

  return (
    <main className="relative">
      <button
        type="button"
        onClick={backToOverview}
        aria-label="Back to the list of cities"
        className="fixed left-4 top-4 z-40 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white/90 backdrop-blur transition hover:bg-white/16 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        ← Back
      </button>

      {currentCity && (
        <TitleHero
          title={currentCity.title}
          subtitle={currentCity.dateISO ?? '01 June 2024'}
          heightVh={50}
        />
      )}

      {timelineEvents.length > 0 && (
        <DetailTimeline
          events={timelineEvents}
          spacingVh={100}
          padTop={1.5}
          padBottom={1.5}
          onActiveEventChange={(activeEvent) => {
            if (!activeEvent?.camera) return
            const { center, zoom, pitch, bearing } = activeEvent.camera
            setCamera({
              center,
              zoom: zoom ?? 12,
              pitch: pitch ?? 40,
              bearing: bearing ?? 0,
            })
          }}
        />
      )}

      {currentCity && (
        <TitleHero
          title={currentCity.title}
          subtitle={currentCity.dateISO ?? '01 June 2024'}
          heightVh={0}
        />
      )}
    </main>
  )
}
