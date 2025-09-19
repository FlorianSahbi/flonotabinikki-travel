// src/app/[lang]/timeline/[id]/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  overviewCities,
  type TimelineEvent,
} from '@/components/timeline/timeline.data'
import { DetailTimeline, TitleHero } from '@/components/timeline'
import { useTimelineShell } from '@/app/context/timeline/context'
import { slugify } from '@/lib/slugify'

async function loadCityEvents(slug: string): Promise<TimelineEvent[]> {
  try {
    const res = await fetch(`/data/timeline/${slug}.json`, {
      cache: 'force-cache',
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? (data as TimelineEvent[]) : (data.events ?? [])
  } catch {
    return []
  }
}

export default function TimelineDetailPage() {
  const routeParams = useParams()
  const rawIdParam = (routeParams?.id ?? '') as string | string[]
  const numericId = Number(
    Array.isArray(rawIdParam) ? rawIdParam[0] : rawIdParam
  )

  const currentCity =
    overviewCities.find((c) => c.id === numericId) ?? overviewCities[0]

  const { easeTo, setDetailModeAudio } = useTimelineShell()

  const searchParams = useSearchParams()
  const [events, setEvents] = useState<TimelineEvent[] | null>(null)

  useEffect(() => {
    setDetailModeAudio(true)
  }, [setDetailModeAudio])

  useEffect(() => {
    let cancelled = false
    const cityFromUrl = searchParams.get('city')
    const fallbackSlug = currentCity
      ? ((currentCity as any).slug ?? slugify(currentCity.title))
      : null
    const slug = cityFromUrl ? slugify(cityFromUrl) : fallbackSlug
    if (!slug) {
      setEvents([])
      return
    }
    ;(async () => {
      const evts = await loadCityEvents(slug)
      if (!cancelled) setEvents(evts)
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams, currentCity])

  const qs = searchParams?.toString()
  const backHref = `..${qs ? `?${qs}` : ''}`

  return (
    <main className="relative">
      <Link
        href={`timeline/${backHref}`}
        scroll={false}
        aria-label="Back to the list of cities"
        className="fixed left-4 top-4 z-40 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white/90 backdrop-blur transition hover:bg-white/16 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
      >
        ← Back
      </Link>

      {currentCity && <TitleHero title={currentCity.title} heightVh={50} />}

      {Array.isArray(events) && events.length > 0 && (
        <DetailTimeline
          events={events}
          spacingVh={100}
          onActiveEventChange={(activeEvent) => {
            const cam = activeEvent?.camera
            if (!cam) return
            const { center, zoom, pitch, bearing } = cam
            easeTo(
              {
                center,
                zoom: zoom ?? 12,
                pitch: pitch ?? 40,
                bearing: bearing ?? 0,
              },
              { duration: 900, keepBearingOnViewChange: false }
            )
          }}
        />
      )}
    </main>
  )
}
