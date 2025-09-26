// @path: src/app/[lang]/timeline/page.tsx
'use client'

import Link from 'next/link'
import {
  timelineEvents,
  overviewCities,
} from '@/features/timeline/data/timeline'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useTimelineCtx } from '@/features/timeline/context'
import { slugify } from '@/shared/lib/slugify'
import scrollIntoView from 'scroll-into-view-if-needed'
import CardsReveal from '@/shared/sections/CardsReveal'
import StrokeTitle from '@/shared/typography/StrokeTitle'
import ViewportCenterLine from '@/shared/ui/ViewportCenterLine'
import { CAM_PRESET } from '@/shared/map/utils/cameraPresets'
import OverviewRailSections from '@/features/timeline/components/OverviewRailSections'
import MobileFillTitle from '@/shared/typography/MobileFillTitle'

export default function TimelineOverviewPage() {
  const { easeTo, isMapReady, setDetailModeAudio } = useTimelineCtx()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const didRestoreRef = useRef(false)
  const [initialActiveIndex, setInitialActiveIndex] = useState<
    number | undefined
  >(undefined)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [sectionProgress, setSectionProgress] = useState(0) // 0 → 1
  const [actionLabel, setActionLabel] = useState('') // "Appuyer…" ou "Cliquer…"

  const itemElsRef = useRef(new Map<string, HTMLElement>())

  // Détermine un libellé unique selon l'appareil (sans afficher les deux)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isTouch =
      window.matchMedia?.('(hover: none), (pointer: coarse)')?.matches ||
      (navigator as any).maxTouchPoints > 0
    setActionLabel(isTouch ? 'Appuyer pour ouvrir' : 'Cliquer pour ouvrir')
  }, [])

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
    for (const entry of overviewCities) map.set(getSlug(entry as any), entry)
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

  const [activeEntry, setActiveEntry] = useState<any | null>(null)
  const pendingRef = useRef<any | null>(null)

  const flyToEntry = useCallback(
    (entry: any) => {
      const doIt = () =>
        easeTo(
          {
            center: entry.center,
            zoom: entry.zoom ?? CAM_PRESET.overview.zoom,
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
    (entry?: any) => {
      if (!entry) return
      setActiveEntry(entry)
      const idx = overviewCities.findIndex((e) => e.id === entry.id)
      setActiveIndex(idx >= 0 ? idx : null)

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
    setActiveIndex(index)

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

  // Progression (0→1) entre l’item actif et le suivant, basée sur la position verticale du centre viewport
  useEffect(() => {
    const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
    const getElByIndex = (idx: number | null) => {
      if (idx == null || idx < 0 || idx >= overviewCities.length) return null
      const slug = getSlug(overviewCities[idx] as any)

      return (
        itemElsRef.current.get(slug) ||
        document.querySelector<HTMLElement>(
          `[data-city-id="${overviewCities[idx]?.id}"]`
        )
      )
    }

    const compute = () => {
      if (activeIndex == null) {
        setSectionProgress(0)
        return
      }
      const cur = getElByIndex(activeIndex)
      const next = getElByIndex(activeIndex + 1)
      if (!cur || !next) {
        setSectionProgress(0)
        return
      }

      const centerY = window.scrollY + window.innerHeight * 0.5
      const topCur = cur.getBoundingClientRect().top + window.scrollY
      const topNext = next.getBoundingClientRect().top + window.scrollY

      const start = topCur
      const end = topNext
      const p = clamp((centerY - start) / Math.max(1, end - start))
      setSectionProgress(p)
    }

    compute()
    const onScroll = () => compute()
    const onResize = () => compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [activeIndex, getSlug])

  const mediaItems = timelineEvents
    .slice(0, 6)
    .map((evt) => ({ kind: 'video' as const, src: evt.image }))
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
            aria-label={`Ouvrir ${activeEntry.title}`}
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
            {/* Wrapper interactif : pas de scale au hover */}
            <div className="group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-xl transition-transform duration-150 active:scale-[0.98]">
              {/* MOBILE : remplissage par derrière avec plateau lissé 25–75% */}
              <div className="block md:hidden">
                <MobileFillTitle
                  title={activeEntry.title}
                  kanji={activeEntry.kanji}
                  progress={sectionProgress}
                  titleFontPx={54}
                  kanjiFontPx={32}
                  gapPx={28}
                  offsetYPx={8}
                />
              </div>

              {/* DESKTOP : SVG stroke animé au hover (aucun scale) */}
              <div className="hidden md:block">
                <StrokeTitle
                  title={activeEntry.title}
                  kanji={activeEntry.kanji}
                  fontPxTitle={136}
                  fontPxKanji={40}
                />
              </div>

              {/* Indice discret, unique (appareil-aware) */}
              {actionLabel && (
                <div
                  aria-hidden
                  className="
      mx-auto mt-3 w-fit rounded-full
      px-2.5 py-1 text-[10px] md:text-xs
      text-white/90 bg-black/20 backdrop-blur-[2px]
      pointer-events-none select-none
      transition-opacity duration-300
      opacity-80 md:opacity-50 md:group-hover:opacity-100
    "
                >
                  {actionLabel}
                </div>
              )}
            </div>
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
