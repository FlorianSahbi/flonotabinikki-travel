// src/app/[lang]/timeline/page.tsx
'use client'

import Link from 'next/link'
import { CardsReveal } from '@/components/timeline'
import OverviewRailSections, {
  type Entry as RailEntry,
} from '@/components/timeline/OverviewRail'
import {
  timelineEvents,
  overviewCities,
} from '@/components/timeline/timeline.data'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useTimelineCtx } from '@/app/context/timeline/context'
import { slugify } from '@/lib/slugify'
import scrollIntoView from 'scroll-into-view-if-needed'
import StrokeTitle from '@/components/timeline/StrokeTitle'
import ViewportCenterLine from '@/components/timeline/ViewportCenterLine'
import { CAM_PRESET } from '@/lib/mapbox/cameraPresets' // ⬅️ NEW

export default function TimelineOverviewPage() {
  const { easeTo, isMapReady, setDetailModeAudio } = useTimelineCtx() // ⬅️ get setDetailModeAudio
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const didRestoreRef = useRef(false)
  const [initialActiveIndex, setInitialActiveIndex] = useState<
    number | undefined
  >(undefined)
  const itemElsRef = useRef(new Map<string, HTMLElement>())

  const getSlug = useCallback(
    (e: { title: string; [k: string]: any }) => e.slug ?? slugify(e.title),
    []
  )

  const handleItemRef = useCallback(
    ({ slug, el }: { id: number; slug: string; el: HTMLElement | null }) => {
      const map = itemElsRef.current
      if (el) map.set(slug, el)
      else map.delete(slug)
    },
    []
  )

  const entriesBySlug = useMemo(() => {
    const map = new Map<string, (typeof overviewCities)[number]>()
    for (const entry of overviewCities) {
      map.set(getSlug(entry as any), entry)
    }
    return map
  }, [getSlug])

  const setQueryParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null) params.delete(key)
      else params.set(key, value)
      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      router.replace(url, { scroll: false })
    },
    [pathname, searchParams, router]
  )

  const [activeEntry, setActiveEntry] = useState<RailEntry | null>(null)

  const pendingRef = useRef<RailEntry | null>(null)
  const flyToEntry = useCallback(
    (entry: RailEntry) => {
      const doIt = () =>
        easeTo(
          {
            center: entry.center,
            zoom: entry.zoom ?? CAM_PRESET.overview.zoom, // overview preset
            pitch: CAM_PRESET.overview.pitch,
            bearing: CAM_PRESET.overview.bearing,
          },
          { keepBearingOnViewChange: false }
        )
      if (isMapReady) doIt()
      else pendingRef.current = entry
    },
    [easeTo, isMapReady]
  )

  useEffect(() => {
    if (isMapReady && pendingRef.current) {
      const e = pendingRef.current
      pendingRef.current = null
      flyToEntry(e)
    }
  }, [isMapReady, flyToEntry])

  const handleCross = useCallback(
    (entry?: RailEntry) => {
      if (!entry) return
      setActiveEntry(entry)
      const slug = getSlug(entry as any)
      setQueryParam('city', slug)
      flyToEntry(entry)
    },
    [getSlug, setQueryParam, flyToEntry]
  )

  useEffect(() => {
    if (didRestoreRef.current) return
    didRestoreRef.current = true

    const cityParam = searchParams.get('city')
    if (!cityParam) return

    const slug = slugify(cityParam)
    const entry = entriesBySlug.get(slug)
    if (!entry) return

    const index = overviewCities.findIndex((e) => e.id === entry.id)
    if (index < 0) return
    setInitialActiveIndex(index)

    requestAnimationFrame(() => {
      const el =
        itemElsRef.current.get(slug) ||
        document.querySelector<HTMLElement>(`[data-city-id="${entry.id}"]`)

      if (el) {
        scrollIntoView(el, {
          block: 'center',
          inline: 'nearest',
          behavior: 'auto',
          scrollMode: 'if-needed',
        })
      }
    })
  }, [searchParams, entriesBySlug])

  const mediaItems = timelineEvents.slice(0, 6).map((evt) => {
    return { kind: 'video' as const, src: evt.image }
  })

  const qs = searchParams?.toString()
  const suffix = qs ? `?${qs}` : ''

  return (
    <main className="relative">
      <div className="pointer-events-none fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 text-center">
        {activeEntry && (
          <Link
            href={`timeline/${activeEntry.id}${suffix}`}
            scroll={false}
            className="pointer-events-auto inline-block"
            onClick={() => {
              setDetailModeAudio(true)
              easeTo(
                {
                  center: activeEntry.center,
                  zoom: CAM_PRESET.detail.zoom,
                  pitch: CAM_PRESET.detail.pitch,
                  bearing: CAM_PRESET.detail.bearing,
                },
                { duration: 600, keepBearingOnViewChange: false }
              )
            }}
          >
            <StrokeTitle
              title={activeEntry.title}
              {...(activeEntry.kanji ? { kanji: activeEntry.kanji } : {})}
              className="inline-block cursor-pointer text-white"
              titleClassName="text-[10vw] leading-none font-extrabold tracking-tight"
              kanjiClassName="text-[3.6vw] leading-none font-medium"
              strokeWidthTitle={2}
              strokeWidthKanji={1}
              dashTitle="5100"
              dashKanji="5100"
              durationSec={1.0}
              kanjiDelaySec={0.08}
              hoverFillSec={0.45}
            />
          </Link>
        )}
      </div>

      <CardsReveal
        title="JAPAN ’24"
        subtitle="One-year journey across Japan"
        items={mediaItems}
      />

      <ViewportCenterLine />

      <OverviewRailSections
        entries={overviewCities}
        sectionVh={75}
        dotSizePx={16}
        showTrackerLine
        onCross={(e) => handleCross(e)}
        onItemRef={handleItemRef}
        {...(initialActiveIndex !== undefined ? { initialActiveIndex } : {})}
      />
    </main>
  )
}
