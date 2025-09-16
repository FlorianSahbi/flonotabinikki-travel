'use client'

import { CardsReveal, OverviewRail } from '@/components/timeline'
import {
  timelineEvents,
  overviewCities,
} from '@/components/timeline/timeline.data'
import { useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Entry as OverviewEntry } from '@/components/timeline/OverviewRail'
import {
  JAPAN_OVERVIEW,
  useTimelineShell,
} from '@/app/context/timeline/context'

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function TimelineOverviewPage() {
  const { easeTo, jumpTo, goToDetail } = useTimelineShell()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const entriesBySlug = useMemo(() => {
    const map = new Map<string, (typeof overviewCities)[number]>()
    for (const entry of overviewCities) {
      const slug = (entry as any).slug ?? slugify(entry.title)
      map.set(slug, entry)
    }
    return map
  }, [])

  const setQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  useEffect(() => {
    const cityParamRaw = searchParams.get('city')
    const citySlug = cityParamRaw ? slugify(cityParamRaw) : null
    const idParam = searchParams.get('id')

    const entry =
      (citySlug && entriesBySlug.get(citySlug)) ||
      (idParam && overviewCities.find((e) => String(e.id) === idParam)) ||
      null

    if (!entry) {
      jumpTo(JAPAN_OVERVIEW)
      return
    }

    easeTo(
      {
        center: entry.center,
        zoom: entry.zoom ?? 10.5,
        pitch: 25,
        bearing: 0,
      },
      { keepBearingOnViewChange: true }
    )
  }, [searchParams, entriesBySlug, easeTo, jumpTo])

  const handleCross = (entry: OverviewEntry | undefined) => {
    if (!entry) return
    const slug = (entry as any).slug ?? slugify(entry.title)
    setQueryParam('city', slug)
    easeTo(
      {
        center: entry.center,
        zoom: entry.zoom ?? 10.5,
        pitch: 25,
        bearing: 0,
      },
      { keepBearingOnViewChange: true }
    )
  }

  const handleExitTop = () => {
    setQueryParam('city', null)
    jumpTo(JAPAN_OVERVIEW)
  }

  const mediaItems = timelineEvents.slice(0, 6).map((evt) => {
    const isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(evt.image)
    return {
      kind: isVideo ? ('video' as const) : ('image' as const),
      src: evt.image,
    }
  })

  return (
    <main>
      <CardsReveal
        title="JAPAN ’24"
        subtitle="One-year journey across Japan"
        items={mediaItems}
      />

      <OverviewRail
        entries={overviewCities}
        spacingVh={50}
        crossBandPct={8}
        padTop={0}
        padBottom={1.5}
        trackerAlign="center"
        onExitTop={handleExitTop}
        onCross={(entry) => handleCross(entry)}
        onTitleClick={(id) => {
          const entry = overviewCities.find((e) => e.id === id)
          if (entry) {
            const slug = (entry as any).slug ?? slugify(entry.title)
            setQueryParam('city', slug)
          }
          goToDetail(id)
        }}
      />
    </main>
  )
}
