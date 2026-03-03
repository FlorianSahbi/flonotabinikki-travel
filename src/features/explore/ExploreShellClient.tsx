// @path: src/features/explore/ExploreShellClient.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import ExploreMap from '@/features/explore/ExploreMap'
import {
  useExploreStore,
  useFocusId,
  useContextForFocus,
} from '@/features/explore/useExploreStore'
import type { FeedItem } from '@/features/feed'
import { fetchClusterVideos } from '@/features/feed'
import type { FeatureCollection, Point } from 'geojson'
import { MapProvider } from '@/shared/map/context/MapContext'
import StoriesFeed from './components/feed/StoriesFeed'
import ClusterFeed from './components/feed/ClusterFeed'
import mapboxgl from 'mapbox-gl'

type PointLite = { id: string; lat: number; lng: number }
type MapApiRef = { getMap: () => any | null } | null

function useIsDesktop() {
  const q = '(min-width: 768px)'
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(q)
    const on = () => setIsDesktop(mql.matches)
    on()
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
  videosGeoJSON: FeatureCollection<Point, { id: string; kind?: 'video' | 'cluster' }>
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

  const [lastMapSeedId, setLastMapSeedId] = useState<string | null>(null)
  const [mapData, setMapData] = useState(videosGeoJSON)
  const [mapPoints, setMapPoints] = useState(points)
  const [clusterMode, setClusterMode] = useState<{
    id: string | null
    items: FeedItem[]
  }>({ id: null, items: [] })
  const mapApiRef = useRef<MapApiRef>(null)

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

  const openClusterOnMap = useCallback(
    async (clusterId: string) => {
      const feedItems = await fetchClusterVideos(clusterId)
      if (!feedItems.length) return

      seedContext(clusterId, feedItems)
      setFocus(clusterId, { fetch: false, source: 'map' })
      setLastMapSeedId(clusterId)

      const clusterPoints: PointLite[] = feedItems.map((v) => ({
        id: v.id,
        lat: v.lat,
        lng: v.lng,
      }))

      const fc: FeatureCollection<Point, { id: string; kind?: 'video' | 'cluster' }> = {
        type: 'FeatureCollection',
        features: clusterPoints.map((p) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { id: p.id, kind: 'video' },
        })),
      }

      setClusterMode({ id: clusterId, items: feedItems })
      setMapPoints(clusterPoints)
      setMapData(fc)

      const map = mapApiRef.current?.getMap?.()
      if (map && clusterPoints.length > 0) {
        const bounds = new (mapboxgl as any).LngLatBounds()
        clusterPoints.forEach((p) => bounds.extend([p.lng, p.lat]))
        try {
          map.fitBounds(bounds, {
            padding: 100,
            maxZoom: 14,
            pitch: 45,
            bearing: 20,
            duration: 1200,
          })
        } catch {}
      }

      if (!isDesktop) setViewMode('stories')
    },
    [isDesktop, setViewMode, seedContext, setFocus]
  )

  const handleExitCluster = useCallback(() => {
    setClusterMode({ id: null, items: [] })
    setMapPoints(points)
    setMapData(videosGeoJSON)

    const map = mapApiRef.current?.getMap?.()
    if (map) {
      try {
        map.easeTo({ pitch: 0, bearing: 0, duration: 400 })
      } catch {}
    }
  }, [points, videosGeoJSON])

  const handleMapSelect = useCallback(
    async (id: string) => {
      await loadContext(id, { force: true })
      setFocus(id, { fetch: false, source: 'map' })
      setLastMapSeedId(id)
      if (!isDesktop) setViewMode('stories')
    },
    [isDesktop, loadContext, setFocus, setViewMode]
  )

  const storiesRemountKey = useMemo(
    () => (lastMapSeedId ? `map-${lastMapSeedId}` : 'static'),
    [lastMapSeedId]
  )

  const hasPoints = mapPoints.length > 0
  const currentId = focusId
  const initialItemsForFeed: FeedItem[] = Array.isArray(contextForFocus)
    ? (contextForFocus as FeedItem[])
    : (initialContextItems ?? [])

  // Shared components
  const mapPanel = (
    <>
      {clusterMode.id && (
        <div className="absolute left-3 top-3 z-[70]">
          <button
            onClick={handleExitCluster}
            className="rounded bg-black/60 px-3 py-1.5 text-xs text-white ring-1 ring-white/20 hover:bg-black/70"
          >
            ← {isDesktop ? 'Retour à la carte globale' : 'Retour'}
          </button>
        </div>
      )}
      <ExploreMap
        data={mapData}
        activeId={currentId ?? null}
        onReady={(api) => (mapApiRef.current = api)}
        onSelectId={handleMapSelect}
      />
    </>
  )

  const feedPanel = clusterMode.id ? (
    <ClusterFeed
      initialItems={clusterMode.items}
      videosGeoJSON={mapData}
      onBack={handleExitCluster}
      controlExternalMap={isDesktop ?? false}
    />
  ) : currentId ? (
    <StoriesFeed
      key={storiesRemountKey}
      initialId={currentId}
      initialItems={initialItemsForFeed}
      videosGeoJSON={mapData}
      showMiniMap={!isDesktop}
      controlExternalMap={isDesktop ?? false}
      onOpenCluster={openClusterOnMap}
    />
  ) : (
    <EmptyPanel />
  )

  // Mobile layout
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
              {hasPoints ? <MapProvider>{mapPanel}</MapProvider> : <EmptyPanel noPoints />}
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
                <MapProvider>{feedPanel}</MapProvider>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="flex h-full w-full">
      <MapProvider>
        <div className="relative flex-1 min-w-0 h-full">
          {hasPoints ? mapPanel : <EmptyPanel noPoints />}
        </div>

        <div className="relative flex-none h-full bg-black border-l border-neutral-800 overflow-hidden aspect-[9/16]">
          {feedPanel}
        </div>
      </MapProvider>
    </div>
  )
}
