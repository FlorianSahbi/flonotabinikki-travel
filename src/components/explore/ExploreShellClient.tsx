// src/components/explore/ExploreShellClient.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import ExploreMap from '@/components/explore/ExploreMap'
import StoriesFeed from '@/components/stories/StoriesFeed'
import {
  useExploreStore,
  useFocusId,
  useContextForFocus,
} from '@/lib/state/useExploreStore'
import type { FeedItem } from '@/lib/feed'
import type { FeatureCollection, Point } from 'geojson'
import { MapProvider } from '@/app/context/map/context'

type PointLite = { id: string; lat: number; lng: number }

function useIsDesktop() {
  const q = '(min-width: 768px)'
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : matchMedia(q).matches
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = matchMedia(q)
    const on = () => setIsDesktop(mql.matches)
    mql.addEventListener?.('change', on)
    return () => mql.removeEventListener?.('change', on)
  }, [])
  return isDesktop
}

function EmptyPanel({ noPoints }: { noPoints?: boolean }) {
  return (
    <div className="h-full w-full grid place-items-center bg-black text-neutral-400">
      <div className="text-sm">
        {noPoints
          ? 'Aucun point disponible'
          : 'Sélectionnez un point sur la carte'}
      </div>
    </div>
  )
}

export default function ExploreShellClient({
  points,
  videosGeoJSON,
  initialFocusId = null,
  initialContextItems = [],
}: {
  points: PointLite[]
  videosGeoJSON: FeatureCollection<Point, { id: string }>
  initialFocusId?: string | null
  initialContextItems?: FeedItem[]
}) {
  const { lang } = useParams<{ lang?: string }>()
  const isDesktop = useIsDesktop()

  const seedContext = useExploreStore((s) => s.seedContext)
  const setFocus = useExploreStore((s) => s.setFocus)
  const loadContext = useExploreStore((s) => s.loadContext)

  const viewMode = useExploreStore((s) => s.viewMode)
  const setViewMode = useExploreStore((s) => s.setViewMode)

  const focusId = useFocusId()
  const contextForFocus = useContextForFocus()

  const lastMapSeedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (initialFocusId) {
      seedContext(initialFocusId, initialContextItems || [])
      setFocus(initialFocusId, { fetch: false, source: 'system' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!focusId || typeof window === 'undefined') return
    const base = lang ? `/${lang}` : ''
    const next = `${base}/explore/${encodeURIComponent(focusId)}`
    if (window.location.pathname !== next) {
      window.history.replaceState(null, '', next)
    }
  }, [focusId, lang])

  const handleMapSelect = useCallback(
    async (id: string) => {
      await loadContext(id, { force: true })
      setFocus(id, { fetch: false, source: 'map' })
      lastMapSeedIdRef.current = id
      if (!isDesktop) setViewMode('stories')
    },
    [isDesktop, loadContext, setFocus, setViewMode]
  )

  const storiesRemountKey = useMemo(
    () =>
      lastMapSeedIdRef.current ? `map-${lastMapSeedIdRef.current}` : 'static',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastMapSeedIdRef.current]
  )

  const hasPoints = points.length > 0
  const currentId = focusId
  const initialItemsForFeed: FeedItem[] = Array.isArray(contextForFocus)
    ? (contextForFocus as FeedItem[])
    : (initialContextItems ?? [])

  if (!isDesktop) {
    return (
      <div className="h-full w-full relative overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          {viewMode === 'map' ? (
            <motion.div
              key="map"
              className="h-full w-full relative"
              style={{ zIndex: 30 }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {hasPoints ? (
                <MapProvider>
                  <ExploreMap
                    data={videosGeoJSON}
                    activeId={currentId ?? null}
                    onSelectId={handleMapSelect}
                  />
                </MapProvider>
              ) : (
                <EmptyPanel noPoints />
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`stories-${storiesRemountKey}`}
              className="h-full w-full relative"
              style={{ zIndex: 30 }}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="relative h-full w-full">
                {currentId ? (
                  <MapProvider>
                    <StoriesFeed
                      initialId={currentId}
                      initialItems={initialItemsForFeed}
                      videosGeoJSON={videosGeoJSON}
                      showMiniMap={true}
                      controlExternalMap={false}
                    />
                  </MapProvider>
                ) : (
                  <EmptyPanel />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full">
      <MapProvider>
        <div className="relative flex-1 min-w-0 h-full">
          {hasPoints ? (
            <ExploreMap
              data={videosGeoJSON}
              activeId={currentId ?? null}
              onSelectId={handleMapSelect}
            />
          ) : (
            <EmptyPanel noPoints />
          )}
        </div>

        <div className="relative flex-none h-full bg-black border-l border-neutral-800 overflow-hidden aspect-[9/16]">
          {currentId ? (
            <StoriesFeed
              key={storiesRemountKey}
              initialId={currentId}
              initialItems={initialItemsForFeed}
              videosGeoJSON={videosGeoJSON}
              showMiniMap={false}
              controlExternalMap={true}
            />
          ) : (
            <EmptyPanel />
          )}
        </div>
      </MapProvider>
    </div>
  )
}
