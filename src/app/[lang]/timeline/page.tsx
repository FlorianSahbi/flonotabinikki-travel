// src/app/[lang]/timeline/page.tsx
'use client'

import { CardsReveal, OverviewRail } from '@/components/timeline'
import {
  timelineEvents,
  overviewCities,
} from '@/components/timeline/timeline.data'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const { easeTo, jumpTo, flyTo, goToDetail } = useTimelineShell()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const RAIL_SPACING_VH = 50
  const RAIL_PAD_TOP = 0

  const railRootRef = useRef<HTMLDivElement | null>(null)
  const didRestoreRef = useRef(false)
  const [initialActiveIndex, setInitialActiveIndex] = useState<
    number | undefined
  >(undefined)

  const entriesBySlug = useMemo(() => {
    const map = new Map<string, (typeof overviewCities)[number]>()
    for (const entry of overviewCities) {
      const slug = (entry as any).slug ?? slugify(entry.title)
      map.set(slug, entry)
    }
    return map
  }, [])

  const setQueryParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) params.delete(key)
      else params.set(key, value)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

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

  const handleCross = useCallback(
    (entry: OverviewEntry | undefined) => {
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
    },
    [easeTo, setQueryParam]
  )

  const handleExitTop = useCallback(() => {
    flyTo(JAPAN_OVERVIEW)
  }, [flyTo])

  useEffect(() => {
    try {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual'
      }
    } catch {}

    if (didRestoreRef.current) return
    didRestoreRef.current = true

    // Détection reload (API Navigation Timing + fallback legacy)
    let isReload = false
    try {
      const entries = performance.getEntriesByType?.('navigation') as
        | PerformanceNavigationTiming[]
        | undefined

      const reloadByEntries = entries?.[0]?.type === 'reload'
      const legacyReload = (performance as any)?.navigation?.type === 1

      isReload = !!reloadByEntries || !!legacyReload
    } catch {}

    if (!isReload) return

    const params = new URLSearchParams(window.location.search)
    const cityParam = params.get('city')
    if (!cityParam) return

    const slug = slugify(cityParam)
    const entry = entriesBySlug.get(slug)
    if (!entry) return

    const index = overviewCities.findIndex((e) => e.id === entry.id)
    if (index < 0) return

    const containerEl = railRootRef.current
    if (!containerEl) return

    const vhPx = window.innerHeight / 100
    const yInContainerPx = (RAIL_PAD_TOP + index) * RAIL_SPACING_VH * vhPx

    const rect = containerEl.getBoundingClientRect()
    const containerTopPx = rect.top + window.scrollY

    const targetScrollY =
      containerTopPx + yInContainerPx - Math.round(window.innerHeight / 2)

    requestAnimationFrame(() => {
      window.scrollTo(0, Math.max(0, targetScrollY))
      handleCross(entry as unknown as OverviewEntry)
      setInitialActiveIndex(index)
    })
  }, [entriesBySlug, handleCross])

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

      <div ref={railRootRef}>
        <OverviewRail
          entries={overviewCities}
          spacingVh={RAIL_SPACING_VH}
          crossBandPct={8}
          padTop={RAIL_PAD_TOP}
          padBottom={1.5}
          trackerAlign="center"
          onExitTop={handleExitTop}
          onCross={(entry) => handleCross(entry)}
          {...(initialActiveIndex !== undefined ? { initialActiveIndex } : {})}
          onTitleClick={(id) => {
            const entry = overviewCities.find((e) => e.id === id)
            if (entry) {
              const slug = (entry as any).slug ?? slugify(entry.title)
              setQueryParam('city', slug)
            }
            goToDetail(id)
          }}
        />
      </div>
    </main>
  )
}
